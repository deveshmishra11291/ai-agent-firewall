/**
 * Agent Harness Interceptor / Process Wrapper
 * Runs any coding agent inside an active firewall inspection perimeter.
 */

const { spawn } = require('child_process');
const { ThreatHunter } = require('../threats/hunter');
const { WorkspaceInspector } = require('../watcher/inspector');
const { logEvent, threatCard, banner, c } = require('../ui/terminal');

function runAgent(cmdArgs, config = {}) {
  banner();

  if (!cmdArgs || cmdArgs.length === 0) {
    console.error(`  ${c.red}Error: No agent command provided.${c.reset}`);
    console.log(`  Usage: ${c.bold}agent-firewall run <command>${c.reset}`);
    console.log(`  Example: ${c.dim}agent-firewall run claude${c.reset}`);
    console.log(`  Example: ${c.dim}agent-firewall run "python agent.py"${c.reset}`);
    process.exit(1);
  }

  const fullCmd = cmdArgs.join(' ');
  const hunter = new ThreatHunter();

  // 1. Preflight check on the agent execution command itself
  const cmdCheck = hunter.scan(fullCmd, 'command-line');
  if (cmdCheck.verdict === 'BLOCKED') {
    const threat = cmdCheck.threats[0] || {};
    threatCard(threat, 'terminal:exec', fullCmd, 1);
    console.error(`  ${c.brightRed}${c.bold}Execution Blocked by AI Agent Firewall.${c.reset}`);
    process.exit(1);
  }

  console.log(`  ${c.cyan}Starting Agent Harness under Firewall Perimeter:${c.reset}`);
  console.log(`  ${c.dim}$ ${fullCmd}${c.reset}\n`);

  // 2. Start real-time workspace watcher
  const inspector = new WorkspaceInspector({
    cwd: process.cwd(),
    config,
  });
  inspector.start();

  // 3. Spawn the child process
  const child = spawn(fullCmd, {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      AI_AGENT_FIREWALL: '1',
      FIREWALL_MODE: config.mode || 'enforce',
    },
  });

  child.on('error', (err) => {
    console.error(`  ${c.red}Failed to start agent:${c.reset} ${err.message}`);
    inspector.stop();
    process.exit(1);
  });

  child.on('close', (code) => {
    console.log(`\n  ${c.gray}Agent process exited with code ${code}.${c.reset}`);
    inspector.stop();
    process.exit(code || 0);
  });
}

module.exports = {
  runAgent,
};
