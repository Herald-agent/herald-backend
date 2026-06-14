<p align="center">
<pre>
 _   _ _____ ____  _     _     ____
| | | | ____|  _ \| |   / \   |  _ \
| |_| |  _| | |_) | |  / _ \  | | | |
|  _  | |___|  _ <| |_/ ___ \ | |_| |
|_| |_|_____|_| \_\____/   \_\|____/
</pre>
</p>

<p align="center">
  <b>multi-agent telegram bot orchestrator</b><br>
  spin up autonomous AI agents on Telegram via one REST API<br>
  <code>no subscriptions · no tokens to buy · no vendor lock-in</code>
</p>

---

## what is this?

Herald is the backend behind a self-serve agent deployment platform. You pick a template — researcher, trader, coder, whatever — paste your Telegram bot token from BotFather, and Herald spins up a fully autonomous AI agent using the Hermes CLI engine. Each agent gets its own isolated profile, personality, model config, and gateway process.

Think of it as a bot factory. One API call = one living, breathing Telegram agent.

## architecture

```
  [browser]          [Telegram]
     | POST /api/agents | messages
     v create          v
  +------------------------------------+
  |     herald-backend (Fastify)       |
  |                                    |
  |  server.js --> provisioner --> Hermes CLI
  |  (routes)     (lifecycle)          |
  |      |                   |         |
  |      v                   v         |
  |  stats.js         agent profiles   |
  |  (metrics)        ~/.hermes/       |
  |                   profiles/agent_* |
  +------------------------------------+
                   |
                   v
            +--------------+
            | model engines|
            | MiMo Venice  |
            | OpenAI MiniMax|
            +--------------+
```

## features

- one-click agent deployment via REST API
- 6 built-in templates: researcher, trader, coder, community, writer, custom
- multi-model: MiMo, Venice AI, OpenAI, MiniMax — pick per agent
- isolated Hermes profiles with custom SOUL.md personalities
- full lifecycle: create -> start -> stop -> delete
- live stats: agents deployed, messages sent, uptime
- rate limiting (100 req/hr per IP)
- CORS ready for frontend integration
- PM2 ecosystem config for production
- per-user API key support (BYOKey)

## quick start

```bash
git clone https://github.com/Herald-agent/herald-backend.git
cd herald-backend
npm install
cp .env.example .env
# edit .env — add at least one model API key

# dev
node server.js

# production
pm2 start ecosystem.config.js
```

server boots on `http://localhost:3001`

## api

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | status + uptime |
| GET | `/api/stats` | agents deployed, messages sent |
| GET | `/api/providers` | available model providers |
| POST | `/api/agents/create` | deploy new agent |
| GET | `/api/agents` | list all agents |
| GET | `/api/agents/:id` | agent details |
| POST | `/api/agents/:id/stop` | stop agent gateway |
| POST | `/api/agents/:id/start` | restart agent |
| DELETE | `/api/agents/:id` | delete + cleanup |

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

## supported models

| provider | model | free? | notes |
|----------|-------|-------|-------|
| mimo | mimo-v2.5-pro | yes | multimodal, vision + text |
| venice | llama-3.3-70b | BYOKey | private, uncensored |
| openai | gpt-4o-mini | yes | fast, cheap |
| minimax | MiniMax-M3 | yes | long context, multilingual |

## env variables

| var | description |
|-----|-------------|
| `PORT` | server port (default: 3001) |
| `MAX_GATEWAYS` | max concurrent gateways (default: 5) |
| `XIAOMI_API_KEY` | xiaomi mimo API key |
| `OPENAI_API_KEY` | openai API key |
| `TOKENROUTER_API_KEY` | tokenrouter / minimax API key |
| `VENICE_API_KEY` | venice AI API key |
| `HERMES_BIN` | path to hermes binary |

## project structure

```
herald-backend/
+-- server.js             routes + app setup
+-- provisioner.js        agent lifecycle
+-- stats.js              metrics
+-- ecosystem.config.js   PM2 config
+-- package.json
+-- .env.example
+-- public/
|   +-- index.html        landing page + deploy form
+-- README.md
```

## tech stack

**Runtime** Node.js · **Framework** Fastify 5 · **Process Manager** PM2 · **Agent Engine** Hermes CLI (Nous Research) · **Frontend** vanilla HTML/CSS/JS

## license

ISC

---

<p align="center">
  built with the Hermes agent engine · Nous Research<br>
  <a href="https://herald-agent.com">herald-agent.com</a>
</p>
