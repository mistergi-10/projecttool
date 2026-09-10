import { useEffect, useState } from 'react'
import { ArrowUpRight, Bell, CalendarDays, ChevronRight, CirclePlus, FolderKanban, UsersRound } from 'lucide-react'
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
type Idea = { id: number; projectId: number; title: string; secondaryStatusId: string }

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
  const [apiAvailable, setApiAvailable] = useState(false)

  useEffect(() => {
    fetch('/api/portal')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: { projects: Project[]; projectStatuses: ProjectStatus[]; ideas: Idea[] }) => {
        setProjects(data.projects)
        setProjectStatuses(data.projectStatuses)
        setIdeas(data.ideas)
        setApiAvailable(true)
      })
      .catch(() => setApiAvailable(false))
  }, [])

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/">projekt<span>raum</span></a>
        <nav aria-label="Hauptnavigation">
          <a className="nav-item active" href="#projekte"><FolderKanban size={18} /> Projekte</a>
          <a className="nav-item" href="#begleitungen"><UsersRound size={18} /> Begleitungen</a>
          <a className="nav-item" href="#termine"><CalendarDays size={18} /> Termine</a>
        </nav>
        <div className="sidebar-footer">
          <span className={apiAvailable ? 'status online' : 'status'}></span>
          {apiAvailable ? 'In-Memory-API aktiv' : 'Lokale Vorschau'}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="crumb">Übersicht <ChevronRight size={15} /> Projekte</div>
          <button className="icon-button" type="button" aria-label="Benachrichtigungen"><Bell size={19} /></button>
        </header>
        <div className="content">
          <div className="title-row">
            <div><p className="eyebrow">Projektbegleitung</p><h1>Guten Morgen, David.</h1></div>
            <button className="primary-button" type="button"><CirclePlus size={18} /> Projekt anlegen</button>
          </div>

          <section className="overview" aria-label="Übersicht">
            <div><span>Aktive Projekte</span><strong>{projects.length}</strong><small>in drei Begleitphasen</small></div>
            <div><span>Nächste Termine</span><strong>4</strong><small>in den nächsten 7 Tagen</small></div>
            <div><span>Offene Schritte</span><strong>11</strong><small>2 benötigen Aufmerksamkeit</small></div>
          </section>

          <section id="projekte" className="projects-section">
            <div className="section-heading"><div><h2>Aktuelle Projekte</h2><p>Begleitungen mit dem nächsten sinnvollen Schritt.</p></div><a href="#alle">Alle anzeigen <ArrowUpRight size={16} /></a></div>
            <div className="project-list">
              {projects.map((project) => <article className="project-row" key={project.id}>
                <div className="project-mark">{project.name.slice(0, 1)}</div>
                <div className="project-name"><h3>{project.name}</h3><p>{project.client}</p></div>
                <div className="phase"><span>{projectStatuses.find((status) => status.id === project.primaryStatusId)?.label ?? 'Ohne Status'}</span></div>
                <div className="progress"><span>{project.progress}%</span><div><i style={{ width: `${project.progress}%` }}></i></div></div>
                <div className="next-step"><span>{ideas.filter((idea) => idea.projectId === project.id).length} Ideen · Nächster Schritt</span><strong>{project.nextStep}</strong></div>
                <button className="row-action" type="button" aria-label={`${project.name} öffnen`}><ChevronRight size={19} /></button>
              </article>)}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
