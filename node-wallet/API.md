# Wallet API Documentation
<!-- Этот API предназначен для внутренних операций с кошельками и не предполагается для прямого вызова с клиентского фронтенда конечного пользователя. -->

## Endpoints

### Health Check
<!-- Используется для мониторинга состояния сервиса -->
```http
GET /healthz
```
Проверяет работоспособность сервиса.

**Response:**
```json
{
    "status": "ok"
}
```

### Generate Wallet
<!-- Может использоваться административной панелью или другими бэкенд-сервисами для создания кошельков. -->
```http
POST /generate_wallet
```
Генерирует новый криптовалютный кошелек для указанной сети.

**Headers:**
```
Authorization: Bearer <API_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
    "network": "ARBITRUM" | "TRC20"
}
```

**Response:**
```json
{
    "address": "string",
    "encryptedPrivateKey": "string",
    "network": "string"
}
```

**Error Responses:**
- `400 Bad Request` - Неверные входные данные
- `403 Forbidden` - Неверный или отсутствующий токен авторизации
- `429 Too Many Requests` - Превышен лимит запросов (10 в минуту)
- `500 Internal Server Error` - Внутренняя ошибка сервера

## Rate Limiting
API ограничен 10 запросами в минуту с одного IP-адреса.

## Security
- Все запросы должны быть авторизованы через Bearer token
- Приватные ключи шифруются перед сохранением
- Валидация всех входных данных 