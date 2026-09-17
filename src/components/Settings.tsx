import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Info,
  MessageCircle,
  MoreVertical,
  Radio,
  Share,
  Smartphone
} from 'lucide-react'
import { usePWAInstall } from '../hooks/usePWAInstall'

interface SettingsProps {
  connected: boolean
  onBack: () => void
}

export default function Settings({ connected, onBack }: SettingsProps) {
  const { canInstall, installed, dismissed, isIOS, install } = usePWAInstall()
  const [installing, setInstalling] = useState(false)

  const handleInstall = async () => {
    setInstalling(true)
    await install()
    setInstalling(false)
  }

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para a lista
      </button>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Smartphone className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Instalar aplicativo</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Adicione à tela inicial para acesso rápido, em tela cheia e com suporte offline.
        </p>

        {installed ? (
          <div className="flex items-center gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              App instalado! Você já está usando a versão instalada.
            </p>
          </div>
        ) : canInstall ? (
          <div>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              {installing ? 'Aguarde...' : 'Adicionar à Tela Inicial'}
            </button>
            {dismissed && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                Instalação dispensada. Toque novamente no botão quando quiser instalar.
              </p>
            )}
          </div>
        ) : isIOS ? (
          <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <span className="flex items-center gap-1.5 flex-wrap">
                Toque no botão <Share className="w-4 h-4 text-indigo-600" /> <strong>Compartilhar</strong> na barra do Safari
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span>Role para baixo e toque em <strong>“Adicionar à Tela de Início”</strong></span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
              <span>Confirme tocando em <strong>“Adicionar”</strong> no canto superior</span>
            </li>
          </ol>
        ) : (
          <ol className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <span className="flex items-center gap-1.5 flex-wrap">
                Toque nos <MoreVertical className="w-4 h-4 text-indigo-600" /> <strong>3 pontos</strong> no canto do Chrome
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span>Toque em <strong>“Adicionar à tela inicial”</strong> ou <strong>“Instalar app”</strong></span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center">3</span>
              <span>Confirme em <strong>“Instalar”</strong> / <strong>“Adicionar”</strong></span>
            </li>
          </ol>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Radio className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Conexão</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Status: <strong className={connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
            {connected ? 'Ao vivo — sincronizando' : 'Offline — usando dados locais'}
          </strong>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Quando há conexão com o servidor, a lista atualiza em tempo real, incluindo itens enviados pelo Telegram.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg">
            <MessageCircle className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Telegram</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Envie mensagens no grupo <strong>Compras-App</strong> para adicionar itens automaticamente. Exemplos:
        </p>
        <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
          <li><code className="text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">2 kg de banana</code></li>
          <li><code className="text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">3 caixas de leite R$ 4,89</code></li>
          <li><code className="text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">/lista</code> — ver a lista atual no grupo</li>
          <li><code className="text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">/limpar</code> — remover itens já comprados</li>
        </ul>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 rounded-lg">
            <Info className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold">Sobre</h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Lista de Compras • PWA instalável com suporte offline • Sincronização via WebSocket + Bot do Telegram
        </p>
      </div>
    </div>
  )
}
