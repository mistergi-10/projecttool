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
}

const projectStatuses: ProjectStatus[] = [
  { id: 'planned', label: 'Geplant', color: '#7b8b83', order: 1 },
  { id: 'active', label: 'In Bearbeitung', color: '#236052', order: 2 },
  { id: 'paused', label: 'Pausiert', color: '#b98735', order: 3 },
  { id: 'completed', label: 'Abgeschlossen', color: '#476d5d', order: 4 },
]

// Entries are versioned so the wording can be transcribed exactly from the supplied guide.
const ideaStages: IdeaStage[] = [
  { id: 'capture', label: 'Idee erfassen', order: 1, framework: 'InnoV v1.0 - vorlaeufige Zuordnung' },
  { id: 'assess', label: 'Idee bewerten', order: 2, framework: 'InnoV v1.0 - vorlaeufige Zuordnung' },
  { id: 'develop', label: 'Loesung entwickeln', order: 3, framework: 'InnoV v1.0 - vorlaeufige Zuordnung' },
  { id: 'transition', label: 'Uebergabe entscheiden', order: 4, framework: 'InnoV v1.0 - vorlaeufige Zuordnung' },
]

const projects = [
  { id: 1, name: 'Digitaler Empfang', client: 'Hofmann & Partner', primaryStatusId: 'active', progress: 64, nextStep: 'Workshop vorbereiten' },
  { id: 2, name: 'CRM-Neustart', client: 'Kernwerk GmbH', primaryStatusId: 'active', progress: 42, nextStep: 'Abnahme planen' },
  { id: 3, name: 'Prozesslandkarte', client: 'Stadtwerke Nord', primaryStatusId: 'planned', progress: 27, nextStep: 'Interviews terminieren' },
]

const ideas: Idea[] = [
  { id: 1, projectId: 1, title: 'Digitale Besuchsanmeldung', secondaryStatusId: 'develop' },
  { id: 2, projectId: 1, title: 'Selbstbedienungs-Terminal', secondaryStatusId: 'assess' },
  { id: 3, projectId: 2, title: 'Gemeinsame Kundensicht', secondaryStatusId: 'transition' },
  { id: 4, projectId: 3, title: 'Prozesswissen sichtbar machen', secondaryStatusId: 'capture' },
]

const app = express()
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

app.use(express.json())
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
app.get('/api/projects', (_request, response) => response.json(projects))
app.get('/api/project-statuses', (_request, response) => response.json(projectStatuses))
app.get('/api/idea-stages', (_request, response) => response.json(ideaStages))
app.get('/api/ideas', (request, response) => {
  const projectId = Number(request.query.projectId)
  response.json(Number.isFinite(projectId) ? ideas.filter((idea) => idea.projectId === projectId) : ideas)
})
app.get('/api/portal', (_request, response) => response.json({ projects, projectStatuses, ideas, ideaStages }))
app.post('/api/projects', (request, response) => {
  const project = { id: projects.length + 1, ...request.body }
  projects.push(project)
  response.status(201).json(project)
})
app.post('/api/ideas', (request, response) => {
  const idea = { id: ideas.length + 1, ...request.body } as Idea
  ideas.push(idea)
  response.status(201).json(idea)
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