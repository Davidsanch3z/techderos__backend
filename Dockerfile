FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i --legacy-peer-deps --include=dev

COPY . .

ENV NODE_PATH=/app
