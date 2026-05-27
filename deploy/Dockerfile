FROM node:24-alpine

WORKDIR /app

# 如果 npm registry 被墙，取消下面一行的注释：
# RUN echo "registry=https://registry.npmmirror.com" > /root/.npmrc

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src src/
COPY public public/
COPY config config/

RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "src/server.js"]
