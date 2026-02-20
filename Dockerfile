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
CMD ["sh", "-c", "echo '=== Debug: Files in public before ===' && ls -la public/ 2>/dev/null || echo 'public dir empty/missing' && echo '=== Debug: Files in frontend dist ===' && ls ../frontend/dist/frontend/browser/*.js 2>/dev/null | head -5 || echo 'No frontend dist' && echo '=== Cleaning and copying ===' && rm -rf public/* && cp -r ../frontend/dist/frontend/browser/* public/ && echo '=== Files in public after ===' && ls public/*.js | head -5 && npm run start"]
