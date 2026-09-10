import { useEffect, useState, type FormEvent } from 'react'
import { Bell, ChevronRight, CirclePlus, FolderKanban, LayoutDashboard, Lightbulb, Plus, X } from 'lucide-react'
import './App.css'

type Project = {
  id: number
  name: string
  client: string
  primaryStatusId: string
  progress: number
  nextStep: string
}

type ProjectStatus = { id: string; label: string }
type IdeaStage = { id: string; label: string }
type ImplementationPath = { id: string; label: string }
type Gate = { id: string; label: string; phaseId: string; description: string }
type Idea = { id: number; projectId: number; title: string; secondaryStatusId: string; problemStatement: string; submitter: string; ideaOwner: string; businessOwner: string; implementationPathId: string; gateId: string; gateStatus: 'open' | 'passed' | 'not-required' }
type PortalData = { projects: Project[]; projectStatuses: ProjectStatus[]; ideas: Idea[]; ideaStages: IdeaStage[]; implementationPaths: ImplementationPath[]; gates: Gate[] }

const initialProjects: Project[] = [
  { id: 1, name: 'Digitaler Empfang', client: 'Hofmann & Partner', primaryStatusId: 'active', progress: 64, nextStep: 'Workshop vorbereiten' },
  { id: 2, name: 'CRM-Neustart', client: 'Kernwerk GmbH', primaryStatusId: 'active', progress: 42, nextStep: 'Abnahme planen' },
  { id: 3, name: 'Prozesslandkarte', client: 'Stadtwerke Nord', primaryStatusId: 'planned', progress: 27, nextStep: 'Interviews terminieren' },
]

const initialStatuses: ProjectStatus[] = [
  { id: 'planned', label: 'Geplant' },
  { id: 'active', label: 'In Bearbeitung' },
]

