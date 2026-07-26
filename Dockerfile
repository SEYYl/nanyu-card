FROM node:20-alpine

WORKDIR /app

COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm install --prefix frontend && npm install --prefix backend

COPY frontend ./frontend
COPY backend ./backend

RUN npm run build --prefix frontend && npm run build --prefix backend

EXPOSE 3000

CMD ["sh", "-c", "npm start --prefix backend"]
