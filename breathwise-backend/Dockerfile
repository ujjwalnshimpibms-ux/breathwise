FROM node:22-alpine

WORKDIR /app

# Copy only runtime files (zero third-party npm dependencies)
COPY package.json server.mjs ./
COPY lib ./lib

# Run as non-root user
RUN chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.mjs"]
