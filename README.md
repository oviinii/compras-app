# Lista de Compras

Aplicativo de lista de compras em tempo real, com **PWA instalável**, sincronização via **WebSocket** e integração com **bot do Telegram**: mensagens enviadas no grupo entram automaticamente na lista.

## Funcionalidades

- Adicionar, editar, concluir e excluir itens (nome, quantidade, unidade, categoria e preço)
- Totais: itens comprados, valor no carrinho e total estimado
- Busca e filtros por categoria e status
- Bot do Telegram no grupo **Compras-App**: qualquer mensagem vira item (ex: `2 kg de banana`, `3 caixas de leite R$ 4,89`)
- Comandos no Telegram: `/lista`, `/limpar`, `/ajuda`
- PWA: instalável na tela inicial, com suporte offline e reconexão automática
- Página de Configurações com botão "Adicionar à Tela Inicial"
- Dados persistidos no servidor (`data/items.json`) + fallback local no navegador

## Tecnologias

- Frontend: React + TypeScript + Vite + Tailwind CSS + `lucide-react`
- PWA: `vite-plugin-pwa` (Workbox)
- Backend: Node.js + Express + WebSocket (`ws`) + `telegraf` + `tsx`

## Configuração

```bash
npm install
```

Copie o exemplo de variáveis de ambiente e preencha o token do bot:

```bash
cp .env.example .env
```

```env
PORT=3001
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

### Criar o bot do Telegram

1. Fale com o `@BotFather` no Telegram e crie um bot com `/newbot`
2. Desative a privacidade do grupo: `/mybots` → seu bot → **Bot Settings** → **Group Privacy** → **Turn off**
3. Adicione o bot ao grupo **Compras-App**
4. Cole o token no `.env`

## Rodando localmente

```bash
npm run dev:all
```

- App web: http://localhost:5173
- API + WebSocket: http://localhost:3001

Outros scripts:

| Comando        | Descrição                              |
| -------------- | -------------------------------------- |
| `npm run dev`  | Só o frontend (Vite)                   |
| `npm run server` | Só o backend + bot (tsx)             |
| `npm run build`  | Compila o frontend                    |
| `npm start`    | Build + servidor (modo produção)       |

## Deploy na VPS (Docker)

O projeto inclui um `Dockerfile` pronto. Na VPS:

```bash
git clone https://github.com/oviinii/compras-app.git /opt/compras-app
# coloque o .env com o TELEGRAM_BOT_TOKEN em /opt/compras-app/.env
docker build -t compras-app:latest /opt/compras-app
docker run -d --name compras-app --restart unless-stopped \
  -p 3003:3001 \
  --env-file /opt/compras-app/.env \
  -v /opt/compras-app/data:/app/data \
  compras-app:latest
```

O servidor atende o frontend, a API e o WebSocket na mesma porta.

## Estrutura

```
├── server/           # Backend: API, WebSocket, bot do Telegram e parser de mensagens
├── src/              # Frontend React
│   ├── components/   # Telas (ex: Configurações)
│   └── hooks/        # Hooks (ex: instalação do PWA)
├── public/           # Ícones do PWA e favicon
├── data/             # Persistência local (ignorado pelo git)
└── Dockerfile        # Imagem de produção
```
