FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .    

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/src ./src
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/scripts ./scripts

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:3001/health || exit 1

EXPOSE 3001

CMD [ "node", "src/server.js" ]
