FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache postgresql-client

# Copy package files first for better caching
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Make scripts executable
RUN chmod +x entrypoint.sh tools/*.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "run", "start"]