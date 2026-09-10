import { useEffect, useState, type FormEvent } from "react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CirclePlus,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Mail,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";
import "./App.css";

type Project = {
  id: number;
  name: string;
  client: string;
  primaryStatusId: string;
  progress: number;
  nextStep: string;
  userIds: number[];
};

type ProjectStatus = { id: string; label: string };
type IdeaStage = { id: string; label: string };
type ImplementationPath = { id: string; label: string };
type Gate = { id: string; label: string; phaseId: string; description: string };
type Idea = {
  id: number;
  projectId: number;
  title: string;
  secondaryStatusId: string;
  problemStatement: string;
  submitter: string;
  ideaOwner: string;
  businessOwner: string;
  implementationPathId: string;
  gateId: string;
  gateStatus: "open" | "passed" | "not-required";
  gateDueDate: string;
  userIds: number[];
};
type User = {
  id: number;
  displayName: string;
  email: string;
  active: boolean;
  externalId: string | null;
  source: "local" | "iam";
};
type TaskTemplate = { id: number; title: string; active: boolean };
type ProjectTask = {
  id: number;
  projectId: number;
  title: string;
  completed: boolean;
  templateId: number | null;
  dueDate: string;
};
type Reminder = {
  id: string;
  kind: "Aufgabe" | "Gate" | "Pfadfinder-Call";
  projectId: number;
  title: string;
  dueDate: string;
};
type CalendarEvent = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  type: "InnoBoard V" | "Pfadfinder-Call" | "Workshop";
  projectId: number | null;
  ideaIds: number[];
};
type MailSettings = {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  fromAddress: string;
  secure: boolean;
};
type PortalData = {
  projects: Project[];
  projectStatuses: ProjectStatus[];
  ideas: Idea[];
  ideaStages: IdeaStage[];
  implementationPaths: ImplementationPath[];
  gates: Gate[];
  taskTemplates: TaskTemplate[];
  projectTasks: ProjectTask[];
  users: User[];
};

const APP_VERSION = "0.3.0";

const initialProjects: Project[] = [
  {
    id: 1,
    name: "Digitaler Empfang",
    client: "Hofmann & Partner",
    primaryStatusId: "active",
    progress: 64,
    nextStep: "Workshop vorbereiten",
    userIds: [],
  },
  {
    id: 2,
    name: "CRM-Neustart",
    client: "Kernwerk GmbH",
    primaryStatusId: "active",
    progress: 42,
    nextStep: "Abnahme planen",
    userIds: [],
  },
  {
    id: 3,
    name: "Prozesslandkarte",
    client: "Stadtwerke Nord",
    primaryStatusId: "planned",
    progress: 27,
    nextStep: "Interviews terminieren",
    userIds: [],
  },
];

const initialStatuses: ProjectStatus[] = [
  { id: "planned", label: "Geplant" },
  { id: "active", label: "In Bearbeitung" },
];

const initialMailSettings: MailSettings = {
  enabled: false,
  host: "",
  port: 587,
  username: "",
  fromAddress: "",
  secure: true,
};

