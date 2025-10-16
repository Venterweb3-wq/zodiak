# Используем официальный образ Node.js
FROM node:18-slim

# Устанавливаем рабочую директорию
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Команда для запуска приложения
CMD [ "node", "index.js" ]
