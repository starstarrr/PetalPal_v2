FROM node:24-alpine AS client-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client/ ./
RUN npm run build


FROM node:24-alpine

WORKDIR /app

COPY package*.json ./

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm install

COPY . .

COPY --from=client-builder /app/client/dist ./client/dist

EXPOSE 3000

CMD ["npm", "start"]