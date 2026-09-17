import React, { useState, useEffect, useMemo } from 'react'
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  Circle,
  Pencil,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Radio,
  List,
  Settings as SettingsIcon
} from 'lucide-react'
import Settings from './components/Settings'

export interface Item {
  id: string
  name: string
  quantity: number
  unit: string
  category: string
  price: number
  completed: boolean
}

const CATEGORIES = [
  { id: 'Hortifrúti', label: 'Hortifrúti', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { id: 'Laticínios', label: 'Laticínios & Frios', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'Padaria', label: 'Padaria', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { id: 'Carnes', label: 'Carnes & Peixes', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
  { id: 'Bebidas', label: 'Bebidas', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  { id: 'Limpeza', label: 'Limpeza', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' },
  { id: 'Higiene', label: 'Higiene Pessoal', color: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' },
  { id: 'Mercearia', label: 'Mercearia & Outros', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' }
]

const UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx']

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : ''

const OUTBOX_KEY = 'compras_app_outbox'

function enqueueOutbox(id: string) {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    if (!ids.includes(id)) {
      ids.push(id)
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(ids))
    }
  } catch {}
}

async function flushOutbox(): Promise<void> {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    if (!raw) return
    const ids: string[] = JSON.parse(raw)
    if (!ids.length) {
      localStorage.removeItem(OUTBOX_KEY)
      return
    }
    const current: Item[] = JSON.parse(localStorage.getItem('compras_app_items') || '[]')
    for (const id of ids) {
      const item = current.find((i) => i.id === id)
      if (!item) continue
      const res = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          price: item.price
        })
      })
      if (!res.ok) throw new Error('sync failed')
    }
    localStorage.removeItem(OUTBOX_KEY)
  } catch {
    // sem rede: tenta de novo na próxima reconexão
  }
}

