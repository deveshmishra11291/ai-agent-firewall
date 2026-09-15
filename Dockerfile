# syntax=docker/dockerfile:1
FROM python:3.11-slim-bookworm

# 1. Install system dependencies required for Rust compilation and network requests
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Rust toolchain & WASI target
ENV RUSTUP_HOME=/usr/local/rustup \
    CARGO_HOME=/usr/local/cargo \
    PATH=/usr/local/cargo/bin:$PATH

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal \
    && rustup target add wasm32-wasip1 \
    && chmod -R a+w /usr/local/cargo

WORKDIR /app

# 3. Build the Wasmtime Sandbox Host binary
COPY sandbox-host/Cargo.toml sandbox-host/Cargo.lock ./sandbox-host/
COPY sandbox-host/src ./sandbox-host/src
RUN cd /app/sandbox-host && cargo build --release

# 4. Install Python Backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# 5. Copy backend application source
COPY backend/ ./backend/

# 6. Environment configuration
ENV PYTHONUNBUFFERED=1 \
    SANDBOX_HOST_PATH=/app/sandbox-host/target/release/sandbox-host \
    PORT=8000

WORKDIR /app/backend

EXPOSE 8000

# 7. Start FastAPI server with dynamic port binding for Render/Koyeb/Railway/HF
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
