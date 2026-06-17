FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_* are baked at build time. Railway exposes service vars as build args.
ARG VITE_HUB_KEY
ENV VITE_HUB_KEY=$VITE_HUB_KEY
RUN npm run build

FROM node:20-alpine AS run
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server.js ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
