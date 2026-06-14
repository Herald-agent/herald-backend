const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const HERMES_BIN = process.env.HERMES_BIN || '/home/ubuntu/.local/bin/hermes';
const PROFILES_DIR = path.join(process.env.HOME || '/home/ubuntu', '.hermes/profiles');
const AGENTS_FILE = path.join(__dirname, 'agents.json');

// Model providers config
const MODEL_PROVIDERS = {
  mimo: {
    name: 'Xiaomi MiMo',
    model: 'mimo-v2.5-pro',
    provider: 'xiaomi',
    base_url: 'https://token-plan-sgp.xiaomimimo.com/v1',
    env_key: 'XIAOMI_API_KEY',
    description: 'Multimodal reasoning model by Xiaomi',
    free: true,
  },
  venice: {
    name: 'Venice AI',
    model: 'llama-3.3-70b',
    provider: 'custom',
    base_url: 'https://api.venice.ai/api/v1',
    env_key: 'VENICE_API_KEY',
    description: 'Private, uncensored AI inference',
    free: false,
  },
  openai: {    name: 'OpenAI',    model: 'gpt-4o-mini',    provider: 'openai',    base_url: 'https://api.openai.com/v1',    env_key: 'OPENAI_API_KEY',    description: 'GPT-4o-mini — fast & cheap by OpenAI',    free: true,  },
  minimax: {
    name: 'MiniMax',
    model: 'MiniMax-M3',
    provider: 'custom',
    base_url: 'https://api.tokenrouter.com/v1',
    env_key: 'TOKENROUTER_API_KEY',
    description: 'Fast reasoning · Long context · Multilingual',
    free: true,
  },
};

function getApiKeyForProvider(providerKey) {
  if (providerKey === 'mimo') return process.env.XIAOMI_API_KEY || null;
  if (providerKey === 'venice') return process.env.VENICE_API_KEY || null;
  if (providerKey === 'openai') return process.env.OPENAI_API_KEY || null;
  if (providerKey === 'minimax') return process.env.TOKENROUTER_API_KEY || null;
  return null;
}

