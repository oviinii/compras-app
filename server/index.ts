import express from 'express'
import cors from 'cors'
import http from 'http'
import { WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import path from 'path'
import { store } from './store'
import { setupTelegramBot } from './bot'

dotenv.config()

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.get('/api/items', (req, res) => {
  res.json(store.getItems())
})

app.post('/api/items', (req, res) => {
  const { name, quantity, unit, category, price } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Nome é obrigatório' })
  }
  const item = store.addItem({
    name,
    quantity: Number(quantity) || 1,
    unit: unit || 'un',
    category: category || 'Mercearia',
    price: Number(price) || 0
  })
  res.status(201).json(item)
})

app.put('/api/items/:id', (req, res) => {
  const updated = store.updateItem(req.params.id, req.body)
  if (!updated) {
    return res.status(404).json({ error: 'Item não encontrado' })
  }
  res.json(updated)
})

app.patch('/api/items/:id/toggle', (req, res) => {
  const updated = store.toggleItem(req.params.id)
  if (!updated) {
    return res.status(404).json({ error: 'Item não encontrado' })
  }
  res.json(updated)
})

app.delete('/api/items/completed', (req, res) => {
  store.clearCompleted()
  res.json({ success: true })
})

app.delete('/api/items/all', (req, res) => {
  store.clearAll()
  res.json({ success: true })
})

app.delete('/api/items/:id', (req, res) => {
  const deleted = store.deleteItem(req.params.id)
  if (!deleted) {
    return res.status(404).json({ error: 'Item não encontrado' })
  }
  res.json({ success: true })
})

const distPath = path.resolve(process.cwd(), 'dist')
app.use(express.static(distPath))

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next()
  })
})

wss.on('connection', (ws) => {
  store.registerClient(ws)
})

const telegramToken = process.env.TELEGRAM_BOT_TOKEN || ''
setupTelegramBot(telegramToken)

server.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando na porta ${PORT}`)
})
