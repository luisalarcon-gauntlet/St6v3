FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ARG VITE_DEV_MODE=false
ENV VITE_DEV_MODE=$VITE_DEV_MODE
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV PORT=5173
ENV API_URL=http://api:8080
ENV API_HOST=api
ENV NGINX_RESOLVER=8.8.8.8
EXPOSE 5173
CMD ["/bin/sh", "-c", "envsubst '${PORT} ${API_URL} ${API_HOST} ${NGINX_RESOLVER}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
