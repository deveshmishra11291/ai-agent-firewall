/**
 * Security Threat Definitions & Heuristics for AI-Generated Code
 */

const RULES = [
  // 1. REVERSE SHELLS & REMOTE ACCESS (CRITICAL)
  {
    id: 'RCE-001',
    category: 'Reverse Shell',
    title: 'Interactive Reverse Shell Payload',
    severity: 'CRITICAL',
    riskScore: 100,
    action: 'Block execution and isolate workspace',
    patterns: [
      /\/dev\/tcp\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/i,
      /\/dev\/tcp\/[a-zA-Z0-9.-]+\/\d+/i,
      /\bnc\s+(-e|-c|\/bin\/(ba)?sh)\b/i,
      /\bmkfifo\s+\/tmp\/[a-zA-Z0-9_.-]+;\s*cat\s+\/tmp\//i,
      /socket\s*\.\s*socket.*connect\s*\(\s*\([^)]+\)\s*\).*os\s*\.\s*dup2/s,
      /\bpseudo-terminal\b.*\bpty\.spawn\b/i,
      /\bsocat\s+tcp-connect:/i,
    ],
    detail: 'Detected signature for an unauthorized outbound interactive reverse shell.',
  },

  // 2. REMOTE SCRIPT DOWNLOAD & PIPE TO SHELL (CRITICAL)
  {
    id: 'RCE-002',
    category: 'Remote Execution',
    title: 'Remote Script Piping to Shell (curl/wget | sh)',
    severity: 'CRITICAL',
    riskScore: 95,
    action: 'Block execution immediately',
    patterns: [
      /\b(curl|wget)\b[^\n|;&]+(\|\s*(ba)?sh|\|\s*python|\|\s*perl|\|\s*node)/i,
      /\bInvoke-WebRequest\b[^\n|;&]+\|\s*iex/i,
      /\bpowershell\b[^\n]+-enc(odedCommand)?\b/i,
    ],
    detail: 'Detected pattern downloading remote unverified code and executing it in a shell.',
  },

  // 3. CREDENTIAL THEFT & SENSITIVE PATH ACCESS (CRITICAL / HIGH)
  {
    id: 'CRED-001',
    category: 'Credential Exfiltration',
    title: 'Sensitive Credential File Access',
    severity: 'CRITICAL',
    riskScore: 90,
    action: 'Block filesystem access',
    patterns: [
      /(\/etc\/shadow|\/etc\/passwd|\/etc\/sudoers)/i,
      /(\.ssh\/id_rsa|\.ssh\/id_ed25519|\.ssh\/authorized_keys)/i,
      /(\.aws\/credentials|\.aws\/config)/i,
      /(\.config\/gcloud\/credentials|\.azure\/accessTokens\.json)/i,
      /(\.bash_history|\.zsh_history)/i,
    ],
    detail: 'Attempted to read system credentials, SSH keys, or cloud provider tokens.',
  },

  // 4. DESTRUCTIVE FILESYSTEM OPERATIONS (CRITICAL)
  {
    id: 'DEST-001',
    category: 'Destructive Action',
    title: 'Destructive Filesystem Deletion (rm -rf)',
    severity: 'CRITICAL',
    riskScore: 100,
    action: 'Terminated immediately',
    patterns: [
      /\brm\s+-(r|f|rf|fr)\s+(\/|~|\$HOME|\.\.|\*)/i,
      /\bshutil\.rmtree\s*\(\s*['"](\/|~|\.)['"]\s*\)/i,
      /\bfs\.rmSync\s*\(\s*['"](\/|~|\.)['"]\s*,\s*\{[^}]*recursive:\s*true/i,
      /:(){ :|:& };:/, // Fork bomb
    ],
    detail: 'Attempted catastrophic deletion of root, home, or parent directory structures.',
  },

  // 5. ENVIRONMENT & API SECRET HARVESTING (HIGH)
  {
    id: 'EXFIL-001',
    category: 'Data Exfiltration',
    title: 'Bulk Environment Secret Harvesting',
    severity: 'HIGH',
    riskScore: 85,
    action: 'Quarantine and block network payload',
    patterns: [
      /process\.env\s*&&.*fetch\s*\(/i,
      /os\.environ\s*&&.*requests\.(post|get)\s*\(/i,
      /(\.env|\.env\.production|\.env\.local).*curl\b/i,
      /curl\s+[^|\n]+-d\s+@(\.env|.*\.key|.*\.pem)/i,
    ],
    detail: 'Detected exfiltration of environment variables or .env files over outbound network.',
  },

  // 6. DANGEROUS DYNAMIC CODE EVALUATION (HIGH)
  {
    id: 'EVAL-001',
    category: 'Dynamic Execution',
    title: 'Arbitrary Code Evaluation (eval/exec/Function)',
    severity: 'HIGH',
    riskScore: 80,
    action: 'Flagged for security review',
    patterns: [
      /\beval\s*\(\s*(Buffer\.from|atob|base64\.b64decode|unescape)/i,
      /\bexec\s*\(\s*(base64\.b64decode|codecs\.decode)/i,
      /\bnew\s+Function\s*\(\s*['"][^'"]*['"]\s*,\s*(Buffer\.from|atob)/i,
    ],
    detail: 'Detected obfuscated dynamic evaluation (e.g., base64 decoding followed by eval/exec).',
  },

  // 7. PROMPT INJECTION & AGENT HIJACKING IN COMMENTS (HIGH)
  {
    id: 'INJECT-001',
    category: 'Prompt Injection',
    title: 'Agent Instruction Override / Backdoor',
    severity: 'HIGH',
    riskScore: 80,
    action: 'Alert agent operator and reject patch',
    patterns: [
      /\/\/\s*(ignore\s+all\s+(previous\s+)?instructions|system\s+prompt\s+override)/i,
      /#\s*(ignore\s+all\s+(previous\s+)?instructions|system\s+prompt\s+override)/i,
      /\/\*\s*(ignore\s+all\s+(previous\s+)?instructions|system\s+prompt\s+override)\s*\*\//i,
      /\b(you\s+are\s+now\s+in\s+unrestricted\s+mode|jailbreak\s+active)\b/i,
    ],
    detail: 'Detected jailbreak or prompt injection payload hidden inside code comments.',
  },

  // 8. DANGEROUS PROCESS EXECUTION IN SANDBOX (MEDIUM / HIGH)
  {
    id: 'PROC-001',
    category: 'Process Spawning',
    title: 'Unauthorized Process Execution',
    severity: 'MEDIUM',
    riskScore: 70,
    action: 'Require explicit user approval',
    patterns: [
      /\bstd::process::Command::new\s*\(/,
      /\bchild_process\.(exec|execSync|spawn|spawnSync)\s*\(/,
      /\bsubprocess\.(Popen|run|call|check_output)\s*\(/,
    ],
    detail: 'Spawning child processes bypasses WASI isolation and can execute arbitrary host binaries.',
  },
];

module.exports = {
  RULES,
};
