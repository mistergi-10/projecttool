import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type ProjectStatus = {
  id: string
  label: string
  color: string
  order: number
}

type IdeaStage = {
  id: string
  label: string
  order: number
  framework: string
}

type Idea = {
  id: number
  projectId: number
  title: string
  secondaryStatusId: string
  problemStatement: string
  submitter: string
  ideaOwner: string
  businessOwner: string
  implementationPathId: string
  gateId: string
  gateStatus: 'open' | 'passed' | 'not-required'
}

type ImplementationPath = {
  id: string
  label: string
}

type Gate = {
  id: string
  label: string
  phaseId: string
  description: string
}

type TaskTemplate = {
  id: number
  title: string
  active: boolean
}

type ProjectTask = {
  id: number
  projectId: number
  title: string
  completed: boolean
  templateId: number | null
}

const projectStatuses: ProjectStatus[] = [
  { id: 'planned', label: 'Geplant', color: '#7b8b83', order: 1 },
  { id: 'active', label: 'In Bearbeitung', color: '#236052', order: 2 },
  { id: 'paused', label: 'Pausiert', color: '#b98735', order: 3 },
  { id: 'completed', label: 'Abgeschlossen', color: '#476d5d', order: 4 },
]

// Secondary idea statuses follow the InnoV innovation process supplied by the user.
const ideaStages: IdeaStage[] = [
  { id: 'ideate', label: 'Ideate - Ideen generieren & qualifizieren', order: 1, framework: 'InnoV v1.0' },
  { id: 'validate', label: 'Validate - Testen, überprüfen, Umsetzung planen', order: 2, framework: 'InnoV v1.0' },
  { id: 'experiment', label: 'Experiment - Versuch als MVP umsetzen', order: 3, framework: 'InnoV v1.0' },
  { id: 'evolve', label: 'Evolve - Anfangsplanung für Skalierung & Folgen', order: 4, framework: 'InnoV v1.0' },
  { id: 'implement', label: 'Implement - flächendeckend ausrollen', order: 5, framework: 'InnoV v1.0' },
]

const implementationPaths: ImplementationPath[] = [
  { id: 'zuva', label: 'Beschaffungsprojekt nach ZUVA' },
  { id: 'innovation-unit', label: 'Umsetzung über Innovationseinheit (SI4)' },
  { id: 'rio', label: 'Umsetzung über RIO (RUAG)' },
  { id: 'decentralized', label: 'Innovationsprojekt DU CdA' },
  { id: 'research', label: 'Innovationsraum und Forschungsauftrag ar W+T' },
  { id: 'kvp', label: 'Ablauf-Verbesserung nach KVP' },
  { id: 'drones', label: 'Umsetzungspfad Komp Zen Drohnen und Robotik' },
]

const gates: Gate[] = [
  { id: 'quality-check', label: 'Quality-Check', phaseId: 'ideate', description: 'Problem verständlich beschreiben und lösenswerte Fragestellung sicherstellen.' },
  { id: 'quality-call', label: 'Quality-Call', phaseId: 'ideate', description: 'Geschärftes Problem, Nutzergruppen und erste Lösungsmöglichkeiten abstimmen.' },
  { id: 'pathfinder-call', label: 'Pfadfinder-Call', phaseId: 'validate', description: 'Umsetzungspfad und Innovations-Business-Owner bestimmen.' },
  { id: 'gate-1', label: 'InnoBoard Gate 1', phaseId: 'validate', description: 'Ressourcen für Experiment beurteilen und freigeben.' },
  { id: 'gate-2', label: 'InnoBoard Gate 2', phaseId: 'experiment', description: 'Ergebnisse des Experiments und Mittel für Evolve beurteilen.' },
  { id: 'gate-3', label: 'InnoBoard Gate 3', phaseId: 'evolve', description: 'Abschluss von Evolve und Übergang zur Implementierung freigeben.' },
]

const taskTemplates: TaskTemplate[] = [
  { id: 1, title: 'APLAN abgesprochen', active: true },
  { id: 2, title: 'IKT V abgesprochen', active: true },
]

const projects = [
  { id: 1, name: 'Drohnenlagebild 2030', client: 'Kommando Einsatzunterstützung', primaryStatusId: 'active', progress: 64, nextStep: 'Feldversuch vorbereiten' },
  { id: 2, name: 'Mobiler Sanitätsassistent', client: 'Ausbildungszentrum Sanität', primaryStatusId: 'active', progress: 42, nextStep: 'MVP-Abnahme planen' },
  { id: 3, name: 'Resiliente Feldlogistik', client: 'Logistikbasis Nord', primaryStatusId: 'planned', progress: 27, nextStep: 'Nutzerinterviews terminieren' },
]

