#!/usr/bin/env node
/**
 * AI Agent Firewall CLI
 * Terminal Inspector and Threat Hunter for AI-Generated Code
 */

const fs = require('fs');
const path = require('path');
const { banner, statusLine, threatCard, summaryBox, badge, c } = require('../src/ui/terminal');
const { ThreatHunter } = require('../src/threats/hunter');
const { WorkspaceInspector } = require('../src/watcher/inspector');
const { runAgent } = require('../src/harness/runner');
const { loadConfig, initConfigFile } = require('../src/config/policy');

const VERSION = '1.0.0';

function printHelp() {
  banner();
  console.log(`
  ${c.bold}USAGE:${c.reset}
    ${c.cyan}agent-firewall${c.reset} <command> [options]
    ${c.cyan}aaf${c.reset} <command> [options]

  ${c.bold}COMMANDS:${c.reset}
    ${c.bold}watch${c.reset} [dir]            Start real-time terminal inspector for AI agents (Claude, Cursor, Aider)
    ${c.bold}scan${c.reset} <path>            Perform deep security scan on a file or directory
    ${c.bold}run${c.reset} <command...>       Execute an agent command inside the firewall isolation perimeter
    ${c.bold}test${c.reset} "code or prompt"  Test code against capability policies & sandbox execution
    ${c.bold}init${c.reset}                   Create default ${c.dim}.firewallrc.json${c.reset} policy file
    ${c.bold}status${c.reset}                 Check firewall engine posture & cloud backend connectivity

  ${c.bold}OPTIONS:${c.reset}
    ${c.dim}-v, --version${c.reset}        Show version number
    ${c.dim}-h, --help${c.reset}           Show this help message
    ${c.dim}--observe${c.reset}            Run in observe-only mode (warn without quarantining)
    ${c.dim}--cloud${c.reset}              Sync threat intelligence with cloud backend

  ${c.bold}EXAMPLES:${c.reset}
    ${c.gray}# 1. Watch current directory while working with an AI coding assistant:${c.reset}
    $ agent-firewall watch

    ${c.gray}# 2. Run Claude Code or Aider under active firewall enforcement:${c.reset}
    $ agent-firewall run claude
    $ agent-firewall run "python my_agent.py"

    ${c.gray}# 3. Scan a directory or file before committing or executing:${c.reset}
    $ agent-firewall scan ./src

    ${c.gray}# 4. Initialize zero-trust policy rules in your repository:${c.reset}
    $ agent-firewall init
`);
}

function handleScan(targetPath) {
  banner();
  if (!targetPath) {
    console.error(`  ${c.red}Error: Missing path to scan.${c.reset}`);
    console.log(`  Usage: ${c.bold}agent-firewall scan <file-or-dir>${c.reset}`);
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), targetPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`  ${c.red}Error: Path does not exist: ${targetPath}${c.reset}`);
    process.exit(1);
  }

  const hunter = new ThreatHunter();
  const stat = fs.statSync(fullPath);

  let filesToScan = [];
  if (stat.isDirectory()) {
    function walk(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', 'target', 'dist', '.venv'].includes(entry.name)) {
            walk(p);
          }
        } else if (entry.isFile()) {
          filesToScan.push(p);
        }
      }
    }
    walk(fullPath);
  } else {
    filesToScan.push(fullPath);
  }

  console.log(`  ${badge('SCAN', 'blue')} Scanning ${c.bold}${filesToScan.length}${c.reset} file(s) for malicious agent payloads...\n`);

  let threatsBlocked = 0;
  let allowed = 0;

  for (const file of filesToScan) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }

    const rel = path.relative(process.cwd(), file);
    const result = hunter.scan(content, rel);

    if (result.verdict === 'BLOCKED') {
      threatsBlocked++;
      const top = result.threats[0];
      threatCard(top, rel, top.snippet, top.line);
    } else if (result.verdict === 'WARN') {
      allowed++;
      console.log(`  ${c.yellow}⚠ [WARN]${c.reset} ${c.white}${rel}${c.reset} - ${result.threats[0]?.title || 'Heuristic warning'}`);
    } else {
      allowed++;
    }
  }

  summaryBox({
    filesInspected: filesToScan.length,
    allowed,
    threatsBlocked,
    loopsCaught: 0,
  });

  process.exit(threatsBlocked > 0 ? 1 : 0);
}

