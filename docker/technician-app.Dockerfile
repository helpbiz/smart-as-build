FROM node:20-alpine AS builder

WORKDIR /app

COPY mobile/technician-app/package*.json ./
RUN npm ci

COPY mobile/technician-app/ ./

ENV API_BASE_URL=https://foryouelec.co.kr/api/v1
RUN npm run web:build 2>/dev/null || npm run web-build 2>/dev/null || npm run build:web 2>/dev/null || npx expo export:web

FROM nginx:alpine

COPY --from=builder /app/web-build /usr/share/nginx/html
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
