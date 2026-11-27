# ILMSPACE CodeLab: Node 22 + g++ (санҷандаи маҳаллӣ)
FROM node:22-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends g++ util-linux \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN node scripts/build.js && mkdir -p /data
ENV NODE_ENV=production DB_FILE=/data/codelab.db JUDGE_DRIVER=local PORT=3000
EXPOSE 3000
CMD ["node", "server/index.js"]
