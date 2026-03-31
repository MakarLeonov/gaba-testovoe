# Promocodes API (тестовое задание)

REST API для системы промокодов, реализованное с использованием NestJS (Fastify), Prisma, и PostgreSQL

---

## Необходимо для запуска:

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) + Docker Compose

---

## Разворачивание:

### 1. Склонировать этот репозиторий

### 2. Скопировать файл с окружением:

Я положил .env файл в репозиторий, потому что это тестовое задание - обычно я не храню файлы окружения в репах

```bash
cp .env.example .env
```

> Если порт `5432` уже используется машиной (например PostgreSQL уже запущен локально), нужно изменить порт в `docker-compose.yml` с `"5432:5432"` на `"5433:5432"` и обновить порт в `DATABASE_URL` в `.env`

### 3. Запустить PostgreSQL через Docker (если не запущен локально):

```bash
docker compose up postgres -d
```

### 4. Установить зависимости:

```bash
npm install
```

### 5. Сгенерировать Prisma client и запустить миграции:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Запустить сидер (опционально):

```bash
npm run db:seed
```

### 7. Запустить проект:

```bash
npm run start:dev
```

Приложение будет доступно на `http://localhost:3000`

---

## Окружение

1. `DATABASE_URL` - url для соединения Prisma
2. `PORT` - порт сервера

---

## Дизайн API:

### Fastify через Express

Я выбрал Fastify в качестве адаптера, потому что он обрабатывает больше запросов при меньших затратах памяти, что важно для ендпоинтов с высоким трафиком, таких как активация промо-кода

### Все проверки активации в рамках одной транзакции

Ручка активации выполняет четыре проверки:

1. Промокод существует
2. Срок действия валидный (не истек)
3. Лимит активаций ещё не исчерпан
4. Уникальное ограничение `[promocodeId, email]`

Используя транзакцию, я избегаю багов с race condition - т.е. два одновременных запроса не смогут одновременно активироваться, если остался только один слот

### Проверка уникальности на уровне фильтра, а не как 500

1. Основная провека - перед вставкой делается `SELECT COUNT(*)`, и если запись уже есть - сразу возвращается ошибка
2. Проверка на уровне БД - если два запроса пришли одновременно и оба прошли проверку (race condition), база данных сама не даст вставить дубликат и выбросит ошибку `P2002` (Prisma)
3. Ошибка перехватывается в глобальном фильтре HttpExceptionFilter, чтобы вместо 500 отдать 409

То есть основная проверка через COUNT и страховка через constraint в БД (но с изменённым кодом ошибки)

### Унифицированный формат ответа

Все ответы преобразуются в `{data, meta: { timestamp } }` с помощью глобального TransformInterceptor - в продакшене это упрощает работу клиента и других сервисов

### Название промокода в одном регистре

Перед сохранением, поле `code` преобразуется в верхний регистр при вводе (через `@Transform`) - то есть `test10`, `Test10` и `TEST10` ссылаются на один и тот же промокод - минус баг с регистром, а также унификация значений

### Глобавльный PrismaModule (`@Global`)

Регистрирую `PrismaService` единожды, использую где-угодно в проекте - просто хорошая практика

---

## Небольшое описание API:

### POST /promocodes - cоздание промокода

```bash
curl -X POST http://localhost:3000/promocodes \
  -H "Content-Type: application/json" \
  -d '{"code":"SUMMER30","discount":30,"limit":5,"expiresAt":"2027-12-31T23:59:59Z"}'
```

Ответ: `201`:

```json
{
  "data": {
    "id": "uuid",
    "code": "SUMMER30",
    "discount": 30,
    "limit": 5,
    "expiresAt": "2027-12-31T23:59:59.000Z",
    "createdAt": "2026-03-31T10:00:00.000Z"
  },
  "meta": { "timestamp": "2026-03-31T10:00:00.000Z" }
}
```

---

### GET /promocodes — получение всех промокодов

```bash
curl http://localhost:3000/promocodes
```

---

### GET /promocodes/:code — получение промокода по названию кода

```bash
curl http://localhost:3000/promocodes/SUMMER30
```

404 — not found:

```bash
curl http://localhost:3000/promocodes/NOSUCHCODE
```

---

### POST /promocodes/:code/activate — активация промокода через почту

```bash
curl -X POST http://localhost:3000/promocodes/SUMMER30/activate \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

1. Успешный запрос: `200`
2. Промокод не найден: `404`
3. Промокод просрочен: `410` | `Promocode has expired`
4. Превышение лимита: `409` | `Activation limit reached`
5. Повторное использование одинаковой почты: `409` | `Already activated by this email`

---

## Тестирование

### Postman

Создайте коллекцию в Postman и задайте переменную `baseUrl = http://localhost:3000`
Затем пройдитесь по сценариям (метод, url, )

1. POST `{{baseUrl}}/promocodes`, ожидаемый результат: `{"code":"TEST10","discount":10,"limit":3,"expiresAt":"2027-01-01T00:00:00Z"}`, 201
2. GET `{{baseUrl}}/promocodes`, ожидаемый результат: { data: массив с промокодами, meta: таймстемп }
3. GET `{{baseUrl}}/promocodes/TEST10`, ожидаемый результат: { data: объект с промокодом, meta: таймстемп }, 200
4. GET `{{baseUrl}}/promocodes/GHOST`, ожидаемый результат: 404
5. POST `{{baseUrl}}/promocodes/TEST10/activate`, ожидаемый результат: `{"email":"alice@example.com"}`, 200
6. POST `{{baseUrl}}/promocodes/TEST10/activate`, ожидаемый результат: `{"email":"alice@example.com"}`, 409 duplicate
7. POST `{{baseUrl}}/promocodes/FULL15/activate`, ожидаемый результат: `{"email":"anyone@example.com"}`, 409 limit
8. POST `{{baseUrl}}/promocodes/EXPIRED50/activate`, ожидаемый результат: `{"email":"anyone@example.com"}`, 410
9. POST `{{baseUrl}}/promocodes/GHOST/activate`, ожидаемый результат: `{"email":"x@x.com"}`, 404
10. POST `{{baseUrl}}/promocodes/TEST10/activate`, ожидаемый результат: `{"email":"not-an-email"}`, 400 validation
11. POST `{{baseUrl}}/promocodes`, ожидаемый результат: `{...,"extraField":"x"}`, 400 forbidden field

(Для теста нужно запустить сидер (`npm run db:seed`) или создать промокоты самостоятельно)

---

## Сидер

Чтобы создать промокоды для тестирования:

```bash
npm run db:seed
```

| Code        | Discount | Limit | Status                              |
| ----------- | -------- | ----- | ----------------------------------- |
| `SAVE20`    | 20%      | 10    | Active, 1 existing activation       |
| `EXPIRED50` | 50%      | 100   | Expired (7 days ago)                |
| `FULL15`    | 15%      | 2     | Active but limit reached (2/2 used) |
