FROM node:24-bookworm-slim AS ui

WORKDIR /ui
COPY grok_mvp/Ereditas/grok-workspace/package.json \
     grok_mvp/Ereditas/grok-workspace/package-lock.json ./
RUN npm ci
COPY grok_mvp/Ereditas/grok-workspace/ ./
RUN npm run build

FROM caddy:2-alpine AS caddy

FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    EREDITAS_HOST=0.0.0.0

WORKDIR /app

COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY --from=ui /usr/local/bin/node /usr/local/bin/node
COPY --from=ui /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

COPY pyproject.toml README.md LICENSE ./
COPY src/ ./src/
COPY apps/ ./apps/
RUN python -m venv .venv && .venv/bin/pip install --no-cache-dir -e .

COPY scripts/run-companion.sh ./scripts/run-companion.sh
COPY Caddyfile ./Caddyfile
COPY --from=ui /ui/ ./grok_mvp/Ereditas/grok-workspace/

EXPOSE 8080

CMD ["bash", "-c", "set -euo pipefail; ./scripts/run-companion.sh & api_pid=$!; (cd grok_mvp/Ereditas/grok-workspace && npm run preview) & ui_pid=$!; caddy run --config /app/Caddyfile --adapter caddyfile & proxy_pid=$!; trap 'kill $api_pid $ui_pid $proxy_pid 2>/dev/null || true' TERM INT EXIT; wait -n $api_pid $ui_pid $proxy_pid"]
