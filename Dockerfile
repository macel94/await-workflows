FROM node:24-alpine
WORKDIR /github/workspace
COPY package.json index.js ./
RUN npm install
COPY . .
ENTRYPOINT ["node", "index.js"]
