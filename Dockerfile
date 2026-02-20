FROM node:20-alpine

WORKDIR /app

# Copy everything first (includes pre-built frontend in backend/public)
COPY . .

# Install backend dependencies only (skip postinstall)
RUN npm install --ignore-scripts
RUN cd backend && npm install

# Expose port
EXPOSE 8080

# Start backend
WORKDIR /app/backend
CMD ["npm", "run", "start"]
