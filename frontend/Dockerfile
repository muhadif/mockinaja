# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Build for standalone mode
# We pass environment variables here if needed at build time
ENV NEXT_PRIVATE_STANDALONE true
RUN npm run build

# Final stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Copy required files for standalone mode
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Set backend URL for proxy (can be overridden at runtime)
ENV BACKEND_URL http://backend:8080

CMD ["node", "server.js"]
