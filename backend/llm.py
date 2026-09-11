import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# Force load .env from the backend folder, no matter where the script is run
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(env_path, override=True)

def get_env_value(name: str) -> str | None:
    value = os.getenv(name)
    return value.rstrip(";").strip() if value else None

def ask_ai(prompt: str):
    api_key = get_env_value("OPENAI_API_KEY") or get_env_value("GROQ_API_KEY")
    base_url = get_env_value("OPENAI_BASE_URL") or "https://api.groq.com/openai/v1"
    model = get_env_value("OPENAI_MODEL") or "llama-3.3-70b-versatile"

    if not api_key:
        raise RuntimeError("Set OPENAI_API_KEY or GROQ_API_KEY in backend/.env")

    client = OpenAI(api_key=api_key, base_url=base_url)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a code generation assistant for an AI Agent Firewall. Given the user's request, return ONLY valid JSON. The JSON must have exactly these fields: {'language': 'rust', 'code': 'the generated Rust code', 'explanation': 'short explanation of what the code does'}. Generate Rust code that directly addresses the user's request. Do not use markdown code fences. Do not add any text outside the JSON. The Rust code must be a complete program with a fn main() function."},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content
