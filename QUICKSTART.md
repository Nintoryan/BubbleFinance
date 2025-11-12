# Быстрый старт

## Локальная разработка

1. Установите зависимости:
   ```bash
   npm install
   ```

2. Создайте `.env` файл:
   ```env
   APP_PIN=123456
   DATABASE_URL="file:./data/dev.db"
   ```

3. Инициализируйте базу данных:
   ```bash
   npm run setup
   ```

4. Запустите dev-сервер:
   ```bash
   npm run dev
   ```

5. Откройте http://localhost:3000 и войдите с PIN `123456`

## Docker

1. Создайте `.env` файл:
   ```env
   APP_PIN=123456
   DATABASE_URL="file:./data/dev.db"
   ```

2. Запустите:
   ```bash
   docker-compose up --build
   ```

3. Откройте http://localhost и войдите с PIN `123456`

База данных будет храниться в `./data/dev.db`

