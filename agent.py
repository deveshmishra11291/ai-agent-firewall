#!/usr/bin/env python3
"""
High-Speed Autonomous Coding Agent (Powered by Groq • < 1 Second Latency)
Supervised live under the AI Agent Firewall Perimeter.
"""

import os
import sys
import time
import re
from pathlib import Path
from openai import OpenAI

# Load key dynamically from environment or backend/.env
env_file = Path(__file__).resolve().parent / "backend" / ".env"
groq_key = os.getenv("GROQ_API_KEY", "")
if not groq_key and env_file.exists():
    for line in env_file.read_text().splitlines():
        if "GROQ_API_KEY" in line and "=" in line:
            groq_key = line.split("=", 1)[1].strip().strip('"').strip("'")
            break

client = OpenAI(
    api_key=groq_key or "demo",
    base_url="https://api.groq.com/openai/v1",
)

def ask_agent_model(prompt: str) -> tuple[str, str]:
    resp = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an autonomous AI coding agent. "
                    "When given a task, return ONLY executable Python code. "
                    "On line 1, write: # FILENAME: <filename>.py\n"
                    "Then write the code directly without markdown code fences."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        max_tokens=350,
        temperature=0.2,
    )
    raw = resp.choices[0].message.content.strip()
    raw = re.sub(r"^```(?:python|bash|sh)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw).strip()

    lines = raw.split("\n")
    filename = "agent_solution.py"
    if lines and "FILENAME:" in lines[0].upper():
        filename = lines[0].split(":")[1].strip()
        code = "\n".join(lines[1:]).strip()
    else:
        code = raw
        if any(w in prompt.lower() for w in ["reverse", "socket", "backdoor", "dup2"]):
            filename = "backdoor.py"
        elif any(w in prompt.lower() for w in ["env", "secret", "token", "password"]):
            filename = "steal_secrets.py"
        else:
            filename = "clean_app.py"

    return filename, code

def main():
    print("\n\033[1;36m🤖 [AUTONOMOUS CODING AGENT — REAL-TIME HARNESS]\033[0m")
    print("\033[90mSupervised under AI Agent Firewall Perimeter (Groq Lightning Engine • ~0.7s Latency)\033[0m")
    print("\033[90mEnter any task for the agent (or type 'q' / 'exit' to finish):\033[0m\n")

    while True:
        try:
            prompt = input("\033[1;32m❯ Enter Agent Task: \033[0m").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting agent...")
            break

        if not prompt or prompt.lower() in ["exit", "quit", "q"]:
            print("\nExiting agent harness...")
            break

        print("\033[33m⚡ [Agent] Thinking and synthesizing tool calls...\033[0m")
        t0 = time.time()
        try:
            filename, code = ask_agent_model(prompt)
            elapsed = round(time.time() - t0, 2)
            print(f"\033[32m✍️  [Agent] Executing write_file: {filename} (Generated in {elapsed}s)\033[0m")

            # Write code to disk -> triggers AI Agent Firewall in < 2ms!
            with open(filename, "w") as f:
                f.write(code)

        except Exception as err:
            print(f"\033[31mError: {err}\033[0m")

        time.sleep(0.5)
        print()

if __name__ == "__main__":
    main()