function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [projectStatuses, setProjectStatuses] =
    useState<ProjectStatus[]>(initialStatuses);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideaStages, setIdeaStages] = useState<IdeaStage[]>([]);
  const [implementationPaths, setImplementationPaths] = useState<
    ImplementationPath[]
  >([]);
  const [gates, setGates] = useState<Gate[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [mailSettings, setMailSettings] =
    useState<MailSettings>(initialMailSettings);
  const [users, setUsers] = useState<User[]>([]);
  const [inviteEventId, setInviteEventId] = useState<number | null>(null);
  const [inviteRecipients, setInviteRecipients] = useState("");
  const [apiAvailable, setApiAvailable] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("all");
  const [ideaQuery, setIdeaQuery] = useState("");
  const [ideaStageFilter, setIdeaStageFilter] = useState("all");
  const [ideaPathFilter, setIdeaPathFilter] = useState("all");
  const [onlyOpenGates, setOnlyOpenGates] = useState(false);
  const [page, setPage] = useState<
    "overview" | "projects" | "ideas" | "events" | "users" | "settings"
  >("overview");
  const [form, setForm] = useState<"project" | "idea" | "event" | "user" | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState(1);
  const [ideaProjectId, setIdeaProjectId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/portal")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: PortalData) => {
        setProjects(data.projects);
        setProjectStatuses(data.projectStatuses);
        setIdeas(data.ideas);
        setIdeaStages(data.ideaStages);
        setImplementationPaths(data.implementationPaths);
        setGates(data.gates);
        setTaskTemplates(data.taskTemplates);
        setProjectTasks(data.projectTasks);
        setUsers(data.users);
        setApiAvailable(true);
      })
      .catch(() => setApiAvailable(false));
    fetch("/api/reminders")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: Reminder[]) => setReminders(data))
      .catch(() => setReminders([]));
    fetch("/api/events")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: CalendarEvent[]) => setEvents(data))
      .catch(() => setEvents([]));
    fetch("/api/settings/mail")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: MailSettings) => setMailSettings(data))
      .catch(() => setMailSettings(initialMailSettings));
  }, []);

  const updateProjectStatus = async (
    projectId: number,
    primaryStatusId: string,
  ) => {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ primaryStatusId }),
    });
    if (!response.ok)
      return setMessage("Der Projektstatus konnte nicht gespeichert werden.");
    const updated = (await response.json()) as Project;
    setProjects((current) =>
      current.map((project) => (project.id === updated.id ? updated : project)),
    );
  };

  const updateIdea = async (ideaId: number, update: Partial<Idea>) => {
    const response = await fetch(`/api/ideas/${ideaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok)
      return setMessage("Die Ideenakte konnte nicht gespeichert werden.");
    const updated = (await response.json()) as Idea;
    setIdeas((current) =>
      current.map((idea) => (idea.id === updated.id ? updated : idea)),
    );
    fetch("/api/reminders")
      .then((response) => response.json())
      .then((data: Reminder[]) => setReminders(data));
  };

  const createProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userIds = formData.getAll("userIds").map(Number);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...Object.fromEntries(formData), userIds }),
    });
    if (!response.ok) return setMessage("Bitte alle Projektfelder ausfüllen.");
    const project = (await response.json()) as Project;
    setProjects((current) => [...current, project]);
    setSelectedProjectId(project.id);
    setForm(null);
    setPage("projects");
  };

  const createIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    const userIds = formData.getAll("userIds").map(Number);
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, projectId: Number(data.projectId), userIds }),
    });
    if (!response.ok)
      return setMessage("Bitte Projekt, Titel und Innovationsstatus wählen.");
    const idea = (await response.json()) as Idea;
    setIdeas((current) => [...current, idea]);
    setForm(null);
    setPage("ideas");
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
    });
    if (!response.ok) return setMessage("Bitte einen Benutzernamen eingeben.");
    const user = (await response.json()) as User;
    setUsers((current) => [...current, user]);
    setForm(null);
    setMessage("Benutzer angelegt.");
  };

  const updateUser = async (userId: number, update: Partial<User>) => {
    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) return setMessage("Der Benutzer konnte nicht gespeichert werden.");
    const updated = (await response.json()) as User;
    setUsers((current) => current.map((user) => user.id === updated.id ? updated : user));
  };

  const createEvent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const ideaIds = formData.getAll("ideaIds").map(Number);
    const projectId = formData.get("projectId")?.toString();
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        date: formData.get("date"),
        time: formData.get("time"),
        location: formData.get("location"),
        type: formData.get("type"),
        projectId: projectId ? Number(projectId) : null,
        ideaIds,
      }),
    });
    if (!response.ok) return setMessage("Bitte die Terminangaben prüfen.");
    const createdEvent = (await response.json()) as CalendarEvent;
    setEvents((current) => [...current, createdEvent]);
    setForm(null);
    setMessage("Termin angelegt.");
  };

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    const response = await fetch(`/api/projects/${selectedProjectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, progress: Number(data.progress), userIds: formData.getAll("userIds").map(Number) }),
    });
    if (!response.ok)
      return setMessage("Die Projektakte konnte nicht gespeichert werden.");
    const updated = (await response.json()) as Project;
    setProjects((current) =>
      current.map((project) => (project.id === updated.id ? updated : project)),
    );
    setMessage("Projektakte gespeichert.");
  };

  const updateTask = async (taskId: number, update: Partial<ProjectTask>) => {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) return setMessage("Die Aufgabe konnte nicht gespeichert werden.");
    const updated = (await response.json()) as ProjectTask;
    setProjectTasks((current) =>
      current.map((task) => (task.id === updated.id ? updated : task)),
    );
    fetch("/api/reminders")
      .then((response) => response.json())
      .then((data: Reminder[]) => setReminders(data));
  };

  const updateEventIdeas = async (eventId: number, ideaIds: number[]) => {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ideaIds }),
    });
    if (!response.ok) return setMessage("Die Ideenverknüpfung konnte nicht gespeichert werden.");
    const updated = (await response.json()) as CalendarEvent;
    setEvents((current) =>
      current.map((event) => (event.id === updated.id ? updated : event)),
    );
  };

  const saveMailSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch("/api/settings/mail", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mailSettings),
    });
    if (!response.ok) return setMessage("Die Mail-Einstellungen konnten nicht gespeichert werden.");
    setMailSettings((await response.json()) as MailSettings);
    setMessage("Mail-Einstellungen gespeichert. Der Versand ist noch nicht angebunden.");
  };

  const openEventInvite = (event: CalendarEvent) => {
    setInviteEventId((current) => (current === event.id ? null : event.id));
    setInviteRecipients("");
  };

  const createEventMailto = (event: CalendarEvent) => {
    const linkedIdeas = event.ideaIds
      .map((ideaId) => ideas.find((idea) => idea.id === ideaId)?.title)
      .filter(Boolean);
    const linkedProjectIds = [
      event.projectId,
      ...event.ideaIds.map((ideaId) => ideas.find((idea) => idea.id === ideaId)?.projectId ?? null),
    ].filter((projectId): projectId is number => projectId !== null);
    const linkedProjects = [...new Set(linkedProjectIds)].map(projectName);
    const body = [
      `Einladung: ${event.title}`,
      "",
      `Datum: ${event.date}`,
      `Zeit: ${event.time} Uhr`,
      `Ort: ${event.location}`,
      linkedProjects.length ? `Projekte: ${linkedProjects.join(", ")}` : "",
      linkedIdeas.length ? `Ideen: ${linkedIdeas.join(", ")}` : "",
    ].filter(Boolean).join("\n");
    window.open(`mailto:${encodeURIComponent(inviteRecipients.trim())}?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(body)}`, "_self");
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title")?.toString() ?? "";
    const dueDate = formData.get("dueDate")?.toString() ?? "";
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProjectId, title, dueDate }),
    });
    if (!response.ok) return setMessage("Bitte einen Aufgabentitel eingeben.");
    const task = (await response.json()) as ProjectTask;
    setProjectTasks((current) => [...current, task]);
    event.currentTarget.reset();
  };

  const createTaskTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = new FormData(event.currentTarget).get("title")?.toString() ?? "";
    const response = await fetch("/api/task-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) return setMessage("Bitte einen Titel für die Standardaufgabe eingeben.");
    const template = (await response.json()) as TaskTemplate;
    setTaskTemplates((current) => [...current, template]);
    event.currentTarget.reset();
  };

  const updateTaskTemplate = async (
    templateId: number,
    update: Partial<TaskTemplate>,
  ) => {
    const response = await fetch(`/api/task-templates/${templateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (!response.ok) return setMessage("Die Standardaufgabe konnte nicht gespeichert werden.");
    const updated = (await response.json()) as TaskTemplate;
    setTaskTemplates((current) =>
      current.map((template) =>
        template.id === updated.id ? updated : template,
      ),
    );
  };

  const projectName = (projectId: number) =>
    projects.find((project) => project.id === projectId)?.name ??
    "Unbekanntes Projekt";
  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId,
  );
  const filteredProjects = projects.filter(
    (project) =>
      (projectStatusFilter === "all" ||
        project.primaryStatusId === projectStatusFilter) &&
      `${project.name} ${project.client}`
        .toLowerCase()
        .includes(projectQuery.toLowerCase()),
  );
  const filteredIdeas = ideas.filter(
    (idea) =>
      (ideaStageFilter === "all" || idea.secondaryStatusId === ideaStageFilter) &&
      (ideaPathFilter === "all" || idea.implementationPathId === ideaPathFilter) &&
      (!onlyOpenGates || idea.gateStatus === "open") &&
      `${idea.title} ${idea.problemStatement} ${projectName(idea.projectId)}`
        .toLowerCase()
        .includes(ideaQuery.toLowerCase()),
  );
  const phaseSignal = (stageId: string) => {
    const stageIdeas = ideas.filter(
      (idea) => idea.secondaryStatusId === stageId,
    );
    if (stageIdeas.length === 0) return "empty";
    if (stageIdeas.some((idea) => idea.gateStatus === "open")) return "open";
    if (stageIdeas.every((idea) => idea.gateStatus === "passed")) return "passed";
    return "not-required";
  };
  const openProjectForm = () => {
    setMessage("");
    setForm("project");
  };
  const openIdeaForm = (projectId: number | null = null) => {
    setMessage("");
    setIdeaProjectId(projectId);
    setForm("idea");
  };
  const openEventForm = () => {
    setMessage("");
    setForm("event");
  };
  const openUserForm = () => {
    setMessage("");
    setForm("user");
  };

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/">
          Project-Tool<span>Inno V</span>
        </a>
        <nav aria-label="Hauptnavigation">
          <button
            className={`nav-item ${page === "overview" ? "active" : ""}`}
            type="button"
            onClick={() => setPage("overview")}
          >
            <LayoutDashboard size={18} /> Übersicht
          </button>
          <button
            className={`nav-item ${page === "projects" ? "active" : ""}`}
            type="button"
            onClick={() => setPage("projects")}
          >
            <FolderKanban size={18} /> Projekte
          </button>
          <button
            className={`nav-item ${page === "ideas" ? "active" : ""}`}
            type="button"
            onClick={() => setPage("ideas")}
          >
            <Lightbulb size={18} /> Ideen
          </button>
          <button
            className={`nav-item ${page === "events" ? "active" : ""}`}
            type="button"
            onClick={() => setPage("events")}
          >
            <CalendarDays size={18} /> Termine
          </button>
          <button
            className={`nav-item ${page === "settings" ? "active" : ""}`}
            type="button"
            onClick={() => setPage("settings")}
          >
            <Settings size={18} /> Einstellungen
          </button>
          <button
            className={`nav-item ${page === "users" ? "active" : ""}`}
            type="button"
            onClick={() => setPage("users")}
          >
            <FolderKanban size={18} /> Benutzer
          </button>
        </nav>
        <div className="sidebar-footer">
          <span className={apiAvailable ? "status online" : "status"}></span>
          {apiAvailable ? "In-Memory-API aktiv" : "Lokale Vorschau"}
          <small>v{APP_VERSION}</small>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="crumb">
            Projektportal <ChevronRight size={15} />{" "}
            {page === "overview"
              ? "Übersicht"
              : page === "projects"
                ? "Projekte"
                : page === "ideas"
                  ? "Ideen"
                  : page === "events"
                    ? "Termine"
                    : page === "users"
                      ? "Benutzer"
                      : "Einstellungen"}
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="Benachrichtigungen"
          >
            <Bell size={19} />
          </button>
        </header>
        <div className="content">
          <div className="title-row">
            <div>
              <p className="eyebrow">Projektbegleitung</p>
              <h1>
                {page === "overview"
                  ? "Project-Tool Inno V"
                  : page === "projects"
                    ? "Projekte steuern."
                    : page === "ideas"
                      ? "Ideen entwickeln."
                      : page === "events"
                        ? "Termine koordinieren."
                        : page === "users"
                          ? "Benutzer verwalten."
                          : "Einstellungen verwalten."}
              </h1>
            </div>
            {page !== "settings" && (
              <button
                className="primary-button"
                type="button"
                onClick={
                  page === "ideas"
                    ? () => openIdeaForm()
                    : page === "events"
                      ? openEventForm
                      : page === "users"
                        ? openUserForm
                      : openProjectForm
                }
              >
                <CirclePlus size={18} />{" "}
                {page === "ideas"
                  ? "Idee anlegen"
                  : page === "events"
                    ? "Termin anlegen"
                    : page === "users"
                      ? "Benutzer anlegen"
                    : "Projekt anlegen"}
              </button>
            )}
          </div>

          {message && <p className="message">{message}</p>}
          {page === "overview" && (
            <>
              <section className="overview" aria-label="Übersicht">
                <button
                  className="overview-link"
                  type="button"
                  onClick={() => setPage("projects")}
                >
                  <span>Aktive Projekte</span>
                  <strong>{projects.length}</strong>
                  <small>Projektakte öffnen</small>
                </button>
                <button
                  className="overview-link"
                  type="button"
                  onClick={() => setPage("ideas")}
                >
                  <span>Begleitete Ideen</span>
                  <strong>{ideas.length}</strong>
                  <small>Ideenportfolio öffnen</small>
                </button>
                <button
                  className="overview-link"
                  type="button"
                  onClick={() => setPage("projects")}
                >
                  <span>Offene Schritte</span>
                  <strong>
                    {
                      projects.filter(
                        (project) => project.primaryStatusId !== "completed",
                      ).length
                    }
                  </strong>
                  <small>Projektübersicht öffnen</small>
                </button>
              </section>
              <section className="reminder-panel" aria-label="Termine aus Projekten und Ideen">
                <div className="section-heading">
                  <div>
                    <h2>Aus Projekten und Ideen</h2>
                    <p>Fälligkeiten aus Aufgaben, Gates und Pfadfinder-Calls.</p>
                  </div>
                </div>
                <div className="reminder-list">
                  {reminders.slice(0, 5).map((reminder) => (
                    <button
                      className="reminder-row"
                      key={reminder.id}
                      type="button"
                      onClick={() => {
                        setSelectedProjectId(reminder.projectId);
                        setPage("projects");
                      }}
                    >
                      <time dateTime={reminder.dueDate}>{reminder.dueDate}</time>
                      <span>{reminder.kind}</span>
                      <strong>{reminder.title}</strong>
                      <small>{projectName(reminder.projectId)}</small>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                  {reminders.length === 0 && (
                    <p className="empty-state">Keine offenen Fälligkeiten.</p>
                  )}
                </div>
              </section>
              <section className="overview-calendar-lists" aria-label="Terminübersicht">
                <div className="reminder-panel">
                  <div className="section-heading">
                    <div>
                      <h2>Aus der Terminverwaltung</h2>
                      <p>Geplante Sitzungen, Workshops und Calls.</p>
                    </div>
                    <button className="text-button" type="button" onClick={() => setPage("events")}>
                      Alle Termine <ChevronRight size={16} />
                    </button>
                  </div>
                  <div className="reminder-list">
                    {events.slice().sort((left, right) => `${left.date}T${left.time}`.localeCompare(`${right.date}T${right.time}`)).slice(0, 5).map((calendarEvent) => (
                      <button className="reminder-row" key={calendarEvent.id} type="button" onClick={() => setPage("events")}>
                        <time dateTime={`${calendarEvent.date}T${calendarEvent.time}`}>{calendarEvent.date}</time>
                        <span>{calendarEvent.type}</span>
                        <strong>{calendarEvent.title}</strong>
                        <small>{calendarEvent.location}</small>
                        <ChevronRight size={17} />
                      </button>
                    ))}
                    {events.length === 0 && <p className="empty-state">Keine verwalteten Termine.</p>}
                  </div>
                </div>
              </section>
              <section className="projects-section">
                <div className="section-heading">
                  <div>
                    <h2>Aktuelle Projekte</h2>
                    <p>Begleitungen mit dem nächsten sinnvollen Schritt.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setPage("projects")}
                    type="button"
                  >
                    Alle Projekte <ChevronRight size={16} />
                  </button>
                </div>
                <div className="project-list">
                  {projects.slice(0, 3).map((project) => (
                    <ProjectRow
                      key={project.id}
                      project={project}
                      projectStatuses={projectStatuses}
                      ideas={ideas}
                      editable={false}
                      updateProjectStatus={updateProjectStatus}
                      onOpen={() => {
                        setSelectedProjectId(project.id);
                        setPage("projects");
                      }}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
          {page === "projects" && (
            <section className="projects-section">
              <div className="section-heading">
                <div>
                  <h2>Projektübersicht</h2>
                  <p>
                    Ein Projekt bündelt seine Ideen und ihre Innovationsarbeit.
                  </p>
                </div>
              </div>
              <div className="filter-bar">
                <label className="search-field"><Search size={16} /><input value={projectQuery} onChange={(event) => setProjectQuery(event.target.value)} placeholder="Projekte durchsuchen" /></label>
                <select value={projectStatusFilter} onChange={(event) => setProjectStatusFilter(event.target.value)} aria-label="Projektstatus filtern"><option value="all">Alle Status</option>{projectStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select>
              </div>
              <div className="project-tabs">
                {filteredProjects.map((project) => (
                  <button
                    key={project.id}
                    className={
                      project.id === selectedProjectId ? "selected" : ""
                    }
                    onClick={() => setSelectedProjectId(project.id)}
                    type="button"
                  >
                    <span>{project.name.slice(0, 1)}</span>
                    {project.name}
                  </button>
                ))}
              </div>
              {selectedProject && (
                <div className="project-workbench">
                  <ProjectCockpit
                    ideas={ideas.filter(
                      (idea) => idea.projectId === selectedProject.id,
                    )}
                    tasks={projectTasks.filter(
                      (task) => task.projectId === selectedProject.id,
                    )}
                    ideaStages={ideaStages}
                  />
                  <section className="project-editor">
                    <div>
                      <p className="eyebrow">Projektakte</p>
                      <h2>{selectedProject.name}</h2>
                    </div>
                    <form onSubmit={saveProject}>
                      <label>
                        Projektname
                        <input
                          name="name"
                          defaultValue={selectedProject.name}
                          required
                        />
                      </label>
                      <label>
                        Organisation
                        <input
                          name="client"
                          defaultValue={selectedProject.client}
                          required
                        />
                      </label>
                      <div className="form-columns">
                        <label>
                          Projektstatus
                          <select
                            name="primaryStatusId"
                            defaultValue={selectedProject.primaryStatusId}
                          >
                            {projectStatuses.map((status) => (
                              <option key={status.id} value={status.id}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Fortschritt
                          <input
                            name="progress"
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={selectedProject.progress}
                            required
                          />
                        </label>
                      </div>
                      <label>
                        Nächster Schritt
                        <input
                          name="nextStep"
                          defaultValue={selectedProject.nextStep}
                          required
                        />
                      </label>
                      <label>
                        Zugeordnete Benutzer
                        <select name="userIds" multiple defaultValue={selectedProject.userIds.map(String)}>
                          {users.map((user) => (
                            <option key={user.id} value={user.id} disabled={!user.active}>
                              {user.displayName}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button className="primary-button" type="submit">
                        Projekt speichern
                      </button>
                    </form>
                  </section>
                  <section className="linked-ideas">
                    <div className="linked-heading">
                      <div>
                        <p className="eyebrow">Verknüpfte Ideen</p>
                        <h2>
                          {
                            ideas.filter(
                              (idea) => idea.projectId === selectedProject.id,
                            ).length
                          }{" "}
                          Ideen
                        </h2>
                      </div>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => openIdeaForm(selectedProject.id)}
                      >
                        <Plus size={17} /> Idee hinzufügen
                      </button>
                    </div>
                    {ideas
                      .filter((idea) => idea.projectId === selectedProject.id)
                      .map((idea) => (
                        <article key={idea.id} className="linked-idea">
                          <div>
                            <strong>{idea.title}</strong>
                            <span>
                              {
                                ideaStages
                                  .find(
                                    (stage) =>
                                      stage.id === idea.secondaryStatusId,
                                  )
                                  ?.label.split(" - ")[0]
                              }
                            </span>
                          </div>
                          <p>{idea.problemStatement}</p>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => setPage("ideas")}
                          >
                            Öffnen <ChevronRight size={16} />
                          </button>
                        </article>
                      ))}
                    {ideas.every(
                      (idea) => idea.projectId !== selectedProject.id,
                    ) && (
                      <p className="empty-state">
                        Diesem Projekt sind noch keine Ideen zugeordnet.
                      </p>
                    )}
                  </section>
                  <ProjectTaskList
                    tasks={projectTasks.filter(
                      (task) => task.projectId === selectedProject.id,
                    )}
                    onToggle={(taskId, completed) =>
                      updateTask(taskId, { completed })
                    }
                    onUpdate={updateTask}
                    onCreate={createTask}
                  />
                </div>
              )}
            </section>
          )}
          {page === "users" && (
            <section className="users-section">
              <div className="section-heading">
                <div>
                  <h2>Benutzerverzeichnis</h2>
                  <p>Lokale Testbenutzer für direkte Projekt- und Ideen-Zuordnungen.</p>
                </div>
              </div>
              <div className="settings-panel user-list">
                {users.map((user) => (
                  <div className="user-row" key={user.id}>
                    <div className="user-avatar">{user.displayName.slice(0, 1)}</div>
                    <label>
                      Name
                      <input defaultValue={user.displayName} onBlur={(event) => {
                        if (event.target.value !== user.displayName) updateUser(user.id, { displayName: event.target.value });
                      }} />
                    </label>
                    <label>
                      E-Mail
                      <input type="email" defaultValue={user.email} onBlur={(event) => {
                        if (event.target.value !== user.email) updateUser(user.id, { email: event.target.value });
                      }} />
                    </label>
                    <label className="toggle-filter">
                      <input type="checkbox" checked={user.active} onChange={(event) => updateUser(user.id, { active: event.target.checked })} />
                      Aktiv
                    </label>
                    <small>{user.source === "iam" ? `IAM: ${user.externalId ?? "ohne externe ID"}` : "Lokaler Benutzer"}</small>
                  </div>
                ))}
              </div>
              <p className="settings-note">Die externe IAM-ID und Rollen können später ergänzt werden, ohne bestehende Zuordnungen über die Benutzer-ID zu ändern.</p>
            </section>
          )}
          {page === "settings" && (
            <section className="settings-section">
              <div className="section-heading">
                <div>
                  <h2>Standard-Taskliste</h2>
                  <p>
                    Aktive Einträge werden neuen Projekten automatisch als
                    Aufgaben zugeordnet.
                  </p>
                </div>
              </div>
              <div className="settings-panel">
                <form className="add-task-form" onSubmit={createTaskTemplate}>
                  <label>
                    Neue Standardaufgabe
                    <input name="title" required />
                  </label>
                  <button className="primary-button" type="submit">
                    <Plus size={17} /> Hinzufügen
                  </button>
                </form>
                <div className="template-list">
                  {taskTemplates.map((template) => (
                    <label className="template-row" key={template.id}>
                      <input
                        type="checkbox"
                        checked={template.active}
                        onChange={(event) =>
                          updateTaskTemplate(template.id, {
                            active: event.target.checked,
                          })
                        }
                      />
                      <input
                        aria-label={`Titel für ${template.title}`}
                        defaultValue={template.title}
                        onBlur={(event) => {
                          if (event.target.value !== template.title) {
                            updateTaskTemplate(template.id, {
                              title: event.target.value,
                            });
                          }
                        }}
                      />
                      <span>{template.active ? "Aktiv" : "Inaktiv"}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="settings-panel mail-settings-panel">
                <div className="section-heading">
                  <div>
                    <h2>Mailversand für Termine</h2>
                    <p>Vorbereitung für einen späteren Mailhost. Aktuell wird kein Serverversand ausgeführt.</p>
                  </div>
                  <Mail size={22} aria-hidden="true" />
                </div>
                <form className="mail-settings-form" onSubmit={saveMailSettings}>
                  <label className="toggle-filter"><input type="checkbox" checked={mailSettings.enabled} onChange={(event) => setMailSettings((current) => ({ ...current, enabled: event.target.checked }))} /> Mailversand später aktivieren</label>
                  <div className="form-columns">
                    <label>Mailhost<input value={mailSettings.host} onChange={(event) => setMailSettings((current) => ({ ...current, host: event.target.value }))} placeholder="smtp.example.org" /></label>
                    <label>Port<input type="number" min="1" max="65535" value={mailSettings.port} onChange={(event) => setMailSettings((current) => ({ ...current, port: Number(event.target.value) }))} /></label>
                  </div>
                  <div className="form-columns">
                    <label>Benutzername<input value={mailSettings.username} onChange={(event) => setMailSettings((current) => ({ ...current, username: event.target.value }))} /></label>
                    <label>Absenderadresse<input type="email" value={mailSettings.fromAddress} onChange={(event) => setMailSettings((current) => ({ ...current, fromAddress: event.target.value }))} placeholder="inno@example.org" /></label>
                  </div>
                  <label className="toggle-filter"><input type="checkbox" checked={mailSettings.secure} onChange={(event) => setMailSettings((current) => ({ ...current, secure: event.target.checked }))} /> TLS/SSL verwenden</label>
                  <button className="primary-button" type="submit">Mail-Einstellungen speichern</button>
                </form>
              </div>
            </section>
          )}
          {page === "events" && (
            <section className="events-section">
              <div className="section-heading">
                <div>
                  <h2>Terminkalender 2027</h2>
                  <p>Fiktive Planungsdaten für die Präsentation des InnoBoard V.</p>
                </div>
              </div>
              <div className="event-timeline">
                {events.map((event) => {
                  const date = new Date(`${event.date}T${event.time}`);
                  return <article className="event-card" key={event.id}>
                    <time dateTime={event.date}><strong>{date.toLocaleDateString("de-CH", { day: "2-digit" })}</strong><span>{date.toLocaleDateString("de-CH", { month: "short", year: "numeric" })}</span></time>
                    <div><span className="event-type"><CalendarDays size={15} /> {event.type}</span><h3>{event.title}</h3><p>{event.time} Uhr · {event.location}</p></div>
                    <label className="event-ideas">Ideen für die Sitzung
                      <select multiple value={event.ideaIds.map(String)} onChange={(selectEvent) => updateEventIdeas(event.id, Array.from(selectEvent.target.selectedOptions, (option) => Number(option.value)))}>
                        {ideas.map((idea) => <option key={idea.id} value={idea.id}>{idea.title}</option>)}
                      </select>
                    </label>
                    <div className="event-idea-chips">{event.ideaIds.length ? event.ideaIds.map((ideaId) => <span key={ideaId}>{ideas.find((idea) => idea.id === ideaId)?.title}</span>) : <small>Keine Ideen verknüpft</small>}</div>
                    <button className="secondary-button event-invite-button" type="button" onClick={() => openEventInvite(event)}><Mail size={16} /> Einladung vorbereiten</button>
                    {inviteEventId === event.id && <div className="event-invite-panel">
                      <label>Empfänger (Komma getrennt)
                        <input type="text" value={inviteRecipients} onChange={(inputEvent) => setInviteRecipients(inputEvent.target.value)} placeholder="name@example.org, team@example.org" />
                      </label>
                      <p>Öffnet einen Entwurf im lokalen Mailprogramm mit Termin, Projekt und verknüpften Ideen.</p>
                      <button className="primary-button" type="button" disabled={!inviteRecipients.trim()} onClick={() => createEventMailto(event)}>Mailentwurf öffnen</button>
                    </div>}
                  </article>;
                })}
              </div>
            </section>
          )}
          {page === "ideas" && (
            <section className="ideas-section">
              <div className="section-heading">
                <div>
                  <h2>Innovationsportfolio</h2>
                  <p>
                    Bedarf, Rollen, Umsetzungspfad und Gate an einer Stelle
                    steuern.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => openIdeaForm()}
                >
                  <Plus size={17} /> Idee anlegen
                </button>
              </div>
              <div className="filter-bar idea-filters">
                <label className="search-field"><Search size={16} /><input value={ideaQuery} onChange={(event) => setIdeaQuery(event.target.value)} placeholder="Ideen durchsuchen" /></label>
                <select value={ideaStageFilter} onChange={(event) => setIdeaStageFilter(event.target.value)} aria-label="Phase filtern"><option value="all">Alle Phasen</option>{ideaStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label.split(" - ")[0]}</option>)}</select>
                <select value={ideaPathFilter} onChange={(event) => setIdeaPathFilter(event.target.value)} aria-label="Umsetzungspfad filtern"><option value="all">Alle Umsetzungspfade</option>{implementationPaths.map((path) => <option key={path.id} value={path.id}>{path.label}</option>)}</select>
                <label className="toggle-filter"><input type="checkbox" checked={onlyOpenGates} onChange={(event) => setOnlyOpenGates(event.target.checked)} /> Nur offene Gates</label>
              </div>
              <div className="idea-board">
                <div className="process-strip">
                  {ideaStages.map((stage) => (
                    <span
                      className={`phase-label ${phaseSignal(stage.id)}`}
                      key={stage.id}
                    >
                      <i aria-hidden="true" />
                      {stage.label.split(" - ")[0]}
                    </span>
                  ))}
                </div>
                <div className="idea-grid">
                  {ideaStages.map((stage) => (
                    <section className="idea-column" key={stage.id}>
                      {filteredIdeas
                        .filter((idea) => idea.secondaryStatusId === stage.id)
                        .map((idea) => (
                          <article className="idea-card" key={idea.id}>
                            <div className="idea-card-head">
                              <div className="idea-icon">
                                <Lightbulb size={19} />
                              </div>
                              <span className={`gate ${idea.gateStatus}`}>
                                <i aria-hidden="true" />
                                {gates.find((gate) => gate.id === idea.gateId)
                                  ?.label ?? "Gate offen"}
                              </span>
                            </div>
                            <p>{projectName(idea.projectId)}</p>
                            <h3>{idea.title}</h3>
                            <p className="problem">{idea.problemStatement}</p>
                            <div className="idea-fields">
                              <label>
                                Phase
                                <select
                                  value={idea.secondaryStatusId}
                                  onChange={(event) =>
                                    updateIdea(idea.id, {
                                      secondaryStatusId: event.target.value,
                                    })
                                  }
                                >
                                  {ideaStages.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Umsetzungspfad
                                <select
                                  value={idea.implementationPathId}
                                  onChange={(event) =>
                                    updateIdea(idea.id, {
                                      implementationPathId: event.target.value,
                                    })
                                  }
                                >
                                  <option value="">Noch offen</option>
                                  {implementationPaths.map((path) => (
                                    <option key={path.id} value={path.id}>
                                      {path.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <div className="role-line">
                                <span>
                                  Ideenowner <strong>{idea.ideaOwner}</strong>
                                </span>
                                <span>
                                  Business-Owner{" "}
                                  <strong>
                                    {idea.businessOwner || "Noch offen"}
                                  </strong>
                                </span>
                              </div>
                              <label>
                                Zugeordnete Benutzer
                                <select
                                  multiple
                                  value={idea.userIds.map(String)}
                                  onChange={(event) =>
                                    updateIdea(idea.id, {
                                      userIds: Array.from(event.target.selectedOptions, (option) => Number(option.value)),
                                    })
                                  }
                                >
                                  {users.map((user) => (
                                    <option key={user.id} value={user.id} disabled={!user.active}>
                                      {user.displayName}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Steuerungsgate
                                <select
                                  value={idea.gateId}
                                  onChange={(event) =>
                                    updateIdea(idea.id, {
                                      gateId: event.target.value,
                                    })
                                  }
                                >
                                  {gates.map((gate) => (
                                    <option key={gate.id} value={gate.id}>
                                      {gate.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                Gate-Entscheid
                                <select
                                  value={idea.gateStatus}
                                  onChange={(event) =>
                                    updateIdea(idea.id, {
                                      gateStatus: event.target
                                        .value as Idea["gateStatus"],
                                    })
                                  }
                                >
                                  <option value="open">Offen</option>
                                  <option value="passed">Bestanden</option>
                                  <option value="not-required">
                                    Nicht erforderlich
                                  </option>
                                </select>
                              </label>
                              <label>
                                Gate fällig am
                                <input
                                  type="date"
                                  value={idea.gateDueDate}
                                  onChange={(event) =>
                                    updateIdea(idea.id, {
                                      gateDueDate: event.target.value,
                                    })
                                  }
                                />
                              </label>
                            </div>
                          </article>
                        ))}
                      {filteredIdeas.every(
                        (idea) => idea.secondaryStatusId !== stage.id,
                      ) && <p className="empty-phase">Keine Ideen</p>}
                    </section>
                  ))}
                </div>
              </div>
            </section>
          )}
          {form && (
            <div className="dialog-backdrop" role="presentation">
              <section
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="dialog-title"
              >
                <div className="dialog-header">
                  <div>
                    <p className="eyebrow">Neu anlegen</p>
                    <h2 id="dialog-title">
                      {form === "project"
                        ? "Projekt anlegen"
                        : form === "event"
                          ? "Termin anlegen"
                          : form === "user"
                            ? "Benutzer anlegen"
                          : "Idee anlegen"}
                    </h2>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Dialog schließen"
                    onClick={() => setForm(null)}
                  >
                    <X size={19} />
                  </button>
                </div>
                {form === "project" ? (
                  <form onSubmit={createProject}>
                    <label>
                      Projektname
                      <input name="name" required />
                    </label>
                    <label>
                      Organisation
                      <input name="client" required />
                    </label>
                    <label>
                      Projektstatus
                      <select
                        name="primaryStatusId"
                        defaultValue={projectStatuses[0]?.id}
                        required
                      >
                        {projectStatuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Nächster Schritt
                      <input name="nextStep" required />
                    </label>
                    <label>
                      Zugeordnete Benutzer
                      <select name="userIds" multiple>
                        {users.map((user) => (
                          <option key={user.id} value={user.id} disabled={!user.active}>
                            {user.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setForm(null)}
                      >
                        Abbrechen
                      </button>
                      <button className="primary-button" type="submit">
                        Projekt erstellen
                      </button>
                    </div>
                  </form>
                ) : form === "event" ? (
                  <form onSubmit={createEvent}>
                    <label>
                      Titel
                      <input name="title" required />
                    </label>
                    <div className="form-columns">
                      <label>
                        Datum
                        <input name="date" type="date" required />
                      </label>
                      <label>
                        Zeit
                        <input name="time" type="time" required />
                      </label>
                    </div>
                    <label>
                      Ort
                      <input name="location" required />
                    </label>
                    <label>
                      Terminart
                      <select name="type" defaultValue="Workshop" required>
                        <option>InnoBoard V</option>
                        <option>Pfadfinder-Call</option>
                        <option>Workshop</option>
                      </select>
                    </label>
                    <label>
                      Projektverknüpfung
                      <select name="projectId" defaultValue="">
                        <option value="">Kein Projekt</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ideenverknüpfung
                      <select name="ideaIds" multiple>
                        {ideas.map((idea) => (
                          <option key={idea.id} value={idea.id}>
                            {idea.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="form-actions">
                      <button className="secondary-button" type="button" onClick={() => setForm(null)}>
                        Abbrechen
                      </button>
                      <button className="primary-button" type="submit">
                        Termin erstellen
                      </button>
                    </div>
                  </form>
                ) : form === "user" ? (
                  <form onSubmit={createUser}>
                    <label>
                      Name
                      <input name="displayName" required />
                    </label>
                    <label>
                      E-Mail
                      <input name="email" type="email" />
                    </label>
                    <label>
                      Externe IAM-ID (optional)
                      <input name="externalId" placeholder="Wird später vom IAM geliefert" />
                    </label>
                    <div className="form-actions">
                      <button className="secondary-button" type="button" onClick={() => setForm(null)}>
                        Abbrechen
                      </button>
                      <button className="primary-button" type="submit">
                        Benutzer erstellen
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={createIdea}>
                    <label>
                      Projekt
                      <select
                        name="projectId"
                        defaultValue={ideaProjectId ?? undefined}
                        required
                      >
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Ideentitel
                      <input name="title" required />
                    </label>
                    <label>
                      Problemstellung
                      <textarea name="problemStatement" required />
                    </label>
                    <div className="form-columns">
                      <label>
                        Ideengeber
                        <input name="submitter" required />
                      </label>
                      <label>
                        Ideenowner
                        <input name="ideaOwner" required />
                      </label>
                    </div>
                    <label>
                      Innovations-Business-Owner
                      <input name="businessOwner" />
                    </label>
                    <label>
                      Zugeordnete Benutzer
                      <select name="userIds" multiple>
                        {users.map((user) => (
                          <option key={user.id} value={user.id} disabled={!user.active}>
                            {user.displayName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Innovationsstatus
                      <select
                        name="secondaryStatusId"
                        defaultValue={ideaStages[0]?.id}
                        required
                      >
                        {ideaStages.map((stage) => (
                          <option key={stage.id} value={stage.id}>
                            {stage.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Umsetzungspfad
                      <select name="implementationPathId" defaultValue="">
                        <option value="">Noch offen</option>
                        {implementationPaths.map((path) => (
                          <option key={path.id} value={path.id}>
                            {path.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Steuerungsgate
                      <select name="gateId" defaultValue={gates[0]?.id}>
                        {gates.map((gate) => (
                          <option key={gate.id} value={gate.id}>
                            {gate.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <input name="gateStatus" type="hidden" value="open" />
                    <div className="form-actions">
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => setForm(null)}
                      >
                        Abbrechen
                      </button>
                      <button className="primary-button" type="submit">
                        Idee erstellen
                      </button>
                    </div>
                  </form>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ProjectRow({
  project,
  projectStatuses,
  ideas,
  editable,
  updateProjectStatus,
  onOpen,
}: {
  project: Project;
  projectStatuses: ProjectStatus[];
  ideas: Idea[];
  editable: boolean;
  updateProjectStatus: (projectId: number, status: string) => Promise<void>;
  onOpen?: () => void;
}) {
  return (
    <article className="project-row">
      <div className="project-mark">{project.name.slice(0, 1)}</div>
      <div className="project-name">
        <h3>{project.name}</h3>
        <p>{project.client}</p>
      </div>
      <div className="phase">
        {editable ? (
          <select
            aria-label={`Projektstatus für ${project.name}`}
            value={project.primaryStatusId}
            onChange={(event) =>
              updateProjectStatus(project.id, event.target.value)
            }
          >
            {projectStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        ) : (
          <span>
            {projectStatuses.find(
              (status) => status.id === project.primaryStatusId,
            )?.label ?? "Ohne Status"}
          </span>
        )}
      </div>
      <div className="progress">
        <span>{project.progress}%</span>
        <div>
          <i style={{ width: `${project.progress}%` }} />
        </div>
      </div>
      <div className="next-step">
        <span>
          {ideas.filter((idea) => idea.projectId === project.id).length} Ideen ·
          Nächster Schritt
        </span>
        <strong>{project.nextStep}</strong>
      </div>
      {onOpen ? (
        <button
          className="row-action"
          type="button"
          onClick={onOpen}
          aria-label={`${project.name} öffnen`}
        >
          <ChevronRight size={19} />
        </button>
      ) : (
        <ChevronRight className="row-icon" size={19} />
      )}
    </article>
  );
}

function ProjectTaskList({
  tasks,
  onToggle,
  onUpdate,
  onCreate,
}: {
  tasks: ProjectTask[];
  onToggle: (taskId: number, completed: boolean) => Promise<void>;
  onUpdate: (taskId: number, update: Partial<ProjectTask>) => Promise<void>;
  onCreate: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <section className="project-tasks">
      <div className="task-heading">
        <div>
          <p className="eyebrow">
            <ListChecks size={15} /> Aufgaben
          </p>
          <h2>
            {completedCount}/{tasks.length} erledigt
          </h2>
        </div>
      </div>
      <div className="task-list">
        {tasks.map((task) => (
          <div className={`task-row ${task.completed ? "completed" : ""}`} key={task.id}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(event) => onToggle(task.id, event.target.checked)}
              />
              <span>{task.title}</span>
            </label>
            <input aria-label={`Fälligkeit für ${task.title}`} type="date" value={task.dueDate} onChange={(event) => onUpdate(task.id, { dueDate: event.target.value })} />
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="empty-state">Noch keine Aufgaben für dieses Projekt.</p>
        )}
      </div>
      <form className="add-task-form" onSubmit={onCreate}>
        <input name="title" placeholder="Aufgabe hinzufügen" required />
        <input name="dueDate" type="date" aria-label="Fälligkeit" />
        <button className="secondary-button" type="submit">
          <Plus size={17} /> Aufgabe
        </button>
      </form>
    </section>
  );
}

function ProjectCockpit({
  ideas,
  tasks,
  ideaStages,
}: {
  ideas: Idea[];
  tasks: ProjectTask[];
  ideaStages: IdeaStage[];
}) {
  const completedTasks = tasks.filter((task) => task.completed).length;
  const passedGates = ideas.filter(
    (idea) => idea.gateStatus === "passed",
  ).length;
  const reachedPhases = new Set(ideas.map((idea) => idea.secondaryStatusId))
    .size;

  return (
    <section className="project-cockpit" aria-label="Projekt-Cockpit">
      <div className="cockpit-intro">
        <p className="eyebrow">Projekt-Cockpit</p>
        <strong>Steuerungsübersicht</strong>
      </div>
      <div className="cockpit-metric">
        <span>Ideen</span>
        <strong>{ideas.length}</strong>
      </div>
      <div className="cockpit-metric">
        <span>Phasen erreicht</span>
        <strong>{reachedPhases}/{ideaStages.length}</strong>
      </div>
      <div className="cockpit-metric">
        <span>Aufgaben erledigt</span>
        <strong>{completedTasks}/{tasks.length}</strong>
      </div>
      <div className="cockpit-metric">
        <span>Gates bestanden</span>
        <strong>{passedGates}/{ideas.length}</strong>
      </div>
    </section>
  );
}

export default App;
