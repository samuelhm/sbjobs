FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

RUN apk add --no-cache postgresql-client

COPY tools/entrypoint.sh /app/tools/entrypoint.sh
COPY tools/run-migrations.sh /app/tools/run-migrations.sh
RUN chmod 755 /app/tools/entrypoint.sh /app/tools/run-migrations.sh

ENTRYPOINT ["/app/tools/entrypoint.sh"]

FROM base AS dev

ENV NODE_ENV=development

COPY src /app/src
COPY tools /app/tools
RUN chmod 755 /app/tools/entrypoint.sh /app/tools/run-migrations.sh

CMD ["node", "--watch", "src/server.js"]

FROM base AS production

ENV NODE_ENV=production

COPY src /app/src
COPY tools /app/tools
RUN chmod 755 /app/tools/entrypoint.sh /app/tools/run-migrations.sh

CMD ["node", "src/server.js"]
