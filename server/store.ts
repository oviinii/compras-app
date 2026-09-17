import fs from 'fs'
import path from 'path'
import { WebSocket } from 'ws'
import { Item } from '../src/App'

const DATA_DIR = path.resolve(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'items.json')

const INITIAL_ITEMS: Item[] = [
  { id: '1', name: 'Leite Integral', quantity: 2, unit: 'L', category: 'Laticínios', price: 4.89, completed: false },
  { id: '2', name: 'Pão de Açúcar / Francês', quantity: 6, unit: 'un', category: 'Padaria', price: 0.75, completed: true },
  { id: '3', name: 'Maçã Gala', quantity: 1, unit: 'kg', category: 'Hortifrúti', price: 8.90, completed: false },
  { id: '4', name: 'Detergente Neutro', quantity: 3, unit: 'un', category: 'Limpeza', price: 2.50, completed: false }
]

class ItemStore {
  private items: Item[] = []
  private wsClients: Set<WebSocket> = new Set()

  constructor() {
    this.load()
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8')
        this.items = JSON.parse(raw)
      } else {
        this.items = INITIAL_ITEMS
        this.save()
      }
    } catch {
      this.items = INITIAL_ITEMS
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true })
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.items, null, 2), 'utf-8')
    } catch (err) {
      console.error('Error saving items:', err)
    }
  }

  public registerClient(ws: WebSocket) {
    this.wsClients.add(ws)
    ws.send(JSON.stringify({ type: 'INIT', items: this.items }))

    ws.on('close', () => {
      this.wsClients.delete(ws)
    })
  }

  private broadcast() {
    const payload = JSON.stringify({ type: 'UPDATE', items: this.items })
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }

  public getItems(): Item[] {
    return this.items
  }

  public addItem(item: Omit<Item, 'id' | 'completed'>): Item {
    const newItem: Item = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      completed: false
    }
    this.items.unshift(newItem)
    this.save()
    this.broadcast()
    return newItem
  }

  public toggleItem(id: string): Item | null {
    const item = this.items.find((i) => i.id === id)
    if (item) {
      item.completed = !item.completed
      this.save()
      this.broadcast()
      return item
    }
    return null
  }

  public updateItem(id: string, updates: Partial<Item>): Item | null {
    const index = this.items.findIndex((i) => i.id === id)
    if (index !== -1) {
      this.items[index] = { ...this.items[index], ...updates }
      this.save()
      this.broadcast()
      return this.items[index]
    }
    return null
  }

  public deleteItem(id: string): boolean {
    const prevLen = this.items.length
    this.items = this.items.filter((i) => i.id !== id)
    if (this.items.length !== prevLen) {
      this.save()
      this.broadcast()
      return true
    }
    return false
  }

  public clearCompleted() {
    this.items = this.items.filter((i) => !i.completed)
    this.save()
    this.broadcast()
  }

  public clearAll() {
    this.items = []
    this.save()
    this.broadcast()
  }

  public setItems(newItems: Item[]) {
    this.items = newItems
    this.save()
    this.broadcast()
  }
}

export const store = new ItemStore()
