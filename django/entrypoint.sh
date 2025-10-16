#!/bin/sh

# Выход при ошибке
set -e

# Проверяем, нужно ли выполнять миграции.
# Эту переменную нужно установить в 'true' только для одного сервиса,
# который будет отвечать за применение миграций.
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Applying database migrations..."
    python manage.py migrate --noinput
fi

# Запустить команду, переданную как аргументы этому скрипту (т.е. CMD из Dockerfile)
exec "$@"