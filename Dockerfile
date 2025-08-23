FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i --legacy-peer-deps

COPY . .

ENV NODE_PATH=/app
