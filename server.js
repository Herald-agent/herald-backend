require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const rateLimit = require('@fastify/rate-limit');
const path = require('path');
const { promises: fs } = require('fs');
const fastifyStatic = require('@fastify/static');
const { createAgent, getAgent, listAgents, stopAgent, startAgent, deleteAgent } = require('./provisioner');
const { getStats, incrementAgents } = require('./stats');

// CORS
fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'DELETE'],
});

// Rate limiting
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 hour',
  keyGenerator: (request) => request.ip,
  skip: (request) => {
    return request.url === '/health' || 
           request.url === '/api/stats' ||
           request.method === 'OPTIONS' ||
           request.url === '/' ||
           request.url.startsWith('/index.html');
  },
});

// Static files
fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', uptime: process.uptime() };
});

// Stats
fastify.get('/api/stats', async () => {
  return getStats();
});

// List model providers
fastify.get('/api/providers', async () => {
  const { MODEL_PROVIDERS, getApiKeyForProvider } = require('./provisioner');
  return Object.entries(MODEL_PROVIDERS).map(([key, p]) => ({
    id: key,
    name: p.name,
    model: p.model,
    description: p.description,
    free: p.free,
    serverKeyAvailable: !!getApiKeyForProvider(key),
  }));
});

// === AGENT ENDPOINTS ===

// Create agent
fastify.post('/api/agents/create', async (request, reply) => {
  try {
    const { template, name, personality, telegramToken, platform, modelProvider, apiKey } = request.body;

    if (!template || !name || !telegramToken) {
      return reply.status(400).send({
        success: false,
        error: 'Missing required fields: template, name, telegramToken',
      });
    }

    // Validate Telegram token
    const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/getMe`);
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid Telegram bot token',
      });
    }

    const agent = await createAgent({
      template,
      name,
      personality,
      telegramToken,
      platform: platform || 'telegram',
      botUsername: tgData.result.username,
      modelProvider: modelProvider || 'mimo',
      userApiKey: apiKey,
    });

    incrementAgents();
    return { success: true, agent };
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
});

// Get agent
fastify.get('/api/agents/:id', async (request, reply) => {
  const agent = await getAgent(request.params.id);
  if (!agent) {
    return reply.status(404).send({ success: false, error: 'Agent not found' });
  }
  return { success: true, agent };
});

// List agents
fastify.get('/api/agents', async () => {
  return { success: true, agents: await listAgents() };
});

// Stop agent
fastify.post('/api/agents/:id/stop', async (request, reply) => {
  try {
    const agent = await stopAgent(request.params.id);
    return { success: true, agent };
  } catch (err) {
    return reply.status(404).send({ success: false, error: err.message });
  }
});

// Start agent
fastify.post('/api/agents/:id/start', async (request, reply) => {
  try {
    const agent = await startAgent(request.params.id);
    return { success: true, agent };
  } catch (err) {
    return reply.status(404).send({ success: false, error: err.message });
  }
});

// Delete agent
fastify.delete('/api/agents/:id', async (request, reply) => {
  try {
    await deleteAgent(request.params.id);
    return { success: true };
  } catch (err) {
    return reply.status(404).send({ success: false, error: err.message });
  }
});

// SPA fallback
fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api/')) {
    return reply.status(404).send({ success: false, error: 'Not found' });
  }
  return reply.type('text/html').sendFile('index.html');
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3001, host: '0.0.0.0' });
    console.log('Herald Agent API running on port ' + (process.env.PORT || 3001));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
