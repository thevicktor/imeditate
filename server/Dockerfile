FROM node:22-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/src ./src
COPY server/public ./public
COPY server/scripts ./scripts
COPY content ./content
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "src/index.js"]