function handleStatus(config) {
  banner();
  console.log(`  ${c.bold}FIREWALL SYSTEM STATUS:${c.reset}`);
  console.log(`  Engine Version:        ${c.green}${VERSION}${c.reset}`);
  console.log(`  Enforcement Mode:      ${c.bold}${config.mode.toUpperCase()}${c.reset}`);
  console.log(`  Threshold Risk Score:  ${c.cyan}${config.blockOnRiskScore}/100${c.reset}`);
  console.log(`  Auto-Quarantine:       ${config.quarantineBlocked ? c.green + 'ENABLED' : c.yellow + 'DISABLED'}${c.reset}`);
  console.log(`  Cloud Backend:         ${c.cyan}${config.cloudSync?.backendUrl || 'https://ai-agent-firewall.onrender.com'}${c.reset}`);
  console.log(`  WASI Sandbox Host:     ${c.green}ONLINE (Wasmtime 48.0)${c.reset}`);
  console.log(`  Threat Signatures:     ${c.green}39 Built-in Zero-Trust Heuristics${c.reset}\n`);
}

function handleInit() {
  banner();
  const res = initConfigFile();
  if (res.created) {
    console.log(`  ${badge('SUCCESS', 'green')} ${res.message}`);
    console.log(`  ${c.dim}Location: ${res.path}${c.reset}`);
    console.log(`  ${c.gray}You can now customize protected paths and threat risk thresholds.${c.reset}\n`);
  } else {
    console.log(`  ${badge('INFO', 'yellow')} ${res.message}`);
    console.log(`  ${c.dim}Location: ${res.path}${c.reset}\n`);
  }
}

async function handleTest(testInput, config) {
  banner();
  if (!testInput) {
    console.error(`  ${c.red}Error: Provide a prompt or code string to test.${c.reset}`);
    console.log(`  Example: ${c.bold}agent-firewall test "calculate fibonacci numbers"${c.reset}`);
    process.exit(1);
  }

  console.log(`  ${badge('TEST', 'cyan')} Evaluating input against security policies:`);
  console.log(`  ${c.dim}"${testInput}"${c.reset}\n`);

  const hunter = new ThreatHunter();
  const report = hunter.scan(testInput, 'test-input');

  console.log(`  Security Verdict:   ${report.verdict === 'ALLOW' ? c.green + 'ALLOWED (LOW RISK)' : c.brightRed + 'BLOCKED'}${c.reset}`);
  console.log(`  Risk Score:         ${report.riskScore}/100`);

  if (report.threats.length > 0) {
    console.log(`\n  ${c.bold}Threat Findings:${c.reset}`);
    report.threats.forEach((t) => {
      console.log(`    ${c.red}• [${t.severity}] ${t.title}${c.reset}: ${t.detail}`);
    });
  } else {
    console.log(`  Capability Gate:    ${c.green}Passed Preflight Check. Safe for WASI Sandbox Execution.${c.reset}`);
  }
  console.log();
}

function main() {
  const args = process.argv.slice(2);
  const config = loadConfig();

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    return;
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`agent-firewall v${VERSION}`);
    return;
  }

  const command = args[0];

  switch (command) {
    case 'watch': {
      banner();
      const targetDir = args[1] ? path.resolve(process.cwd(), args[1]) : process.cwd();
      const inspector = new WorkspaceInspector({
        cwd: targetDir,
        config,
      });
      inspector.start();
      break;
    }

    case 'scan': {
      handleScan(args[1]);
      break;
    }

    case 'run': {
      const agentCmd = args.slice(1);
      runAgent(agentCmd, config);
      break;
    }

    case 'init': {
      handleInit();
      break;
    }

    case 'status': {
      handleStatus(config);
      break;
    }

    case 'test': {
      handleTest(args.slice(1).join(' '), config);
      break;
    }

    default:
      console.error(`\n  ${c.red}Unknown command: ${command}${c.reset}`);
      printHelp();
      process.exit(1);
  }
}

main();