function loadAgents() {
  try {
    if (fs.existsSync(AGENTS_FILE)) {
      return JSON.parse(fs.readFileSync(AGENTS_FILE, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return {};
}

function saveAgents(agents) {
  fs.writeFileSync(AGENTS_FILE, JSON.stringify(agents, null, 2));
}

async function createAgent({ template, name, personality, telegramToken, platform, botUsername, modelProvider, userApiKey }) {
  const provider = MODEL_PROVIDERS[modelProvider || 'mimo'];
  if (!provider) throw new Error(`Unknown model provider: ${modelProvider}`);

  const agentId = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  const profileName = `agent_${agentId}`;
  const profileDir = path.join(PROFILES_DIR, profileName);

  // Create Hermes profile
  try {
    execSync(`${HERMES_BIN} profile create ${profileName} --no-alias --no-skills 2>&1`, { encoding: 'utf8', timeout: 30000 });
  } catch (e) {
    if (!e.message?.includes('already exists')) throw e;
  }

  // Ensure dirs
  fs.mkdirSync(profileDir, { recursive: true });
  fs.mkdirSync(path.join(profileDir, 'logs'), { recursive: true });

  // Determine API key
  const apiKey = userApiKey || getApiKeyForProvider(modelProvider);
  if (!apiKey) throw new Error(`No API key for ${provider.name}. Provide your own key.`);

  // Write .env
  const envLines = [];
  envLines.push('TELEGRAM_BOT_TOKEN=' + telegramToken);
  envLines.push('GATEWAY_ALLOW_ALL_USERS=true');
  envLines.push(provider.env_key + '=' + apiKey);
  const envContent = envLines.join('\n');
  fs.writeFileSync(path.join(profileDir, '.env'), envContent);

  // Write config.yaml
  const configContent = [
    `model:`,
    `  default: ${provider.model}`,
    `  provider: ${provider.provider}`,
    `  base_url: ${provider.base_url}`,
    `toolsets:`,
    `  - hermes-cli`,
    `agent:`,
    `  max_turns: 90`,
    `gateway:`,
    `  allow_all_users: true`,
    `telegram:`,
    `  allowed_users: all`,
  ].join('\n');
  fs.writeFileSync(path.join(profileDir, 'config.yaml'), configContent);

  // Write SOUL.md
  const soulContent = personality || getDefaultPersonality(template);
  fs.writeFileSync(path.join(profileDir, 'SOUL.md'), soulContent);

  // Start gateway
  const gatewayPid = startGateway(profileName);

  // Save agent record
  const agents = loadAgents();
  const agent = {
    id: agentId,
    name,
    template,
    profileName,
    botUsername,
    platform,
    modelProvider: modelProvider || 'mimo',
    model: provider.model,
    providerName: provider.name,
    status: 'online',
    createdAt: new Date().toISOString(),
    gatewayPid,
  };
  agents[agentId] = agent;
  saveAgents(agents);

  return agent;
}

function startGateway(profileName) {
  const logsDir = path.join(PROFILES_DIR, profileName, 'logs');
  fs.mkdirSync(logsDir, { recursive: true });

  const out = fs.openSync(path.join(logsDir, 'gateway.log'), 'a');
  const err = fs.openSync(path.join(logsDir, 'gateway-error.log'), 'a');

  const child = spawn(HERMES_BIN, [
    '--profile', profileName, 'gateway', 'run', '--replace'
  ], {
    detached: true,
    stdio: ['ignore', out, err],
    env: { ...process.env },
    cwd: path.join(process.env.HOME || '/home/ubuntu', '.hermes'),
  });

  child.unref();
  return child.pid;
}

function stopGateway(profileName) {
  try {
    execSync(`${HERMES_BIN} --profile ${profileName} gateway stop 2>&1`, { encoding: 'utf8', timeout: 15000 });
  } catch {
    try {
      const pids = execSync(`ps aux | grep "${profileName} gateway" | grep -v grep | awk '{print $2}'`, { encoding: 'utf8' });
      pids.trim().split('\n').filter(Boolean).forEach(pid => {
        try { process.kill(parseInt(pid), 'SIGKILL'); } catch {}
      });
    } catch {}
  }
}

async function getAgent(id) {
  const agents = loadAgents();
  return agents[id] || null;
}

async function listAgents() {
  return Object.values(loadAgents());
}

async function stopAgent(id) {
  const agents = loadAgents();
  const agent = agents[id];
  if (!agent) throw new Error('Agent not found');
  
  stopGateway(agent.profileName);
  agent.status = 'offline';
  agent.stoppedAt = new Date().toISOString();
  saveAgents(agents);
  return agent;
}

async function startAgent(id) {
  const agents = loadAgents();
  const agent = agents[id];
  if (!agent) throw new Error('Agent not found');
  
  const pid = startGateway(agent.profileName);
  agent.status = 'online';
  agent.gatewayPid = pid;
  agent.startedAt = new Date().toISOString();
  delete agent.stoppedAt;
  saveAgents(agents);
  return agent;
}

async function deleteAgent(id) {
  const agents = loadAgents();
  const agent = agents[id];
  if (!agent) throw new Error('Agent not found');
  
  stopGateway(agent.profileName);
  
  const profileDir = path.join(PROFILES_DIR, agent.profileName);
  try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  
  delete agents[id];
  saveAgents(agents);
}

function getDefaultPersonality(template) {
  const templates = {
    researcher: 'You are a sharp, concise researcher focused on crypto and AI. You speak directly, no fluff.',
    trader: 'You are a crypto trading assistant. You analyze markets, track trends, and provide actionable insights.',
    coder: 'You are an expert software developer. You write clean, efficient code and explain your reasoning clearly.',
    community: 'You are a friendly community manager. You engage users, answer questions, and maintain a positive atmosphere.',
    writer: 'You are a skilled content writer. You craft compelling narratives and adapt your tone to the audience.',
    custom: 'You are a helpful AI assistant.',
  };
  return templates[template] || templates.custom;
}

module.exports = {
  MODEL_PROVIDERS,
  getApiKeyForProvider,
  createAgent,
  getAgent,
  listAgents,
  stopAgent,
  startAgent,
  deleteAgent,
};
