FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Simple nginx config that proxies /api to the backend
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

