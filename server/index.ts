import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projects = [
  { id: 1, name: 'Digitaler Empfang', client: 'Hofmann & Partner', phase: 'Konzeption', progress: 64, nextStep: 'Workshop vorbereiten' },
  { id: 2, name: 'CRM-Neustart', client: 'Kernwerk GmbH', phase: 'Umsetzung', progress: 42, nextStep: 'Abnahme planen' },
  { id: 3, name: 'Prozesslandkarte', client: 'Stadtwerke Nord', phase: 'Analyse', progress: 27, nextStep: 'Interviews terminieren' },
]

const app = express()
const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

app.use(express.json())
app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))
app.get('/api/projects', (_request, response) => response.json(projects))
app.post('/api/projects', (request, response) => {
  const project = { id: projects.length + 1, ...request.body }
  projects.push(project)
  response.status(201).json(project)
})
app.use(express.static(path.join(rootDirectory, 'dist')))
app.get('{*splat}', (_request, response) => response.sendFile(path.join(rootDirectory, 'dist', 'index.html')))

const port = Number(process.env.PORT) || 3000
app.listen(port, () => console.log(`Project portal is running on port ${port}`))