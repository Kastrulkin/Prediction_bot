# Инструкция по установке и запуску

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (опционально, для кэширования)
- npm или yarn

## Установка

### 1. Backend

```bash
cd backend
npm install

# Создайте .env файл (скопируйте из .env.example)
cp .env.example .env

# Настройте переменные окружения в .env:
# - DATABASE_URL
# - TON_RPC_URL
# - ADMIN_ADDRESS
# и другие

# Инициализируйте базу данных
npm run db:init

# Запустите сервер разработки
npm run dev
```

Backend будет доступен на `http://localhost:3001`

### 2. Frontend

```bash
cd frontend
npm install

# Запустите dev сервер
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

### 3. Smart Contract

```bash
cd smart-contract
npm install

# TODO: Настройка и деплой контракта
```

## Структура проекта

```
ton-prediction-bot/
├── backend/              # Node.js API сервер
│   ├── src/
│   │   ├── controllers/  # Контроллеры API
│   │   ├── services/     # Бизнес-логика
│   │   ├── models/       # Модели БД
│   │   ├── routes/       # Маршруты API
│   │   ├── db/           # Подключение к БД и миграции
│   │   └── middleware/   # Middleware (error handling, rate limiting)
│   └── package.json
│
├── frontend/             # React приложение
│   ├── src/
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Страницы
│   │   ├── store/        # Zustand store
│   │   └── utils/        # Утилиты
│   └── package.json
│
└── smart-contract/       # TON смарт-контракты
    └── (TODO)
```

## API Endpoints

### Events
- `GET /api/events` - Список событий
- `GET /api/events/:id` - Детали события
- `POST /api/events` - Создать событие
- `POST /api/events/:id/resolve` - Разрешить событие (admin)

### Bets
- `POST /api/bets` - Разместить ставку
- `GET /api/bets/user/:id` - Ставки пользователя

## Следующие шаги

1. ✅ Базовая структура проекта
2. ✅ Backend API (события, ставки)
3. ✅ Frontend (список событий, подключение кошелька)
4. ⏳ Smart Contract (MarketEscrow)
5. ⏳ Интеграция с TON блокчейном
6. ⏳ Форма ставки (BetForm)
7. ⏳ Страница события (EventPage)
8. ⏳ Telegram бот

## Проблемы и решения

Если возникают проблемы:

1. **Ошибка подключения к БД**: Проверьте `DATABASE_URL` в `.env`
2. **Ошибка портов**: Убедитесь, что порты 3000 и 3001 свободны
3. **Ошибки TypeScript**: Запустите `npm install` в соответствующей папке

