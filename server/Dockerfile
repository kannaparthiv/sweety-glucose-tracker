FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose server port
EXPOSE 5000

# Run migrations and start API server
CMD ["node", "src/server.js"]