const ideas: Idea[] = [
  { id: 1, projectId: 1, title: 'Mobiles Lagebild für Kleindrohnen', secondaryStatusId: 'experiment', problemStatement: 'Einsatzkräfte erhalten Lageinformationen von Kleindrohnen nicht zeitgerecht und einheitlich.', submitter: 'Hptm M. Keller', ideaOwner: 'Hptm M. Keller', businessOwner: 'Oberst L. Hofmann', implementationPathId: 'innovation-unit', gateId: 'gate-2', gateStatus: 'open' },
  { id: 2, projectId: 1, title: 'Autonome Startplatzprüfung', secondaryStatusId: 'validate', problemStatement: 'Drohnencrews benötigen eine rasche und sichere Beurteilung möglicher Startplätze.', submitter: 'Oblt S. Meier', ideaOwner: 'Oblt S. Meier', businessOwner: 'Oberst L. Hofmann', implementationPathId: 'drones', gateId: 'pathfinder-call', gateStatus: 'open' },
  { id: 3, projectId: 2, title: 'Triagehilfe im Einsatzraum', secondaryStatusId: 'evolve', problemStatement: 'Sanitätsteams benötigen unter Zeitdruck eine einheitliche digitale Triageunterstützung.', submitter: 'Dr. A. Kern', ideaOwner: 'Dr. A. Kern', businessOwner: 'Oberst P. Kern', implementationPathId: 'rio', gateId: 'gate-3', gateStatus: 'open' },
  { id: 4, projectId: 3, title: 'Materialfluss im Feld sichtbar machen', secondaryStatusId: 'ideate', problemStatement: 'Kritisches Material und Nachschub sind entlang der Feldlogistik nur eingeschränkt transparent.', submitter: 'Hptfw T. Berger', ideaOwner: 'Hptfw T. Berger', businessOwner: '', implementationPathId: '', gateId: 'quality-check', gateStatus: 'open' },
]

const projectTasks: ProjectTask[] = [
  { id: 1, projectId: 1, title: 'APLAN abgesprochen', completed: true, templateId: 1 },
  { id: 2, projectId: 1, title: 'IKT V abgesprochen', completed: false, templateId: 2 },
  { id: 3, projectId: 2, title: 'APLAN abgesprochen', completed: false, templateId: 1 },
]

const app = express()
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

