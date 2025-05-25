FROM node:24-alpine
WORKDIR /app
COPY package.json index.js ./
RUN npm install
COPY . .
ENTRYPOINT ["node", "/app/index.js"]
