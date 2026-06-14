```
 ██░ ██  ███▄ ▄███▓ ▄▄▄       ██▀███   ▄▄▄       █     █░▓█████▄▄▄█████▓
▓██░ ██▒▓██▒▀█▀ ██▒▒████▄    ▓██ ▒ ██▒▒████▄    ▓█░ █ ░█░▓█   ▀▓  ██▒ ▓▒
▒██▀▀██░▓██    ▓██░▒██  ▀█▄  ▓██ ░▄█ ▒▒██  ▀█▄  ▒█░ █ ░█ ▒███  ▒ ▓██░ ▒░
░▓█ ░██ ▒██    ▒██ ░██▄▄▄▄██ ▒██▀▀█▄  ░██▄▄▄▄██ ░█░ █ ░█ ▒▓█  ▄░ ▓██▓ ░
░▓█▒░██▓▒██▒   ░██▒ ▓█   ▓██▒░██▓ ▒██▒ ▓█   ▓██▒░░██▒██▓ ▒████▒ ▒██▒ ░
 ▒ ░░▒░▒░ ▒░   ░  ░ ▒▒   ▓▒█░░ ▒▓ ░▒▓░ ▒▒   ▓▒█░░ ▓░▒ ▒ ░░ ▒░░  ▒ ░░
 ▒ ░▒░ ░░  ░         ░▒   ▒▒ ░  ░▒ ░ ▒░  ░▒   ▒▒ ░  ▒ ░ ░   ░ ░     ░
 ░  ░░ ░░ ░          ░   ▒     ░░   ░    ░   ▒     ░   ░     ░      ░
 ░  ░  ░  ░              ░  ░   ░            ░  ░    ░       ░  ░
```

<p align="center">
  <b>multi-agent telegram bot orchestrator</b><br>
  spin up autonomous AI agents on Telegram via one REST API<br>
  <code>no subscriptions · no tokens to buy · no vendor lock-in</code>
</p>

---

```
┌──────────────────────────────────────────────────────┐
│  what is this?                                       │
└──────────────────────────────────────────────────────┘
```

Herald is the backend behind a self-serve agent deployment platform. You pick a template — researcher, trader, coder, whatever — paste your Telegram bot token from BotFather, and Herald spins up a fully autonomous AI agent using the Hermes CLI engine. Each agent gets its own isolated profile, personality, model config, and gateway process.

Think of it as a bot factory. One API call = one living, breathing Telegram agent.

```
┌──────────────────────────────────────────────────────┐
│  architecture                                        │
└──────────────────────────────────────────────────────┘

  ┌─────────────────┐         ┌─────────────────────┐
  │   end user       │         │   Telegram chat      │
  │   (browser)      │         │   (any client)       │
  └────────┬────────┘         └──────────┬──────────┘
           │                              │
           │ POST /api/agents/create      │ messages
           ▼                              ▼
  ┌────────────────────────────────────────────────────┐
  │               herald-backend (Fastify)             │
  │                                                    │
  │  ┌───────────┐  ┌──────────────┐  ┌─────────────┐ │
  │  │ server.js  │→│ provisioner  │→│  Hermes CLI  │ │
  │  │  (routes)  │  │  (lifecycle) │  │  (gateway)  │ │
  │  └───────────┘  └──────────────┘  └──────┬──────┘ │
  │        │                                   │      │
  │        ▼                                   ▼      │
  │  ┌───────────┐                 ┌────────────────┐ │
  │  │ stats.js  │                 │  agent profiles │ │
  │  │ (metrics) │                 │  ~/.hermes/     │ │
  │  └───────────┘                 │  profiles/      │ │
  │                                │  ├── .env       │ │
  │                                │  ├── config.yaml│ │
  │                                │  └── SOUL.md    │ │
  │                                └────────────────┘ │
  └────────────────────────────────────────────────────┘
           │
           ▼
  ┌─────────────────┐
  │  model providers │
  │  ┌─────────────┐ │
  │  │ MiMo        │ │
  │  │ Venice AI   │ │
  │  │ OpenAI      │ │
  │  │ MiniMax     │ │
  │  └─────────────┘ │
  └─────────────────┘
```

```
┌──────────────────────────────────────────────────────┐
│  features                                            │
└──────────────────────────────────────────────────────┘
```

