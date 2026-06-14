const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STATS_FILE = path.join(__dirname, 'stats.json');

let stats = {
  totalAgents: 0,
  totalMessages: 0,
  lastUpdated: new Date().toISOString(),
};

// Load stats from file
try {
  if (fs.existsSync(STATS_FILE)) {
    stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  }
} catch (e) { /* ignore */ }

function saveStats() {
  stats.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
}

function incrementAgents() {
  stats.totalAgents++;
  saveStats();
}

function incrementMessages() {
  stats.totalMessages++;
  saveStats();
}

function countRunningGateways() {
  try {
    const out = execSync(
      `ps aux | grep "gateway run" | grep -v grep | grep -c "agent_" 2>/dev/null || echo 0`,
      { encoding: 'utf8' }
    );
    return parseInt(out.trim()) || 0;
  } catch { return 0; }
}

function getStats() {
  const agentsFile = path.join(__dirname, 'agents.json');
  let agents = {};
  try {
    if (fs.existsSync(agentsFile)) {
      agents = JSON.parse(fs.readFileSync(agentsFile, 'utf8'));
    }
  } catch {}

  const agentList = Object.values(agents);
  
  return {
    totalAgents: stats.totalAgents,
    onlineAgents: agentList.filter(a => a.status === 'online').length,
    totalMessages: stats.totalMessages,
    runningGateways: countRunningGateways(),
  };
}

module.exports = {
  getStats,
  incrementAgents,
  incrementMessages,
};
