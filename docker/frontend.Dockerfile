# ==============================================================================
# Dockerfile dùng chung cho 3 frontend React + Vite (ecommerce / admin / wms).
# Build ra file tĩnh rồi phục vụ bằng Nginx (có fallback cho React Router).
# ==============================================================================

# ---------- Giai đoạn 1: build ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Địa chỉ API Gateway mà TRÌNH DUYỆT gọi tới (ưu tiên hơn file .env của project)
ARG VITE_API_GATEWAY_URL=http://localhost:8080
ENV VITE_API_GATEWAY_URL=${VITE_API_GATEWAY_URL}
RUN npm run build

# ---------- Giai đoạn 2: phục vụ file tĩnh ----------
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
