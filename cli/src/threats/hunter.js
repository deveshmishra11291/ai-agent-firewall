/**
 * Threat Hunter Engine
 * Fast, zero-latency AST & regex pattern matcher for AI agent code generation.
 */

const { RULES } = require('./rules');

class ThreatHunter {
  constructor() {
    this.writeHistory = new Map(); // path -> Array<{ hash, time, content }>
  }

  /**
   * Scan code content against all firewall threat rules.
   * @param {string} code Source code string to inspect
   * @param {string} filePath Optional file path for context
   * @returns {object} Detailed threat report
   */
  scan(code, filePath = '') {
    if (!code || typeof code !== 'string') {
      return { safe: true, verdict: 'ALLOW', riskScore: 0, threats: [] };
    }

    const lines = code.split('\n');
    const detectedThreats = [];
    let maxRisk = 0;

    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        // First check whole file match
        if (pattern.test(code)) {
          // Find the exact line and snippet
          let matchedLine = 1;
          let matchedSnippet = '';

          for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
              matchedLine = i + 1;
              matchedSnippet = lines[i].trim();
              break;
            }
          }

          // If multiline regex matched across lines
          if (!matchedSnippet) {
            const match = code.match(pattern);
            matchedSnippet = match ? match[0].slice(0, 100) : lines[0] || '';
          }

          detectedThreats.push({
            id: rule.id,
            category: rule.category,
            title: rule.title,
            severity: rule.severity,
            riskScore: rule.riskScore,
            detail: rule.detail,
            action: rule.action,
            line: matchedLine,
            snippet: matchedSnippet,
          });

          if (rule.riskScore > maxRisk) {
            maxRisk = rule.riskScore;
          }

          // Move to next rule once one pattern matches
          break;
        }
      }
    }

    // Check for repetitive loops (agent spinning wheels)
    const loopDetected = this.detectLoop(filePath, code);
    if (loopDetected) {
      detectedThreats.push({
        id: 'LOOP-001',
        category: 'Agent Malfunction',
        title: `Repetitive Agent Loop (${loopDetected.count} identical writes)`,
        severity: 'MEDIUM',
        riskScore: 60,
        detail: `The AI agent is stuck in an infinite modification loop on ${filePath}.`,
        action: 'Throttle agent tool calls and prompt operator',
        line: 1,
        snippet: 'Identical repeated write pattern',
      });
      if (maxRisk < 60) maxRisk = 60;
    }

    let verdict = 'ALLOW';
    if (maxRisk >= 80) {
      verdict = 'BLOCKED';
    } else if (maxRisk >= 50) {
      verdict = 'WARN';
    }

    return {
      safe: verdict === 'ALLOW',
      verdict,
      riskScore: maxRisk,
      threats: detectedThreats,
      filePath,
      scannedAt: new Date().toISOString(),
    };
  }

  /**
   * Failproof-style detection for runaway recursive loops.
   */
  detectLoop(filePath, content) {
    if (!filePath) return null;
    const now = Date.now();
    const history = this.writeHistory.get(filePath) || [];

    // Keep history from the last 60 seconds
    const recent = history.filter((item) => now - item.time < 60000);
    const contentHash = this.simpleHash(content);

    recent.push({ hash: contentHash, time: now });
    this.writeHistory.set(filePath, recent);

    const identicalWrites = recent.filter((item) => item.hash === contentHash).length;
    if (identicalWrites >= 3) {
      return { count: identicalWrites };
    }
    return null;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

module.exports = {
  ThreatHunter,
};
