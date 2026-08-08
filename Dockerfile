FROM node:20-alpine

WORKDIR /app

COPY nodejs/package*.json ./
RUN npm install --omit=dev

COPY nodejs/ ./
COPY css ./css
COPY js ./js
COPY images ./images
COPY fontawesome ./fontawesome

ENV STATIC_ROOT=/app
EXPOSE 3000

CMD ["node", "app.js"]
