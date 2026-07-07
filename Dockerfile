FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]