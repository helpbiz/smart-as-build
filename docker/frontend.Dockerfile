FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/admin-web/package*.json ./
RUN npm ci

COPY frontend/admin-web/ ./

ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
