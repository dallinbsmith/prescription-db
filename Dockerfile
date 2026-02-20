FROM node:20-alpine

WORKDIR /app

# Copy package files and install backend dependencies only
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --omit=dev
RUN cd backend && npm install

# Copy source code (includes pre-built frontend in backend/public)
COPY . .

# Expose port
EXPOSE 8080

# Start backend
WORKDIR /app/backend
CMD ["npm", "run", "start"]
