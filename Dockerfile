FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PUBLIC_ROOT=/app/public

COPY nodejs/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY nodejs/ ./
COPY public/ ./public/

EXPOSE 3000

USER node

CMD ["node", "app.js"]
