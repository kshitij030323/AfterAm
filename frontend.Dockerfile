# Build stage for Admin
FROM node:20-alpine AS admin-builder

WORKDIR /app/admin

# Copy admin package files
COPY admin/package*.json ./

# Install dependencies
RUN npm ci

# Copy admin source
COPY admin/ ./

# Build admin with API URL (relative since nginx proxies /api to backend)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Build stage for Scanner
FROM node:20-alpine AS scanner-builder

WORKDIR /app/scanner

# Copy scanner package files
COPY scanner/package*.json ./

# Install dependencies
RUN npm ci

# Copy scanner source
COPY scanner/ ./

# Build scanner with API URL (relative since nginx proxies /api to backend)
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built apps
COPY --from=admin-builder /app/admin/dist /usr/share/nginx/html/admin
COPY --from=scanner-builder /app/scanner/dist /usr/share/nginx/html/scanner

# Copy logo
COPY clubin-logo.png /usr/share/nginx/html/clubin-logo.png

# Create landing page
RUN echo '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Clubin</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff}.container{text-align:center;padding:2rem}.logo{width:250px;height:auto;margin-bottom:2.5rem}.links{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap}a{color:#fff;text-decoration:none;padding:1rem 2rem;border:2px solid #a855f7;border-radius:12px;font-weight:600;transition:all .3s}a:hover{background:#a855f7;transform:translateY(-2px)}</style></head><body><div class="container"><img src="/clubin-logo.png" alt="Clubin" class="logo"><div class="links"><a href="/admin/">Admin Panel</a><a href="/scanner/">Club Panel</a></div></div></body></html>' > /usr/share/nginx/html/index.html

# Expose port
EXPOSE 3004

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
