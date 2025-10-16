# Этап 1: Сборка приложения
# Используем официальный образ Node.js 18 на Alpine Linux как базовый для сборки
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json (или yarn.lock) для установки зависимостей
# Звездочка (*) позволяет скопировать оба файла, если они существуют
COPY package*.json ./

# Устанавливаем зависимости приложения, включая devDependencies, если они нужны для сборки
# `npm ci` используется для "чистой" установки на основе package-lock.json, что обеспечивает консистентность сборок
RUN npm ci

# Копируем все остальные файлы исходного кода в рабочую директорию
COPY . .

# (Опционально) Если у вас есть шаг сборки (например, TypeScript в JavaScript, сборка фронтенда)
# RUN npm run build

# Этап 2: Создание производственного образа
# Используем тот же легкий образ Node.js 18 на Alpine Linux
FROM node:18-alpine

# Создаем группу и пользователя приложения для запуска без root-прав (лучшая практика безопасности)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Устанавливаем рабочую директорию (должна совпадать с WORKDIR на этапе builder, если пути используются напрямую)
WORKDIR /usr/src/app

# Копируем только необходимые артефакты из этапа 'builder'
# 1. node_modules (только производственные зависимости, если `npm ci` правильно их отделил, 
#    либо все, если нет явного разделения production/development на этапе установки)
COPY --from=builder /usr/src/app/node_modules ./node_modules
# 2. Исходный код вашего приложения (папки services, utils, workers и т.д.)
COPY --from=builder /usr/src/app/services ./services
COPY --from=builder /usr/src/app/utils ./utils
COPY --from=builder /usr/src/app/workers ./workers
# 3. package.json и package-lock.json могут быть нужны для некоторых утилит или для справки
COPY --from=builder /usr/src/app/package*.json ./

# Устанавливаем curl, так как он используется в HEALTHCHECK
# --no-cache: не сохранять индекс пакетов, чтобы уменьшить размер образа
RUN apk add --no-cache curl

# Меняем владельца всех файлов в /usr/src/app на созданного пользователя и группу
RUN chown -R appuser:appgroup /usr/src/app

# Переключаемся на созданного пользователя для выполнения последующих команд
USER appuser

# HEALTHCHECK: Определяет, как Docker должен проверять состояние контейнера
# Проверяет эндпоинт /healthz API сервиса кошельков каждые 30 секунд
# --interval: интервал между проверками
# --timeout: максимальное время ожидания ответа
# --start-period: время, которое дается контейнеру на запуск перед первой проверкой
# --retries: количество попыток перед тем, как считать проверку неудачной
# CMD: команда для проверки. `curl -f` завершится с ошибкой, если HTTP статус не 2xx.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/healthz || exit 1

# Команда по умолчанию для запуска контейнера.
# Эта команда будет выполнена, если не указана другая в docker-compose.yml.
# В данном случае, по умолчанию запускается API сервис кошельков.
# Для воркеров (payout_worker, deposit_monitor) команда переопределяется в docker-compose.yml.
CMD ["node", "services/api.js"]