function App() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>(initialStatuses)
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [ideaStages, setIdeaStages] = useState<IdeaStage[]>([])
  const [implementationPaths, setImplementationPaths] = useState<ImplementationPath[]>([])
  const [gates, setGates] = useState<Gate[]>([])
  const [apiAvailable, setApiAvailable] = useState(false)
  const [page, setPage] = useState<'overview' | 'projects' | 'ideas'>('overview')
  const [form, setForm] = useState<'project' | 'idea' | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState(1)
  const [ideaProjectId, setIdeaProjectId] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/portal')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: PortalData) => {
        setProjects(data.projects)
        setProjectStatuses(data.projectStatuses)
        setIdeas(data.ideas)
        setIdeaStages(data.ideaStages)
        setImplementationPaths(data.implementationPaths)
        setGates(data.gates)
        setApiAvailable(true)
      })
      .catch(() => setApiAvailable(false))
  }, [])

  const updateProjectStatus = async (projectId: number, primaryStatusId: string) => {
    const response = await fetch(`/api/projects/${projectId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ primaryStatusId }) })
    if (!response.ok) return setMessage('Der Projektstatus konnte nicht gespeichert werden.')
    const updated = await response.json() as Project
    setProjects((current) => current.map((project) => project.id === updated.id ? updated : project))
  }

  const updateIdea = async (ideaId: number, update: Partial<Idea>) => {
    const response = await fetch(`/api/ideas/${ideaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(update) })
    if (!response.ok) return setMessage('Die Ideenakte konnte nicht gespeichert werden.')
    const updated = await response.json() as Idea
    setIdeas((current) => current.map((idea) => idea.id === updated.id ? updated : idea))
  }

  const createProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const response = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(formData)) })
    if (!response.ok) return setMessage('Bitte alle Projektfelder ausfüllen.')
    const project = await response.json() as Project
    setProjects((current) => [...current, project])
    setSelectedProjectId(project.id)
    setForm(null)
    setPage('projects')
  }

  const createIdea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch('/api/ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, projectId: Number(data.projectId) }) })
    if (!response.ok) return setMessage('Bitte Projekt, Titel und Innovationsstatus wählen.')
    const idea = await response.json() as Idea
    setIdeas((current) => [...current, idea])
    setForm(null)
    setPage('ideas')
  }

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch(`/api/projects/${selectedProjectId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, progress: Number(data.progress) }) })
    if (!response.ok) return setMessage('Die Projektakte konnte nicht gespeichert werden.')
    const updated = await response.json() as Project
    setProjects((current) => current.map((project) => project.id === updated.id ? updated : project))
    setMessage('Projektakte gespeichert.')
  }

  const projectName = (projectId: number) => projects.find((project) => project.id === projectId)?.name ?? 'Unbekanntes Projekt'
  const selectedProject = projects.find((project) => project.id === selectedProjectId)
  const openProjectForm = () => { setMessage(''); setForm('project') }
  const openIdeaForm = (projectId: number | null = null) => { setMessage(''); setIdeaProjectId(projectId); setForm('idea') }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/">Project-Tool<span>Inno V</span></a>
        <nav aria-label="Hauptnavigation">
          <button className={`nav-item ${page === 'overview' ? 'active' : ''}`} type="button" onClick={() => setPage('overview')}><LayoutDashboard size={18} /> Übersicht</button>
          <button className={`nav-item ${page === 'projects' ? 'active' : ''}`} type="button" onClick={() => setPage('projects')}><FolderKanban size={18} /> Projekte</button>
          <button className={`nav-item ${page === 'ideas' ? 'active' : ''}`} type="button" onClick={() => setPage('ideas')}><Lightbulb size={18} /> Ideen</button>
        </nav>
        <div className="sidebar-footer">
          <span className={apiAvailable ? 'status online' : 'status'}></span>
          {apiAvailable ? 'In-Memory-API aktiv' : 'Lokale Vorschau'}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="crumb">Projektportal <ChevronRight size={15} /> {page === 'overview' ? 'Übersicht' : page === 'projects' ? 'Projekte' : 'Ideen'}</div>
          <button className="icon-button" type="button" aria-label="Benachrichtigungen"><Bell size={19} /></button>
        </header>
        <div className="content">
          <div className="title-row"><div><p className="eyebrow">Projektbegleitung</p><h1>{page === 'overview' ? 'Project-Tool Inno V' : page === 'projects' ? 'Projekte steuern.' : 'Ideen entwickeln.'}</h1></div><button className="primary-button" type="button" onClick={page === 'ideas' ? () => openIdeaForm() : openProjectForm}><CirclePlus size={18} /> {page === 'ideas' ? 'Idee anlegen' : 'Projekt anlegen'}</button></div>

          {message && <p className="message">{message}</p>}
          {page === 'overview' && <><section className="overview" aria-label="Übersicht">
            <button className="overview-link" type="button" onClick={() => setPage('projects')}><span>Aktive Projekte</span><strong>{projects.length}</strong><small>Projektakte öffnen</small></button>
            <button className="overview-link" type="button" onClick={() => setPage('ideas')}><span>Begleitete Ideen</span><strong>{ideas.length}</strong><small>Ideenportfolio öffnen</small></button>
            <button className="overview-link" type="button" onClick={() => setPage('projects')}><span>Offene Schritte</span><strong>{projects.filter((project) => project.primaryStatusId !== 'completed').length}</strong><small>Projektübersicht öffnen</small></button>
          </section>
          <section className="projects-section"><div className="section-heading"><div><h2>Aktuelle Projekte</h2><p>Begleitungen mit dem nächsten sinnvollen Schritt.</p></div><button className="text-button" onClick={() => setPage('projects')} type="button">Alle Projekte <ChevronRight size={16} /></button></div>
            <div className="project-list">
              {projects.slice(0, 3).map((project) => <ProjectRow key={project.id} project={project} projectStatuses={projectStatuses} ideas={ideas} editable={false} updateProjectStatus={updateProjectStatus} />)}
            </div></section></>}
          {page === 'projects' && <section className="projects-section"><div className="section-heading"><div><h2>Projektübersicht</h2><p>Ein Projekt bündelt seine Ideen und ihre Innovationsarbeit.</p></div></div><div className="project-tabs">{projects.map((project) => <button key={project.id} className={project.id === selectedProjectId ? 'selected' : ''} onClick={() => setSelectedProjectId(project.id)} type="button"><span>{project.name.slice(0, 1)}</span>{project.name}</button>)}</div>{selectedProject && <div className="project-workbench"><section className="project-editor"><div><p className="eyebrow">Projektakte</p><h2>{selectedProject.name}</h2></div><form onSubmit={saveProject}><label>Projektname<input name="name" defaultValue={selectedProject.name} required /></label><label>Organisation<input name="client" defaultValue={selectedProject.client} required /></label><div className="form-columns"><label>Projektstatus<select name="primaryStatusId" defaultValue={selectedProject.primaryStatusId}>{projectStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label><label>Fortschritt<input name="progress" type="number" min="0" max="100" defaultValue={selectedProject.progress} required /></label></div><label>Nächster Schritt<input name="nextStep" defaultValue={selectedProject.nextStep} required /></label><button className="primary-button" type="submit">Projekt speichern</button></form></section><section className="linked-ideas"><div className="linked-heading"><div><p className="eyebrow">Verknüpfte Ideen</p><h2>{ideas.filter((idea) => idea.projectId === selectedProject.id).length} Ideen</h2></div><button className="secondary-button" type="button" onClick={() => openIdeaForm(selectedProject.id)}><Plus size={17} /> Idee hinzufügen</button></div>{ideas.filter((idea) => idea.projectId === selectedProject.id).map((idea) => <article key={idea.id} className="linked-idea"><div><strong>{idea.title}</strong><span>{ideaStages.find((stage) => stage.id === idea.secondaryStatusId)?.label.split(' - ')[0]}</span></div><p>{idea.problemStatement}</p><button className="text-button" type="button" onClick={() => setPage('ideas')}>Öffnen <ChevronRight size={16} /></button></article>)}{ideas.every((idea) => idea.projectId !== selectedProject.id) && <p className="empty-state">Diesem Projekt sind noch keine Ideen zugeordnet.</p>}</section></div>}</section>}
          {page === 'ideas' && <section className="ideas-section"><div className="section-heading"><div><h2>Innovationsportfolio</h2><p>Bedarf, Rollen, Umsetzungspfad und Gate an einer Stelle steuern.</p></div><button className="secondary-button" type="button" onClick={() => openIdeaForm()}><Plus size={17} /> Idee anlegen</button></div><div className="idea-board"><div className="process-strip">{ideaStages.map((stage) => <span key={stage.id}>{stage.label.split(' - ')[0]}</span>)}</div><div className="idea-grid">
            {ideaStages.map((stage) => <section className="idea-column" key={stage.id}>{ideas.filter((idea) => idea.secondaryStatusId === stage.id).map((idea) => <article className="idea-card" key={idea.id}><div className="idea-card-head"><div className="idea-icon"><Lightbulb size={19} /></div><span className={`gate ${idea.gateStatus}`}>{gates.find((gate) => gate.id === idea.gateId)?.label ?? 'Gate offen'}</span></div><p>{projectName(idea.projectId)}</p><h3>{idea.title}</h3><p className="problem">{idea.problemStatement}</p><div className="idea-fields"><label>Phase<select value={idea.secondaryStatusId} onChange={(event) => updateIdea(idea.id, { secondaryStatusId: event.target.value })}>{ideaStages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Umsetzungspfad<select value={idea.implementationPathId} onChange={(event) => updateIdea(idea.id, { implementationPathId: event.target.value })}><option value="">Noch offen</option>{implementationPaths.map((path) => <option key={path.id} value={path.id}>{path.label}</option>)}</select></label><div className="role-line"><span>Ideenowner <strong>{idea.ideaOwner}</strong></span><span>Business-Owner <strong>{idea.businessOwner || 'Noch offen'}</strong></span></div><label>Steuerungsgate<select value={idea.gateId} onChange={(event) => updateIdea(idea.id, { gateId: event.target.value })}>{gates.map((gate) => <option key={gate.id} value={gate.id}>{gate.label}</option>)}</select></label><label>Gate-Entscheid<select value={idea.gateStatus} onChange={(event) => updateIdea(idea.id, { gateStatus: event.target.value as Idea['gateStatus'] })}><option value="open">Offen</option><option value="passed">Bestanden</option><option value="not-required">Nicht erforderlich</option></select></label></div></article>)}{ideas.every((idea) => idea.secondaryStatusId !== stage.id) && <p className="empty-phase">Keine Ideen</p>}</section>)}
          </div></div></section>}
          {form && <div className="dialog-backdrop" role="presentation"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><div className="dialog-header"><div><p className="eyebrow">Neu anlegen</p><h2 id="dialog-title">{form === 'project' ? 'Projekt anlegen' : 'Idee anlegen'}</h2></div><button className="icon-button" type="button" aria-label="Dialog schließen" onClick={() => setForm(null)}><X size={19} /></button></div>
            {form === 'project' ? <form onSubmit={createProject}><label>Projektname<input name="name" required /></label><label>Organisation<input name="client" required /></label><label>Projektstatus<select name="primaryStatusId" defaultValue={projectStatuses[0]?.id} required>{projectStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label><label>Nächster Schritt<input name="nextStep" required /></label><div className="form-actions"><button className="secondary-button" type="button" onClick={() => setForm(null)}>Abbrechen</button><button className="primary-button" type="submit">Projekt erstellen</button></div></form> : <form onSubmit={createIdea}><label>Projekt<select name="projectId" defaultValue={ideaProjectId ?? undefined} required>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label>Ideentitel<input name="title" required /></label><label>Problemstellung<textarea name="problemStatement" required /></label><div className="form-columns"><label>Ideengeber<input name="submitter" required /></label><label>Ideenowner<input name="ideaOwner" required /></label></div><label>Innovations-Business-Owner<input name="businessOwner" /></label><label>Innovationsstatus<select name="secondaryStatusId" defaultValue={ideaStages[0]?.id} required>{ideaStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}</select></label><label>Umsetzungspfad<select name="implementationPathId" defaultValue=""><option value="">Noch offen</option>{implementationPaths.map((path) => <option key={path.id} value={path.id}>{path.label}</option>)}</select></label><label>Steuerungsgate<select name="gateId" defaultValue={gates[0]?.id}>{gates.map((gate) => <option key={gate.id} value={gate.id}>{gate.label}</option>)}</select></label><input name="gateStatus" type="hidden" value="open" /><div className="form-actions"><button className="secondary-button" type="button" onClick={() => setForm(null)}>Abbrechen</button><button className="primary-button" type="submit">Idee erstellen</button></div></form>}</section></div>}
        </div>
      </section>
    </main>
  )
}

function ProjectRow({ project, projectStatuses, ideas, editable, updateProjectStatus }: { project: Project; projectStatuses: ProjectStatus[]; ideas: Idea[]; editable: boolean; updateProjectStatus: (projectId: number, status: string) => Promise<void> }) {
  return <article className="project-row"><div className="project-mark">{project.name.slice(0, 1)}</div><div className="project-name"><h3>{project.name}</h3><p>{project.client}</p></div><div className="phase">{editable ? <select aria-label={`Projektstatus für ${project.name}`} value={project.primaryStatusId} onChange={(event) => updateProjectStatus(project.id, event.target.value)}>{projectStatuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select> : <span>{projectStatuses.find((status) => status.id === project.primaryStatusId)?.label ?? 'Ohne Status'}</span>}</div><div className="progress"><span>{project.progress}%</span><div><i style={{ width: `${project.progress}%` }} /></div></div><div className="next-step"><span>{ideas.filter((idea) => idea.projectId === project.id).length} Ideen · Nächster Schritt</span><strong>{project.nextStep}</strong></div><ChevronRight className="row-icon" size={19} /></article>
}

export default App
