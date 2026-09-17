import { Telegraf } from 'telegraf'
import { parseMessageToItem } from './parser'
import { store } from './store'

export function setupTelegramBot(token: string) {
  if (!token || token.trim() === '' || token === 'SEU_TELEGRAM_BOT_TOKEN') {
    console.log('⚠️ BOT_TOKEN do Telegram não configurado em TELEGRAM_BOT_TOKEN no .env')
    return null
  }

  const bot = new Telegraf(token)

  bot.start((ctx) => {
    ctx.reply(
      '🛒 *Bot da Lista de Compras conectado!*\n\n' +
        'Basta enviar o nome do item no grupo para adicionar à lista.\n' +
        'Exemplos:\n' +
        '• `2 kg de banana`\n' +
        '• `3 caixas de leite R$ 4,89`\n' +
        '• `Detergente` \n\n' +
        'Comandos disponíveis:\n' +
        '• /lista - Ver lista atual\n' +
        '• /limpar - Limpar itens comprados\n' +
        '• /ajuda - Instruções',
      { parse_mode: 'Markdown' }
    )
  })

  bot.help((ctx) => {
    ctx.reply(
      '💡 *Como usar:*\n' +
        'Envie o nome do item diretamente no grupo "Compras-App".\n' +
        'O bot reconhece quantidades (kg, L, un, cx) e valores (R$).\n\n' +
        '/lista - Mostra todos os itens\n' +
        '/limpar - Remove itens já comprados',
      { parse_mode: 'Markdown' }
    )
  })

  bot.command('lista', (ctx) => {
    const items = store.getItems()
    if (items.length === 0) {
      return ctx.reply('🛒 A lista de compras está vazia!')
    }

    const pending = items.filter((i) => !i.completed)
    const completed = items.filter((i) => i.completed)

    let msg = '🛒 *LISTA DE COMPRAS*\n\n'

    if (pending.length > 0) {
      msg += '📌 *PENDENTES:*\n'
      pending.forEach((item) => {
        const priceStr = item.price ? ` (R$ ${(item.price * item.quantity).toFixed(2)})` : ''
        msg += `• [${item.category}] *${item.name}* - ${item.quantity} ${item.unit}${priceStr}\n`
      })
      msg += '\n'
    }

    if (completed.length > 0) {
      msg += '✅ *COMPRADOS:*\n'
      completed.forEach((item) => {
        msg += `• ~${item.name}~ (${item.quantity} ${item.unit})\n`
      })
    }

    const totalPrice = items.reduce((acc, i) => acc + i.quantity * (i.price || 0), 0)
    msg += `\n💰 *Total Estimado:* R$ ${totalPrice.toFixed(2)}`

    ctx.reply(msg, { parse_mode: 'Markdown' })
  })

  bot.command('limpar', (ctx) => {
    store.clearCompleted()
    ctx.reply('🧹 Itens comprados foram removidos da lista!')
  })

  bot.on('text', (ctx) => {
    const text = ctx.message.text.trim()
    if (text.startsWith('/')) return

    const parsed = parseMessageToItem(text)
    if (!parsed.name || parsed.name.length < 2) return

    const item = store.addItem(parsed)

    const priceText = item.price ? ` (R$ ${(item.price * item.quantity).toFixed(2)})` : ''
    ctx.reply(
      `✅ *${item.name}* (${item.quantity} ${item.unit})${priceText} foi adicionado à lista! \n🏷️ Categoria: _${item.category}_`,
      { parse_mode: 'Markdown' }
    )
  })

  bot.launch().then(() => {
    console.log('🤖 Telegram Bot rodando com sucesso!')
  }).catch((err) => {
    console.error('Erro ao iniciar o bot do Telegram:', err.message)
  })

  process.once('SIGINT', () => bot.stop('SIGINT'))
  process.once('SIGTERM', () => bot.stop('SIGTERM'))

  return bot
}