export default function App() {
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('compras_app_items')
    return saved ? JSON.parse(saved) : []
  })

  const [connected, setConnected] = useState(false)

  const [view, setView] = useState<'list' | 'settings'>('list')

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState<number>(1)
  const [unit, setUnit] = useState('un')
  const [category, setCategory] = useState('Mercearia')
  const [price, setPrice] = useState<string>('')

  const [search, setSearch] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('Todas')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editQuantity, setEditQuantity] = useState<number>(1)
  const [editUnit, setEditUnit] = useState('un')
  const [editCategory, setEditCategory] = useState('Mercearia')
  const [editPrice, setEditPrice] = useState<string>('')

  useEffect(() => {
    localStorage.setItem('compras_app_items', JSON.stringify(items))
  }, [items])

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = import.meta.env.DEV ? 'localhost:3001' : window.location.host
    const wsUrl = `${protocol}//${host}`

    let ws: WebSocket | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let attempts = 0
    let stopped = false

    const syncFromServer = async () => {
      await flushOutbox()
      try {
        const res = await fetch(`${API_BASE}/api/items`)
        if (res.ok) {
          const data: Item[] = await res.json()
          setItems(data)
        }
      } catch {
        // sem rede: mantém os dados locais
      }
    }

    const scheduleReconnect = () => {
      if (stopped || retryTimer) return
      const delay = Math.min(1000 * 2 ** attempts, 30000)
      attempts += 1
      retryTimer = setTimeout(() => {
        retryTimer = null
        connect()
      }, delay)
    }

    const connect = () => {
      if (stopped) return
      if (retryTimer) {
        clearTimeout(retryTimer)
        retryTimer = null
      }
      let socket: WebSocket
      try {
        socket = new WebSocket(wsUrl)
      } catch {
        scheduleReconnect()
        return
      }
      ws = socket

      socket.onopen = () => {
        attempts = 0
        setConnected(true)
        void syncFromServer()
      }
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'INIT' || data.type === 'UPDATE') {
            setItems(data.items)
          }
        } catch {}
      }
      socket.onclose = () => {
        if (ws === socket) {
          setConnected(false)
          scheduleReconnect()
        }
      }
      socket.onerror = () => {
        socket.close()
      }
    }

    const handleOnline = () => {
      if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        attempts = 0
        connect()
      } else if (ws.readyState === WebSocket.OPEN) {
        void syncFromServer()
      }
    }

    const handleOffline = () => setConnected(false)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleOnline()
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('visibilitychange', handleVisibility)
    connect()

    return () => {
      stopped = true
      if (retryTimer) clearTimeout(retryTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibility)
      ws?.close()
    }
  }, [])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const newItemData = {
      name: name.trim(),
      quantity: Number(quantity) || 1,
      unit,
      category,
      price: price ? parseFloat(price.replace(',', '.')) || 0 : 0
    }

    try {
      const res = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItemData)
      })
      if (!res.ok) throw new Error()
    } catch {
      const localItem: Item = {
        ...newItemData,
        id: Date.now().toString(),
        completed: false
      }
      setItems((prev) => [localItem, ...prev])
      enqueueOutbox(localItem.id)
    }

    setName('')
    setQuantity(1)
    setPrice('')
  }

  const toggleItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/items/${id}/toggle`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
      )
    }
  }

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/items/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const startEdit = (item: Item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditQuantity(item.quantity)
    setEditUnit(item.unit)
    setEditCategory(item.category)
    setEditPrice(item.price ? item.price.toString() : '')
  }

  const saveEdit = async (id: string) => {
    const updates = {
      name: editName.trim(),
      quantity: Number(editQuantity) || 1,
      unit: editUnit,
      category: editCategory,
      price: editPrice ? parseFloat(editPrice.replace(',', '.')) || 0 : 0
    }

    try {
      const res = await fetch(`${API_BASE}/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error()
    } catch {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
    }
    setEditingId(null)
  }

  const clearCompleted = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/items/completed`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setItems((prev) => prev.filter((item) => !item.completed))
    }
  }

  const clearAll = async () => {
    if (!confirm('Tem certeza de que deseja apagar toda a lista?')) return

    try {
      const res = await fetch(`${API_BASE}/api/items/all`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
    } catch {
      setItems([])
    }
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        selectedCategoryFilter === 'Todas' || item.category === selectedCategoryFilter
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'completed'
          ? item.completed
          : !item.completed

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [items, search, selectedCategoryFilter, statusFilter])

  const totals = useMemo(() => {
    const totalCount = items.length
    const completedCount = items.filter((i) => i.completed).length
    const pendingCount = totalCount - completedCount

    const totalPrice = items.reduce((acc, i) => acc + i.quantity * (i.price || 0), 0)
    const completedPrice = items
      .filter((i) => i.completed)
      .reduce((acc, i) => acc + i.quantity * (i.price || 0), 0)
    const pendingPrice = totalPrice - completedPrice

    return {
      totalCount,
      completedCount,
      pendingCount,
      totalPrice,
      completedPrice,
      pendingPrice
    }
  }, [items])

  const getCategoryBadgeClass = (catName: string) => {
    const found = CATEGORIES.find((c) => c.id === catName)
    return found ? found.color : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-md">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lista de Compras</h1>
                <span
                  title={connected ? 'Conectado ao Telegram & Servidor em Tempo Real' : 'Modo Offline / Local'}
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    connected
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  {connected ? 'Ao Vivo (Telegram Sync)' : 'Offline'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Sincronizado em tempo real com o seu grupo do Telegram
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {view === 'list' && items.length > 0 && (
              <>
              <button
                onClick={clearCompleted}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Limpar Comprados
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 text-xs sm:text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition"
              >
                Limpar Tudo
              </button>
              </>
            )}
            <button
              onClick={() => setView(view === 'list' ? 'settings' : 'list')}
              title={view === 'list' ? 'Abrir configurações' : 'Voltar para a lista'}
              className={`p-2 rounded-lg transition ${
                view === 'settings'
                  ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {view === 'list' ? <SettingsIcon className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {view === 'list' ? (
          <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Itens</span>
              <div className="text-lg font-bold">
                {totals.completedCount} / {totals.totalCount} <span className="text-xs font-normal text-slate-500">comprados</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">No Carrinho</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                R$ {totals.completedPrice.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Estimado</span>
              <div className="text-lg font-bold">
                R$ {totals.totalPrice.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Item
              </label>
              <input
                type="text"
                placeholder="Ex: Arroz, Leite, Sabão..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Preço Unit. (R$)
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Qtd:
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              Adicionar Item
            </button>
          </div>
        </form>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    statusFilter === 'pending'
                      ? 'bg-white dark:bg-slate-800 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-md transition ${
                    statusFilter === 'completed'
                      ? 'bg-white dark:bg-slate-800 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Comprados
                </button>
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Todas">Todas Categorias</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Nenhum item encontrado
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Adicione novos itens ou envie uma mensagem no Telegram!
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredItems.map((item) => (
                <li key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                  {editingId === item.id ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="sm:col-span-4 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm"
                      />
                      <div className="sm:col-span-3 flex gap-1">
                        <input
                          type="number"
                          step="any"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm"
                        />
                        <select
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value)}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="sm:col-span-3 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="R$"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="sm:col-span-2 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-sm"
                      />
                      <div className="sm:col-span-12 flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-medium"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="text-slate-400 hover:text-indigo-600 transition flex-shrink-0"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-medium ${
                                item.completed
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {item.name}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getCategoryBadgeClass(
                                item.category
                              )}`}
                            >
                              {item.category}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {item.quantity} {item.unit}
                            {item.price ? ` • R$ ${item.price.toFixed(2)}/un` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700/40">
                        <div className="text-right">
                          <div className="text-xs text-slate-400 dark:text-slate-500">Subtotal</div>
                          <div className="text-sm font-semibold">
                            R$ {((item.price || 0) * item.quantity).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => startEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
          </>
        ) : (
          <Settings connected={connected} onBack={() => setView('list')} />
        )}
      </div>
    </div>
  )
}
