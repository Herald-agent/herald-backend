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


# herald-backend

Multi-agent Telegram bot orchestrator. Spin up AI agents on Telegram in under 60 seconds — each with its own personality, model, and Hermes skill profile. One REST API, infinite bots.


## what is this?

Herald is the backend for a self-serve agent deployment platform. Users pick a template (researcher, trader, coder, etc.), paste their Telegram bot token, and Herald provisions a fully autonomous AI agent via the Hermes CLI. Each agent gets its own isolated profile with a SOUL.md personality, model config, and gateway process.

Think of it as a bot factory.


## architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER (browser)                        │
│                     herald-agent.ai web                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ POST /api/agents/create
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    herald-backend (Fastify)                  │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ server.js │→│ provisioner.js│→│  Hermes CLI (per agent) │ │
│  │  (routes) │  │  (lifecycle)  │  │  gateway run --replace │ │
│  └──────────┘  └──────────────┘  └────────────────────────┘ │
│        │                                    │               │
│        ▼                                    ▼               │
│  ┌──────────┐                    ┌───────────────────┐      │
│  │ stats.js │                    │ ~/.hermes/profiles/│      │
│  │ (metrics)│                    │  agent_<id>/       │      │
│  └──────────┘                    │    ├── .env        │      │
│                                  │    ├── config.yaml │      │
│                                  │    └── SOUL.md     │      │
│                                  └───────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   Telegram   │
                   │    Bot API   │
                   └──────────────┘
```


## features

- one-click agent deployment via REST API
- 6 built-in templates: researcher, trader, coder, community, writer, custom
- multi-model support: Xiaomi MiMo, Venice AI, OpenAI, MiniMax
- per-agent isolated Hermes profiles with custom SOUL.md
- full agent lifecycle: create, start, stop, delete
- live stats endpoint (agents deployed, messages sent)
- rate limiting (100 req/hr per IP)
- CORS enabled for frontend integration
- PM2 ecosystem config for production


## quick start

```bash
# clone
git clone https://github.com/Herald-agent/herald-backend.git
cd herald-backend

# install deps
npm install

# configure
cp .env.example .env
# edit .env — add at least one model API key

# run (dev)
node server.js

# run (production)
pm2 start ecosystem.config.js
```

server starts on `http://localhost:3001`


## api endpoints

```
GET  /health              → { status, uptime }
GET  /api/stats           → { totalAgents, onlineAgents, totalMessages, runningGateways }
GET  /api/providers       → [{ id, name, model, description, free, serverKeyAvailable }]
POST /api/agents/create   → create a new agent (body: template, name, telegramToken, modelProvider, ...)
GET  /api/agents          → list all agents
GET  /api/agents/:id      → get agent by id
POST /api/agents/:id/stop → stop an agent's gateway
POST /api/agents/:id/start→ restart a stopped agent
DELETE /api/agents/:id    → stop + delete agent + cleanup profile
```


### create agent payload

```json
{
  "template": "researcher",
  "name": "MyResearchBot",
  "personality": "optional custom SOUL.md content",
  "telegramToken": "7123456789:AAHxxxxxxxxxxxxxxxxxxxxx",
  "modelProvider": "mimo",
  "apiKey": "optional — uses server key if omitted"
}
```


## supported models

| provider | model          | free?  | notes                          |
|----------|----------------|--------|--------------------------------|
| mimo     | mimo-v2.5-pro  | yes    | multimodal, vision + text      |
| venice   | llama-3.3-70b  | BYOKey | private, uncensored            |
| openai   | gpt-4o-mini    | yes    | fast, cheap                    |
| minimax  | MiniMax-M3     | yes    | long context, multilingual     |


## env variables

```
PORT                  server port (default: 3001)
MAX_GATEWAYS          max concurrent gateways
XIAOMI_API_KEY        xiaomi mimo API key
OPENAI_API_KEY        openai API key
TOKENROUTER_API_KEY   tokenrouter/minimax API key
VENICE_API_KEY        venice AI API key
HERMES_BIN            path to hermes binary (default: /home/ubuntu/.local/bin/hermes)
```


## tech stack

- **Runtime:** Node.js
- **Framework:** Fastify 5
- **Process Manager:** PM2
- **Agent Engine:** Hermes CLI
- **Frontend:** vanilla HTML/CSS/JS (served as static)


## project structure

```
herald-backend/
├── server.js           ← Fastify routes + app setup
├── provisioner.js      ← agent lifecycle (create/start/stop/delete)
├── stats.js            ← metrics + gateway counting
├── ecosystem.config.js ← PM2 config
├── package.json
├── .env.example
├── .gitignore
├── public/
│   └── index.html      ← landing page + deploy form
└── README.md
```


## license

ISC


```
 ╔═══════════════════════════════════════════════════╗
 ║  built with the Hermes agent engine by Nous Research  ║
 ╚═══════════════════════════════════════════════════╝
```
