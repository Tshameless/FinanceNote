FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json nest-cli.json ./
COPY src ./src
COPY migrations ./migrations
COPY create-tables-postgres.js migrate-postgres.js ./
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/create-tables-postgres.js /app/migrate-postgres.js ./
RUN mkdir -p /app/uploads/documents
EXPOSE 3000
CMD ["sh", "-c", "node create-tables-postgres.js && node migrate-postgres.js && node dist/main.js"]
