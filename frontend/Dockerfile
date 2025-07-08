# 1) build stage
FROM node:18-alpine as builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
# invoca la CLI local (usa el "production" por defecto si tu angular.json lo tiene así)
RUN npx ng build

# 2) production stage
FROM nginx:alpine
# elimina la conf por defecto
RUN rm /etc/nginx/conf.d/default.conf
# tu fichero con el route-all-to-index
COPY nginx.conf /etc/nginx/conf.d/

# copia **solo** el contenido de browser/** a la raíz web
COPY --from=builder /app/dist/frontend/browser/ /usr/share/nginx/html/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
