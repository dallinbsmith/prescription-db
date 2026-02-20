FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build -- --configuration=production

# Clean and copy frontend build to backend/public
RUN rm -rf backend/public/* && mkdir -p backend/public && cp -r frontend/dist/frontend/browser/* backend/public/

# Expose port
EXPOSE 8080

# Start backend (clean old static files first)
WORKDIR /app/backend
CMD ["sh", "-c", "rm -rf public/* && cp -r ../frontend/dist/frontend/browser/* public/ && npm run start"]
