# Stage 1: Build React/Vite app
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build arguments for API URLs (Vite embeds them at build time)
ARG VITE_API_URL=http://localhost:8000
ARG VITE_HEALTH_API_URL=http://localhost:8001
ARG VITE_PRIORITY_API_URL=http://localhost:8002

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_HEALTH_API_URL=$VITE_HEALTH_API_URL
ENV VITE_PRIORITY_API_URL=$VITE_PRIORITY_API_URL

RUN npm run build

# Stage 2: Serve with lightweight Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
