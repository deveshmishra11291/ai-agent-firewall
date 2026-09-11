"""Security analysis for Rust guest programs destined for the WASM sandbox."""

import re
from typing import Any


CAPABILITY_RISK = {
    "filesystem_read": 60,
    "filesystem_write": 80,
    "network": 60,
    "process_execution": 100,
    "dynamic_execution": 100,
    "unknown": 100,
}

PROMPT_PATTERNS = {
    "filesystem_read": [r"/etc/passwd", r"/etc/shadow", r"/etc/hosts", r"/proc/", r"/sys/", r"\bread\b.*\bfile\b", r"\bread\b.*\bfilesystem\b", r"\baccess\b.*\bfile\b", r"\blist\b.*\bdirector"],
    "filesystem_write": [r"\bwrite\b.*\bfile\b", r"\bmodify\b.*\bfile\b", r"\bcreate\b.*\bfile\b", r"\bdelete\b.*\bfile\b", r"\bremove\b.*\bfile\b"],
    "network": [r"\bconnect\b.*\bnetwork\b", r"\bconnect\b.*\binternet\b", r"\bnetwork\s+connection\b", r"\bsend\b.*\bover\s+the\s+network\b", r"\bdownload\b.*\bfrom\b", r"\bupload\b.*\bto\b", r"\brequest\b.*\bwebsite\b", r"\bhttps?://"],
    "process_execution": [r"\bexecute\b.*\bprocess\b", r"\bexecute\b.*\bcommand\b", r"\brun\b.*\bcommand\b", r"\brun\b.*\bshell\b", r"\bspawn\b.*\bprocess\b"],
    "dynamic_execution": [r"\beval\b", r"\bexec\b", r"\bdynamic(?:ally)?\b.*\bcode\b"],
}

RUST_IMPORTS = {
    "std::fs": "filesystem_read",
    "std::net": "network",
    "std::process": "process_execution",
    "std::env": "filesystem_read",
}

RUST_OPERATIONS = {
    "read_to_string": "filesystem_read",
    "File::open": "filesystem_read",
    "File::create": "filesystem_write",
    "remove_file": "filesystem_write",
    "remove_dir": "filesystem_write",
    "Command::new": "process_execution",
    "Command::output": "process_execution",
    "Command::spawn": "process_execution",
    "TcpStream::connect": "network",
    "UdpSocket::bind": "network",
    "TcpListener::bind": "network",
}


def analyze_prompt(prompt: str) -> dict[str, Any]:
    findings: list[str] = []
    capabilities: set[str] = set()
    prompt_lower = prompt.lower()
    for capability, patterns in PROMPT_PATTERNS.items():
        if any(re.search(pattern, prompt_lower, re.IGNORECASE) for pattern in patterns):
            capabilities.add(capability)
            findings.append(f"User request indicates {capability.replace('_', ' ')}")
    return {"findings": findings, "capabilities": sorted(capabilities)}


def analyze_code(code: str) -> dict[str, Any]:
    """Detect capability-relevant Rust operations before sandbox execution."""
    findings: list[str] = []
    capabilities: set[str] = set()
    if not code or not code.strip():
        return {"findings": findings, "capabilities": []}

    for import_name, capability in RUST_IMPORTS.items():
        if re.search(rf"\buse\s+{re.escape(import_name)}(?:\b|::)|{re.escape(import_name)}::", code):
            findings.append(f"Dangerous Rust import detected: {import_name}")
            capabilities.add(capability)
    for operation, capability in RUST_OPERATIONS.items():
        if operation in code:
            findings.append(f"Dangerous Rust operation detected: {operation}")
            capabilities.add(capability)
    if re.search(r"\bunsafe\b", code):
        findings.append("Unsafe Rust block detected")
        capabilities.add("dynamic_execution")
    return {"findings": findings, "capabilities": sorted(capabilities)}


def calculate_risk(capabilities: set[str]) -> int:
    return max((CAPABILITY_RISK.get(capability, 100) for capability in capabilities), default=0)


def analyze_request(prompt: str, code: str) -> dict[str, Any]:
    prompt_result = analyze_prompt(prompt)
    code_result = analyze_code(code)
    capabilities = set(prompt_result["capabilities"]) | set(code_result["capabilities"])
    risk_score = calculate_risk(capabilities)
    return {
        "safe": risk_score < 50 and "unknown" not in capabilities,
        "risk_score": risk_score,
        "findings": prompt_result["findings"] + code_result["findings"],
        "capabilities": sorted(capabilities),
    }