app.use(express.json())
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
app.get('/api/projects', (_request, response) => response.json(projects))
app.get('/api/project-statuses', (_request, response) => response.json(projectStatuses))
app.get('/api/idea-stages', (_request, response) => response.json(ideaStages))
app.get('/api/implementation-paths', (_request, response) => response.json(implementationPaths))
app.get('/api/gates', (_request, response) => response.json(gates))
app.get('/api/task-templates', (_request, response) => response.json(taskTemplates))
app.get('/api/tasks', (request, response) => {
  const projectId = Number(request.query.projectId)
  response.json(Number.isFinite(projectId) ? projectTasks.filter((task) => task.projectId === projectId) : projectTasks)
})
app.get('/api/ideas', (request, response) => {
  const projectId = Number(request.query.projectId)
  response.json(Number.isFinite(projectId) ? ideas.filter((idea) => idea.projectId === projectId) : ideas)
})
app.get('/api/portal', (_request, response) => response.json({ projects, projectStatuses, ideas, ideaStages, implementationPaths, gates, taskTemplates, projectTasks }))
app.post('/api/projects', (request, response) => {
  const { name, client, primaryStatusId, nextStep } = request.body as Partial<(typeof projects)[number]>
  if (!name || !client || !primaryStatusId || !nextStep || !projectStatuses.some((status) => status.id === primaryStatusId)) {
    response.status(400).json({ error: 'Projektname, Organisation, Projektstatus und naechster Schritt sind erforderlich.' })
    return
  }
  const project = { id: projects.length + 1, name, client, primaryStatusId, progress: 0, nextStep }
  projects.push(project)
  taskTemplates.filter((template) => template.active).forEach((template) => {
    projectTasks.push({ id: projectTasks.length + 1, projectId: project.id, title: template.title, completed: false, templateId: template.id })
  })
  response.status(201).json(project)
})
app.post('/api/tasks', (request, response) => {
  const { projectId, title } = request.body as Partial<ProjectTask>
  if (!projectId || !title?.trim() || !projects.some((project) => project.id === projectId)) {
    response.status(400).json({ error: 'Projekt und Aufgabentitel sind erforderlich.' })
    return
  }
  const task = { id: projectTasks.length + 1, projectId, title: title.trim(), completed: false, templateId: null }
  projectTasks.push(task)
  response.status(201).json(task)
})
app.post('/api/task-templates', (request, response) => {
  const title = (request.body as Partial<TaskTemplate>).title?.trim()
  if (!title) {
    response.status(400).json({ error: 'Aufgabentitel ist erforderlich.' })
    return
  }
  const template = { id: taskTemplates.length + 1, title, active: true }
  taskTemplates.push(template)
  response.status(201).json(template)
})
app.post('/api/ideas', (request, response) => {
  const { projectId, title, secondaryStatusId, problemStatement, submitter, ideaOwner, businessOwner, implementationPathId, gateId, gateStatus } = request.body as Partial<Idea>
  if (!projectId || !title || !secondaryStatusId || !problemStatement || !submitter || !ideaOwner || !projects.some((project) => project.id === projectId) || !ideaStages.some((stage) => stage.id === secondaryStatusId)) {
    response.status(400).json({ error: 'Projekt, Ideentitel, Problemstellung, Ideengeber, Ideenowner und Innovationsstatus sind erforderlich.' })
    return
  }
  const idea = { id: ideas.length + 1, projectId, title, secondaryStatusId, problemStatement, submitter, ideaOwner, businessOwner: businessOwner ?? '', implementationPathId: implementationPathId ?? '', gateId: gateId ?? 'quality-check', gateStatus: gateStatus ?? 'open' } as Idea
  ideas.push(idea)
  response.status(201).json(idea)
})
app.patch('/api/projects/:id', (request, response) => {
  const project = projects.find((item) => item.id === Number(request.params.id))
  if (!project) {
    response.status(404).json({ error: 'Projekt nicht gefunden.' })
    return
  }
  const update = request.body as Partial<(typeof projects)[number]>
  if (update.primaryStatusId && !projectStatuses.some((status) => status.id === update.primaryStatusId)) {
    response.status(400).json({ error: 'Ungueltiger Projektstatus.' })
    return
  }
  if (update.progress !== undefined && (!Number.isInteger(update.progress) || update.progress < 0 || update.progress > 100)) {
    response.status(400).json({ error: 'Fortschritt muss eine ganze Zahl zwischen 0 und 100 sein.' })
    return
  }
  if (update.name !== undefined && !update.name.trim()) {
    response.status(400).json({ error: 'Projektname darf nicht leer sein.' })
    return
  }
  if (update.client !== undefined && !update.client.trim()) {
    response.status(400).json({ error: 'Organisation darf nicht leer sein.' })
    return
  }
  if (update.nextStep !== undefined && !update.nextStep.trim()) {
    response.status(400).json({ error: 'Nächster Schritt darf nicht leer sein.' })
    return
  }
  Object.assign(project, update)
  response.json(project)
})
app.patch('/api/ideas/:id', (request, response) => {
  const idea = ideas.find((item) => item.id === Number(request.params.id))
  if (!idea) {
    response.status(404).json({ error: 'Idee nicht gefunden.' })
    return
  }
  const update = request.body as Partial<Idea>
  if (update.secondaryStatusId && !ideaStages.some((stage) => stage.id === update.secondaryStatusId)) {
    response.status(400).json({ error: 'Ungueltiger Innovationsstatus.' })
    return
  }
  if (update.implementationPathId && !implementationPaths.some((path) => path.id === update.implementationPathId)) {
    response.status(400).json({ error: 'Ungueltiger Umsetzungspfad.' })
    return
  }
  if (update.gateId && !gates.some((gate) => gate.id === update.gateId)) {
    response.status(400).json({ error: 'Ungueltiges Gate.' })
    return
  }
  Object.assign(idea, update)
  response.json(idea)
})
app.patch('/api/tasks/:id', (request, response) => {
  const task = projectTasks.find((item) => item.id === Number(request.params.id))
  const update = request.body as Partial<ProjectTask>
  if (!task) {
    response.status(404).json({ error: 'Aufgabe nicht gefunden.' })
    return
  }
  if (update.title !== undefined && !update.title.trim()) {
    response.status(400).json({ error: 'Aufgabentitel darf nicht leer sein.' })
    return
  }
  Object.assign(task, update)
  response.json(task)
})
app.patch('/api/task-templates/:id', (request, response) => {
  const template = taskTemplates.find((item) => item.id === Number(request.params.id))
  const update = request.body as Partial<TaskTemplate>
  if (!template) {
    response.status(404).json({ error: 'Standardaufgabe nicht gefunden.' })
    return
  }
  if (update.title !== undefined && !update.title.trim()) {
    response.status(400).json({ error: 'Aufgabentitel darf nicht leer sein.' })
    return
  }
  Object.assign(template, update)
  response.json(template)
})
app.post('/api/project-statuses', (request, response) => {
  const status = request.body as ProjectStatus
  projectStatuses.push(status)
  response.status(201).json(status)
})
app.use(express.static(path.join(rootDirectory, 'dist')))
app.get('{*splat}', (_request, response) => response.sendFile(path.join(rootDirectory, 'dist', 'index.html')))

const port = Number(process.env.PORT) || 3000
app.listen(port, () => console.log(`Project portal is running on port ${port}`))