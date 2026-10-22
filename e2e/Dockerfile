FROM node:24.21.0-bookworm-slim

WORKDIR /tests

COPY package.json package-lock.json ./
RUN npm ci

RUN npx playwright install --with-deps chromium

COPY . .

CMD ["npx", "playwright", "test"]