```
  [*] one-click agent deployment via REST API
  [*] 6 built-in templates: researcher, trader, coder, community, writer, custom
  [*] multi-model: MiMo, Venice AI, OpenAI, MiniMax — pick per agent
  [*] isolated Hermes profiles with custom SOUL.md personalities
  [*] full lifecycle: create → start → stop → delete
  [*] live stats: agents deployed, messages sent, uptime
  [*] rate limiting (100 req/hr per IP)
  [*] CORS ready for frontend integration
  [*] PM2 ecosystem config for production
  [*] per-user API key support (BYOKey)
```

```
┌──────────────────────────────────────────────────────┐
│  quick start                                         │
└──────────────────────────────────────────────────────┘
```

```bash
# clone it
git clone https://github.com/Herald-agent/herald-backend.git
cd herald-backend

# install
npm install

# configure
cp .env.example .env
# edit .env — add at least one model API key

# run (dev)
node server.js

# run (production)
pm2 start ecosystem.config.js
```

server boots on `http://localhost:3001`

```
┌──────────────────────────────────────────────────────┐
│  api reference                                       │
└──────────────────────────────────────────────────────┘
```

```
  GET    /health               → { status, uptime }
  GET    /api/stats            → { totalAgents, onlineAgents, totalMessages }
  GET    /api/providers        → [{ id, name, model, free, serverKeyAvailable }]
  POST   /api/agents/create    → deploy new agent
  GET    /api/agents           → list all agents
  GET    /api/agents/:id       → get agent details
  POST   /api/agents/:id/stop  → stop agent gateway
  POST   /api/agents/:id/start → restart stopped agent
  DELETE /api/agents/:id       → nuke agent + cleanup profile
```

### create agent payload

```json
{
  "template": "researcher",
  "name": "MyResearchBot",
  "personality": "optional — custom SOUL.md content",
  "telegramToken": "7123456789:AAHxxxxxxxxxxxxxxxxxxxxx",
  "modelProvider": "mimo",
  "apiKey": "optional — uses server key if omitted"
}
```

```
┌──────────────────────────────────────────────────────┐
│  supported models                                    │
└──────────────────────────────────────────────────────┘
```

```
  provider    model             free?    notes
  ────────────────────────────────────────────────────
  mimo        mimo-v2.5-pro     ✓        multimodal, vision + text
  venice      llama-3.3-70b     BYOKey   private, uncensored
  openai      gpt-4o-mini       ✓        fast, cheap
  minimax     MiniMax-M3        ✓        long context, multilingual
```

```
┌──────────────────────────────────────────────────────┐
│  env variables                                       │
└──────────────────────────────────────────────────────┘
```

```
  PORT                  server port (default: 3001)
  MAX_GATEWAYS          max concurrent gateways (default: 5)
  XIAOMI_API_KEY        xiaomi mimo API key
  OPENAI_API_KEY        openai API key
  TOKENROUTER_API_KEY   tokenrouter / minimax API key
  VENICE_API_KEY        venice AI API key
  HERMES_BIN            path to hermes binary
```

```
┌──────────────────────────────────────────────────────┐
│  project structure                                   │
└──────────────────────────────────────────────────────┘
```

```
  herald-backend/
  ├── server.js             Fastify routes + app setup
  ├── provisioner.js        agent lifecycle (create/start/stop/delete)
  ├── stats.js              metrics + gateway counting
  ├── ecosystem.config.js   PM2 production config
  ├── package.json
  ├── .env.example
  ├── .gitignore
  ├── public/
  │   └── index.html        landing page + deploy form
  └── README.md
```

```
┌──────────────────────────────────────────────────────┐
│  tech stack                                          │
└──────────────────────────────────────────────────────┘
```

```
  runtime ........... Node.js
  framework ......... Fastify 5
  process manager ... PM2
  agent engine ...... Hermes CLI (Nous Research)
  frontend .......... vanilla HTML/CSS/JS
```

```
┌──────────────────────────────────────────────────────┐
│  license                                             │
└──────────────────────────────────────────────────────┘
```

ISC

```
 ╔═══════════════════════════════════════════════════════════════╗
 ║                                                               ║
 ║   built with the Hermes agent engine · Nous Research          ║
 ║                                                               ║
 ║   herald-agent.com · github.com/Herald-agent                  ║
 ║                                                               ║
 ╚═══════════════════════════════════════════════════════════════╝
```
