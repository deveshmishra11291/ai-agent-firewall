/**
 * Real-Time Workspace Watcher & Agent Code Inspector
 */

const fs = require('fs');
const path = require('path');
const { ThreatHunter } = require('../threats/hunter');
const { logEvent, threatCard, summaryBox, statusLine, c } = require('../ui/terminal');

class WorkspaceInspector {
  constructor(options = {}) {
    this.cwd = options.cwd || process.cwd();
    this.config = options.config || {};
    this.hunter = new ThreatHunter();
    this.stats = {
      filesInspected: 0,
      allowed: 0,
      threatsBlocked: 0,
      loopsCaught: 0,
    };
    this.watcher = null;
    this.isWatching = false;
  }

  isIgnored(filePath) {
    const rel = path.relative(this.cwd, filePath);
    const ignoredSegments = ['node_modules', '.git', 'target', 'dist', 'build', '.venv', '__pycache__', '.firewall-quarantine'];
    return ignoredSegments.some((seg) => rel.includes(seg));
  }

  async inspectFile(fullPath, action = 'write') {
    if (this.isIgnored(fullPath)) return;
    if (!fs.existsSync(fullPath)) return;

    let stat;
    try {
      stat = fs.statSync(fullPath);
      if (stat.isDirectory()) return;
      if (stat.size > 2 * 1024 * 1024) return; // Skip files > 2MB
    } catch {
      return;
    }

    let content;
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      return;
    }

    const relPath = path.relative(this.cwd, fullPath);
    this.stats.filesInspected++;

    const result = this.hunter.scan(content, relPath);

    if (result.verdict === 'ALLOW') {
      this.stats.allowed++;
      logEvent('ALLOW', `agent wrote ${c.bold}${relPath}${c.reset}`, `Risk Score: ${result.riskScore}/100 • Clean`);
    } else if (result.verdict === 'WARN') {
      this.stats.allowed++;
      const threat = result.threats[0] || {};
      logEvent('WARNING', `agent modified ${c.bold}${relPath}${c.reset}`, `Risk: ${result.riskScore}/100 • ${threat.title || 'Review recommended'}`);
    } else {
      // BLOCKED!
      this.stats.threatsBlocked++;
      const topThreat = result.threats[0] || {
        title: 'Malicious Operation Detected',
        severity: 'CRITICAL',
        category: 'Policy Violation',
        detail: 'Risk score exceeded firewall threshold.',
      };

      if (topThreat.id === 'LOOP-001') {
        this.stats.loopsCaught++;
        logEvent('LOOP', `Agent loop detected on ${relPath}`, topThreat.detail);
      } else {
        threatCard(topThreat, relPath, topThreat.snippet, topThreat.line);
      }

      // Quarantine if configured
      if (this.config.quarantineBlocked) {
        this.quarantine(fullPath, relPath, topThreat);
      }
    }
  }

  quarantine(fullPath, relPath, threat) {
    try {
      const qDir = path.join(this.cwd, this.config.quarantineDir || '.firewall-quarantine');
      if (!fs.existsSync(qDir)) {
        fs.mkdirSync(qDir, { recursive: true });
      }

      const timestamp = Date.now();
      const backupName = `${path.basename(relPath)}.${timestamp}.quarantine`;
      const qPath = path.join(qDir, backupName);

      // Copy malicious file to quarantine vault
      fs.copyFileSync(fullPath, qPath);

      // Neutralize original file with security placeholder
      const warningText = `/*
 * [AI AGENT FIREWALL] - FILE QUARANTINED
 * ------------------------------------------------------------------
 * Threat Detected: ${threat.title} (${threat.severity})
 * Rule ID:         ${threat.id}
 * Time:            ${new Date().toISOString()}
 * 
 * The agent-generated code was intercepted and neutralized to protect
 * your host system. Original copy preserved in ${this.config.quarantineDir || '.firewall-quarantine'}/
 */\n`;

      fs.writeFileSync(fullPath, warningText, 'utf8');
      logEvent('QUARANTINE', `Neutralized malicious write to ${relPath}`, `Safely isolated to ${this.config.quarantineDir}/${backupName}`);
    } catch (err) {
      console.error(`[firewall] Quarantine failed:`, err.message);
    }
  }

  start() {
    statusLine('WATCH', this.cwd, this.config.mode === 'observe' ? 'OBSERVE ONLY' : 'ZERO-TRUST ENFORCING');
    this.isWatching = true;

    // Try using chokidar if available, else native fs.watch
    let chokidar;
    try {
      chokidar = require('chokidar');
    } catch {
      chokidar = null;
    }

    if (chokidar) {
      this.watcher = chokidar.watch(this.cwd, {
        ignored: this.config.ignoredPaths || [/(^|[\/\\])\../, 'node_modules', 'target', 'dist'],
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });

      this.watcher.on('add', (filePath) => this.inspectFile(filePath, 'create'));
      this.watcher.on('change', (filePath) => this.inspectFile(filePath, 'modify'));
    } else {
      // Native recursive fs.watch fallback
      let debounceTimer = null;
      this.watcher = fs.watch(this.cwd, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        const fullPath = path.join(this.cwd, filename);
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.inspectFile(fullPath, eventType);
        }, 150);
      });
    }

    process.on('SIGINT', () => {
      this.stop();
      process.exit(0);
    });
  }

  stop() {
    if (this.watcher) {
      if (typeof this.watcher.close === 'function') {
        this.watcher.close();
      }
    }
    this.isWatching = false;
    summaryBox(this.stats);
  }
}

module.exports = {
  WorkspaceInspector,
};
