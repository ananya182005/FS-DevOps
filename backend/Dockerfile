FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY src ./src
COPY db ./db
COPY scripts ./scripts
ENV NODE_ENV=production PORT=4000
EXPOSE 4000
# Initialize the schema on startup (idempotent), then serve the API.
CMD ["sh", "-c", "node scripts/initDb.js && node src/server.js"]
