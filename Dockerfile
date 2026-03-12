FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY . .

RUN mkdir -p reports

EXPOSE 3000

USER node

CMD ["npm", "start"]
