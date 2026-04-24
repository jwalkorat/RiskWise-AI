# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install deps first (for layer caching)
COPY riskwise-ai/package*.json ./
RUN npm install

# Copy Next.js source
COPY riskwise-ai/ .

# Build the Next.js app (NEXT_PUBLIC_ vars are baked in at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# ── Stage 2: Runner ───────────────────────────────────────────────────────────
FROM node:20-slim AS runner

# Install Python 3 + pip for CatBoost ML model
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Install Python ML dependencies (match your training environment)
RUN pip3 install --break-system-packages --no-cache-dir \
    catboost \
    "scikit-learn==1.3.2" \
    joblib \
    pandas \
    numpy \
    Pillow \
    pymupdf \
    torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu

WORKDIR /app

# Copy built Next.js output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy the ML model folder (needed for child_process exec from riskEngine.ts)
COPY model/ ../model/

# Copy the Python scripts + best.pth PyTorch model into the container
COPY riskwise-ai/scripts/ ./scripts/

# Runtime environment variables (set as HF Space secrets)
ENV NODE_ENV=production
ENV PORT=7860
ENV HOSTNAME="0.0.0.0"

# HF Spaces requires port 7860
EXPOSE 7860

CMD ["node", "server.js"]
