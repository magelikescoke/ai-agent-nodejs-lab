FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/ai-ticket-classifier/package.json apps/ai-ticket-classifier/package.json

RUN npm ci

FROM deps AS build

COPY . .

RUN npm run build --workspace apps/ai-ticket-classifier

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/ai-ticket-classifier/package.json apps/ai-ticket-classifier/package.json

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace", "apps/ai-ticket-classifier"]
