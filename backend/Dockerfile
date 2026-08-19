FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy prisma schema first to generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source files
COPY src ./src/

EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
