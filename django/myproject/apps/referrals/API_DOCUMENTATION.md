# Referrals API Documentation

Базовый URL: `/api/referrals/`

## Аутентификация
Все эндпоинты в этом модуле требуют аутентификации пользователя (`IsAuthenticated`). Необходимо передавать JWT токен в заголовке:
`Authorization: Bearer <USER_JWT_TOKEN>`

---

## Эндпоинты

### 1. Данные для реферального дашборда

-   **URL:** `/dashboard/`
-   **Method:** `GET`
-   **Permissions:** `IsAuthenticated`
-   **Description:**
    -   Возвращает агрегированные данные для реферального дашборда пользователя.
    -   Эндпоинт может возвращать как общую статистику по всем инструментам, так и статистику по конкретному инструменту, если в запросе передан GET-параметр `tool`.

-   **Query Parameters:**
    -   `tool` (string, optional): Ключ стратегии (`strategy_key`) для фильтрации данных. Например: `cross_arbitrage`, `spot_scalping`. Если параметр не указан, возвращается общая статистика.

-   **Примеры запросов:**
    -   `GET /api/referrals/dashboard/` - Получить общую статистику.
    -   `GET /api/referrals/dashboard/?tool=cross_arbitrage` - Получить статистику только для Cross Arbitrage.

-   **Response (200 OK):**
    ```json
    {
        "partners_total_count": 15, // Общее количество рефералов 1-й и 2-й линии
        "partners_level_1_count": 5,
        "partners_level_2_count": 10,
        "structure_volume": "5000.00", // Общая прибыль рефералов, от которой были начислены бонусы (с учетом фильтра по `tool`)
        "structure_income_usdt": "350.00", // Суммарный доход пользователя от реферальной программы (с учетом фильтра по `tool`)
        "structure_income_percent": "0.70", // Фиксированное значение
        "next_accrual_timestamp": "2025-08-01T12:00:00Z", // Расчетное время следующего начисления бонусов
        "investment_tools": [ // Список всех доступных инструментов (не зависит от фильтра `tool`)
            {
                "name": "Cross Arbitrage",
                "is_active": true
            },
            {
                "name": "Flexible Arbitrage",
                "is_active": true
            },
            {
                "name": "Spot Scalping",
                "is_active": false
            }
        ]
    }
    ```

-   **Error Responses:**
    -   `404 Not Found`: Если указан `tool`, но инструмента с таким `strategy_key` не существует.
        ```json
        {
            "error": "Investment tool with key 'invalid_tool' not found."
        }
        ```

</rewritten_file> 