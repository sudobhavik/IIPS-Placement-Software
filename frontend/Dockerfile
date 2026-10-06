# frontend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose Vite port
EXPOSE 5173

# Start dev server with host flag
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
