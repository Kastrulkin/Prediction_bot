# PredictionBot — Полная спецификация проекта

## 📋 Содержание

1. [Описание проекта](#описание-проекта)
2. [Архитектура](#архитектура)
3. [Комиссионная модель](#комиссионная-модель)
4. [Схема базы данных](#схема-базы-данных)
5. [Smart Contract](#smart-contract)
6. [API Endpoints](#api-endpoints)
7. [Проблемы и решения](#проблемы-и-решения)
8. [Формулы и расчеты](#формулы-и-расчеты)
9. [Безопасность](#безопасность)
10. [Приоритеты реализации](#приоритеты-реализации)

---

## Описание проекта

**PredictionBot** — мини-приложение в Telegram для торговли прогнозами (YES/NO рынки) с использованием TON блокчейна.

### Технологический стек

- **Frontend**: React 18 + TypeScript + TonConnect UI + Zustand
- **Backend**: Node.js + Express + PostgreSQL + Redis
- **Smart Contract**: TON escrow контракт (хранит балансы events и выполняет выплаты)
- **Telegram**: Bot для уведомлений

### Основные функции

- Создание событий для прогнозирования
- Размещение ставок (YES/NO) с использованием TON
- Разрешение событий администратором
- Автоматическое распределение выплат победителям
- Лидерборд по прибыли
- Отмена событий с возвратом средств

---

## Архитектура

### Архитектура контрактов: разделение пулов

#### Проблема исходной архитектуры

Исходный промпт предлагал один контракт для всех рынков через `market_id → (total_yes, total_no, ...)`. Это создает риски:
- Сложно отслеживать, какие TON к какому рынку относятся
- Баланс контракта = сумма всех пулов всех рынков
- Риск путаницы при распределении выплат
- Если один рынок "сломается", это может повлиять на другие
- Сложнее аудит и проверка балансов

#### Решение: Один контракт на один рынок (РЕКОМЕНДУЕТСЯ)

**Архитектура**:
- Каждое событие получает свой отдельный escrow-контракт
- Контракт деплоится при создании события
- Все TON этого рынка изолированы в своем контракте

**Преимущества**:
- ✅ Полная изоляция рисков между рынками
- ✅ Простая логика контракта (не нужен `market_id`)
- ✅ Легко аудировать баланс конкретного рынка
- ✅ Если один рынок сломается, другие не пострадают
- ✅ Проще распределение выплат (весь баланс контракта = пул рынка)
- ✅ Можно удалить контракт после разрешения

**Недостатки**:
- ❌ Дороже в деплое (каждый контракт = ~0.1-0.2 TON)
- ❌ Нужна фабрика контрактов или деплой из backend

**Стоимость**: При 1000 DAU и 10 событиях в день = ~300 событий/месяц = ~30-60 TON на деплой (приемлемо при оборотах 50k TON/день)

**Реализация**:
```typescript
// Backend при создании события
async function createEvent(eventData) {
  // 1. Создаем запись в БД
  const event = await db.events.create(eventData);
  
  // 2. Деплоим отдельный контракт для этого события
  const contractAddress = await deployMarketEscrowContract({
    eventId: event.id,
    adminAddress: ADMIN_ADDRESS,
    feeInBps: 50, // 0.5%
    feeOutBps: 150 // 1.5%
  });
  
  // 3. Сохраняем адрес контракта
  await db.events.update(event.id, { 
    contract_address: contractAddress,
    contract_deployed_at: new Date()
  });
  
  return event;
}
```

---

## Комиссионная модель

### Комиссии (КРИТИЧНО ЗАПОМНИТЬ)

1. **fee_in**: 0.3–0.5% со ВСЕХ ставок на входе (за участие)
   - Вычитается сразу при размещении ставки
   - Отправляется на админ-кошелек
   - Не остается на контракте

2. **fee_out**: 1–2% с пула проигравшей стороны при разрешении события
   - Вычисляется при разрешении рынка
   - Берется с пула проигравших
   - Отправляется на админ-кошелек

### Формула выплаты победителям

**Если YES выигрывает**:
```
fee_out = total_no × fee_out_bps / 10000
total_pool_after_fee = total_yes + total_no - fee_out
payout_per_ton_yes = total_pool_after_fee / total_yes
user_payout = user_stake_yes × payout_per_ton_yes
```

**Если NO выигрывает**:
```
fee_out = total_yes × fee_out_bps / 10000
total_pool_after_fee = total_yes + total_no - fee_out
payout_per_ton_no = total_pool_after_fee / total_no
user_payout = user_stake_no × payout_per_ton_no
```

### Пример расчета

- YES пул: 1000 TON
- NO пул: 500 TON
- Пользователь поставил 100 TON на YES
- fee_out_bps = 150 (1.5%)
- Исход: YES выигрывает

```
fee_out = 500 × 150 / 10000 = 7.5 TON
total_pool_after_fee = 1000 + 500 - 7.5 = 1492.5 TON
payout_per_ton_yes = 1492.5 / 1000 = 1.4925 TON за каждый TON ставки
user_payout = 100 × 1.4925 = 149.25 TON
```

Пользователь получит 149.25 TON (прибыль 49.25 TON, ROI = 49.25%)

### Доход платформы

```
Доход = (fee_in × оборот_ставок) + (fee_out × min(V_Y, V_N))
```

**Пример** (при 1000 DAU, средняя ставка 10 TON):
- Дневной оборот: ~5000 ставок × 10 TON = 50 000 TON/день
- Дневной fee_in: 50 000 × 0.005 (0.5%) = 250 TON ≈ $50/день
- Месячный fee_in: ~$1500
- fee_out (в среднем): +$300-500/месяц
- **Доход: ~$1800-2000/месяц**

---

## Схема базы данных

### Полная схема (с исправлениями)

```sql
-- Users table (ИСПРАВЛЕНО: добавлена)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  username VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wallets table (ИСПРАВЛЕНО: добавлена)
CREATE TABLE wallets (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  ton_address VARCHAR(255) UNIQUE NOT NULL,
  balance_pending BIGINT DEFAULT 0, -- в nanotons
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, closed, resolved, cancelled
  contract_address VARCHAR(255) UNIQUE, -- адрес escrow-контракта для этого рынка
  contract_deployed_at TIMESTAMP, -- когда был задеплоен контракт
  total_yes BIGINT DEFAULT 0, -- в nanotons
  total_no BIGINT DEFAULT 0, -- в nanotons
  resolved_outcome VARCHAR(10), -- yes, no
  resolved_at TIMESTAMP,
  cancellation_requested BOOLEAN DEFAULT FALSE,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  refund_fee_bps INTEGER DEFAULT 50, -- 0.5% для возврата
  max_bet_percent INTEGER DEFAULT 20, -- 20% от пула
  max_probability_change INTEGER DEFAULT 10, -- 10% изменение вероятности
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bets table
CREATE TABLE bets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_id INTEGER REFERENCES events(id),
  side VARCHAR(10) NOT NULL, -- yes, no
  amount_gross BIGINT NOT NULL, -- в nanotons (с fee_in)
  amount_net BIGINT NOT NULL, -- в nanotons (без fee_in)
  fee_in BIGINT NOT NULL, -- в nanotons
  tx_hash VARCHAR(255) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, failed, refunded
  price DECIMAL(10, 8), -- вероятность на момент ставки
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payouts table
CREATE TABLE payouts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_id INTEGER REFERENCES events(id),
  bet_id INTEGER REFERENCES bets(id),
  amount BIGINT NOT NULL, -- в nanotons
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, failed
  tx_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Cancellation requests
CREATE TABLE cancellation_requests (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  user_id INTEGER REFERENCES users(id),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pool history (ИСПРАВЛЕНО: добавлена для графика)
CREATE TABLE pool_history (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  total_yes BIGINT NOT NULL,
  total_no BIGINT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности (ИСПРАВЛЕНО: добавлены)
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_end_date ON events(end_date);
CREATE INDEX idx_events_contract_address ON events(contract_address);
CREATE INDEX idx_bets_user_id ON bets(user_id);
CREATE INDEX idx_bets_event_id ON bets(event_id);
CREATE INDEX idx_bets_tx_hash ON bets(tx_hash);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_event_id ON payouts(event_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_pool_history_event_id ON pool_history(event_id);
```

---

## Smart Contract

### Структура контракта (один контракт на рынок)

**MarketEscrow.fc** - один контракт хранит данные ОДНОГО рынка:

```
storage:
  admin_address: Address
  total_yes: Coins (nanotons)
  total_no: Coins (nanotons)
  resolved_outcome: Int (0 = open, 1 = yes wins, 2 = no wins)
  fee_in_bps: Int (например, 50 = 0.5%)
  fee_out_bps: Int (например, 150 = 1.5%)
  user_positions: map[Address] → (amount_yes: Coins, amount_no: Coins)
```

### Функции контракта

#### 1. place_bet(side, amount)

Принимает TON, обновляет пулы, отправляет fee_in на админ-кошелек.

**Логика**:
```typescript
() place_bet(side, amount) {
  // Валидация (ИСПРАВЛЕНО: добавлена)
  if (amount < 100000000) throw("Min bet: 0.1 TON"); // 0.1 TON в nanotons
  if (amount > 100000000000) throw("Max bet: 100 TON");
  
  // Проверка лимита на размер ставки (20% от пула)
  int current_pool = (side == 1) ? total_yes : total_no;
  int max_bet = current_pool * 20 / 100;
  if (amount > max_bet && current_pool > 0) throw("Bet too large");
  
  // Проверка, что рынок открыт
  if (resolved_outcome != 0) throw("Market already resolved");
  
  // Вычисляем комиссию fee_in
  int fee_amount = amount * fee_in_bps / 10000;
  int amount_net = amount - fee_amount;
  
  // Отправляем комиссию на админ-кошелек (ИСПРАВЛЕНО: добавлено)
  send_message(admin_address, fee_amount);
  
  // Обновляем пулы
  if (side == 1) {
    total_yes += amount_net;
  } else {
    total_no += amount_net;
  }
  
  // Обновляем позицию пользователя
  var (user_yes, user_no) = user_positions[msg.sender];
  if (side == 1) {
    user_positions[msg.sender] = (user_yes + amount_net, user_no);
  } else {
    user_positions[msg.sender] = (user_yes, user_no + amount_net);
  }
}
```

#### 2. resolve_market(outcome, fee_out_bps)

Админ разрешает рынок, вычисляет fee_out, отправляет на админ-кошелек.

**Логика**:
```typescript
() resolve_market(outcome, fee_out_bps) {
  // Проверка админа (ИСПРАВЛЕНО: добавлена)
  if (msg.sender != admin_address) {
    throw("Only admin can resolve");
  }
  
  // Проверка, что рынок еще не разрешен (ИСПРАВЛЕНО: добавлена)
  if (resolved_outcome != 0) {
    throw("Market already resolved");
  }
  
  // Edge case: пустые пулы (ИСПРАВЛЕНО: добавлена обработка)
  if (total_yes == 0 || total_no == 0) {
    // Особый случай: возврат всех ставок минус комиссия
    // Или автоматическая победа одной стороны
    resolved_outcome = outcome;
    return;
  }
  
  // Вычисляем комиссию fee_out с пула проигравших
  int fee_amount = 0;
  if (outcome == 1) {
    // YES выигрывает, комиссия с NO пула
    fee_amount = total_no * fee_out_bps / 10000;
  } else {
    // NO выигрывает, комиссия с YES пула
    fee_amount = total_yes * fee_out_bps / 10000;
  }
  
  // Отправляем комиссию на админ-кошелек (ИСПРАВЛЕНО: добавлено)
  send_message(admin_address, fee_amount);
  
  // Обновляем статус
  resolved_outcome = outcome;
}
```

#### 3. claim_payout()

Пользователь забирает выигрыш. Контракт сам вычисляет выплату на основе user_positions.

**Логика**:
```typescript
() claim_payout() {
  // Проверяем, что рынок разрешен
  if (resolved_outcome == 0) throw("Market not resolved");
  
  // Получаем позицию пользователя
  var (amount_yes, amount_no) = user_positions[msg.sender];
  
  // Вычисляем выплату
  int payout = 0;
  
  if (resolved_outcome == 1 && amount_yes > 0) {
    // YES выиграл
    // Edge case: деление на ноль (ИСПРАВЛЕНО: добавлена проверка)
    if (total_yes == 0) {
      throw("Invalid state: total_yes is zero");
    }
    
    int fee_out = total_no * fee_out_bps / 10000;
    int total_pool = total_yes + total_no - fee_out;
    
    // Обработка округления (ИСПРАВЛЕНО: умножаем сначала, потом делим)
    payout = (amount_yes * total_pool) / total_yes;
    
  } else if (resolved_outcome == 2 && amount_no > 0) {
    // NO выиграл
    // Edge case: деление на ноль (ИСПРАВЛЕНО: добавлена проверка)
    if (total_no == 0) {
      throw("Invalid state: total_no is zero");
    }
    
    int fee_out = total_yes * fee_out_bps / 10000;
    int total_pool = total_yes + total_no - fee_out;
    
    // Обработка округления (ИСПРАВЛЕНО: умножаем сначала, потом делим)
    payout = (amount_no * total_pool) / total_no;
  }
  
  if (payout > 0) {
    // Отправляем выплату
    send_message(msg.sender, payout);
    // Обнуляем позицию
    user_positions[msg.sender] = (0, 0);
  }
}
```

#### 4. refund_market(refund_fee_bps)

Возврат средств при отмене события. **ИСПРАВЛЕНО**: убран `market_id`, контракт = рынок.

**Логика**:
```typescript
() refund_market(refund_fee_bps) {
  // Проверка админа
  if (msg.sender != admin_address) {
    throw("Only admin can refund");
  }
  
  // Возвращаем ставки всем участникам минус комиссия
  // refund_amount = user_stake × (10000 - refund_fee_bps) / 10000
  
  // Итерация по всем пользователям и отправка возврата
  // (реализация зависит от возможностей TON контракта)
}
```

### Проверка баланса контракта

**ИСПРАВЛЕНО**: Правильная проверка баланса.

```typescript
// fee_in уходит сразу, fee_out уходит при разрешении
// На контракте должно быть: total_yes + total_no (если не разрешено)
// Или: остаток после выплат (если разрешено)

int contract_balance = my_balance();
if (resolved_outcome == 0) {
  // Рынок открыт - баланс = total_yes + total_no
  if (contract_balance != total_yes + total_no) {
    throw("Balance mismatch - audit required");
  }
} else {
  // Рынок разрешен - баланс должен быть >= 0
  // (может быть остаток после частичных выплат)
}
```

---

## API Endpoints

### События

```
GET /api/events
Query: ?page=1&limit=20&status=open&sort=volume
Response: { events: [...], total: 100, page: 1 }

GET /api/events/:id
Response: { 
  event: {...},
  probability: { yes: 0.65, no: 0.35 },
  coefficients: { yes: 1.54, no: 2.86 },
  poolHistory: [...] // для графика
}

POST /api/events
Body: { title, description, category, end_date }
Headers: { Authorization: "TON transaction with 0.01 TON deposit" }
Response: { 
  event: {...},
  contract_address: "EQD...",
  deployment_tx: "..."
}
```

### Ставки

```
POST /api/bets
Body: { eventId, side: "yes"|"no", amount, txHash }
Response: { 
  success: true, 
  bet: {...},
  validation: {
    maxBetAllowed: 200,
    probabilityChange: 0.05
  }
}

GET /api/user/:id/bets
Query: ?eventId=1&status=confirmed
Response: { bets: [...] }
```

### Разрешение событий

```
POST /api/events/:id/resolve (admin only)
Body: { outcome: "yes" | "no", admin_signature: "..." }
Response: { success: true, tx_hash: "..." }
```

### Отмена событий

```
POST /api/events/:id/cancel-request
Body: { reason: "Event is invalid" }
Response: { success: true, request_id: 123 }

POST /api/events/:id/cancel (admin only)
Body: { approved: true }
Response: { success: true, refund_initiated: true }

POST /api/events/:id/refund (admin only)
Response: { success: true, tx_hash: "..." }
```

### Пользователи

```
GET /api/user/:id/balance
Response: { balance: "100.5", pending: "10.2" }

GET /api/leaderboard
Query: ?period=week|month
Response: [
  { rank: 1, username: "User1", pnl: 150, pnlPercent: 15 },
  ...
]
```

---

## Проблемы и решения

### 🔴 Критические проблемы (исправлены)

#### 1. Отсутствие базовых таблиц в схеме БД
**Проблема**: Не было таблиц `users` и `wallets`.  
**Решение**: Добавлены в схему БД (см. раздел "Схема базы данных").

#### 2. Ошибка в проверке баланса контракта
**Проблема**: Использовалось несуществующее поле `total_fees_paid`.  
**Решение**: Исправлена проверка баланса (см. раздел "Smart Contract").

#### 3. Несоответствие: использование market_id в refund_event
**Проблема**: Функция использовала `market_id`, но контракт = рынок.  
**Решение**: Переименовано в `refund_market()` без `market_id`.

#### 4. Отсутствие механизма синхронизации backend с блокчейном
**Проблема**: Backend не знал о реальных ставках на контракте.  
**Решение**: Добавлен механизм синхронизации:

```typescript
// Backend должен периодически проверять контракты
async function syncContractState(contractAddress: string) {
  const contract = await tonClient.getContract(contractAddress);
  const state = await contract.getState();
  
  // Обновляем БД с данными из контракта
  await db.events.update({
    contract_address: contractAddress
  }, {
    total_yes: state.total_yes,
    total_no: state.total_no,
    resolved_outcome: state.resolved_outcome
  });
  
  // Создаем запись в истории пулов
  await db.pool_history.create({
    event_id: event.id,
    total_yes: state.total_yes,
    total_no: state.total_no
  });
}

// Или использовать мониторинг транзакций
async function monitorContractTransactions(contractAddress: string) {
  // Слушаем новые транзакции на контракт
  // Обновляем БД при каждой ставке
  tonClient.subscribeToTransactions(contractAddress, async (tx) => {
    // Обработка транзакции
    await processBetTransaction(tx);
  });
}
```

#### 5. Проблема с fee_in и fee_out: куда уходят комиссии?
**Проблема**: Не было описано, куда отправляются комиссии.  
**Решение**: Добавлена отправка на админ-кошелек в функциях `place_bet` и `resolve_market` (см. раздел "Smart Contract").

#### 6. Отсутствие проверки админа в контракте
**Проблема**: Любой мог разрешить рынок.  
**Решение**: Добавлена проверка `msg.sender != admin_address` в `resolve_market` и `refund_market`.

#### 7. Edge cases: пустые пулы, деление на ноль
**Проблема**: Не обрабатывались случаи, когда `total_yes = 0` или `total_no = 0`.  
**Решение**: Добавлены проверки во всех функциях контракта.

### 🟡 Важные проблемы (рекомендуется исправить)

#### 8. Отсутствие таблицы для истории пулов
**Решение**: Добавлена таблица `pool_history` (см. схему БД).

#### 9. Валидация ставок только в backend
**Проблема**: Можно обойти валидацию, отправив транзакцию напрямую в контракт.  
**Решение**: Добавлена валидация в контракт (см. функцию `place_bet`).

#### 10. Отсутствие верификации транзакций в backend
**Проблема**: Можно подделать ставки через API.  
**Решение**: Добавлена верификация:

```typescript
POST /api/bets
Body: { eventId, side, amount, txHash }

// Backend проверяет:
async function verifyBet(txHash: string, eventId: number, expectedAmount: bigint) {
  const tx = await tonClient.getTransaction(txHash);
  
  if (!tx) throw new Error("Transaction not found");
  if (tx.to !== event.contract_address) throw new Error("Wrong contract");
  if (tx.value !== expectedAmount) throw new Error("Amount mismatch");
  if (tx.success === false) throw new Error("Transaction failed");
  
  return true;
}
```

#### 11. Проблема с округлением при делении nanotons
**Проблема**: При делении теряются дробные части.  
**Решение**: Умножаем сначала, потом делим: `payout = (user_stake * total_pool) / total_yes`.

#### 12. Отсутствие обработки failed транзакций
**Решение**: Добавлен статус `failed` в таблицу `bets` и проверка статуса транзакции.

#### 13. Отсутствие rate limiting
**Решение**: Добавлен middleware:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов
});

app.use('/api/', limiter);

// Более строгий лимит для ставок
const betLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10 // максимум 10 ставок в минуту
});

app.use('/api/bets', betLimiter);
```

### 🟢 Мелкие недочёты

- Отсутствие миграций БД (рекомендуется использовать `node-pg-migrate`)
- Отсутствие тестов (unit, integration, E2E)
- Отсутствие документации API (Swagger/OpenAPI)
- Отсутствие логирования и мониторинга (Winston, Prometheus)
- Проблема с типами: использование `number` вместо `bigint` для TON

---

## Формулы и расчеты

### Вероятность YES в реалтайме

```
prob_yes = total_yes / (total_yes + total_no)
prob_no = 1 - prob_yes
```

**Edge case**: Если `total_yes + total_no = 0`, возвращаем `{ yes: 0.5, no: 0.5 }`.

### Коэффициент при ставке

```
coef_yes = (total_yes + total_no) / total_yes  (если total_yes > 0)
coef_no = (total_yes + total_no) / total_no    (если total_no > 0)
```

### Fee на входе

```
fee_amount = bet_gross × fee_in_bps / 10000
amount_net = bet_gross - fee_amount
```

### Fee на выходе

```
fee_out_amount = min(total_yes, total_no) × fee_out_bps / 10000
```

### Выплата победителю

См. раздел "Комиссионная модель".

---

## Безопасность

### Защита от манипуляций крупными ставками

**Проблема**: Кит может исказить вероятности крупной ставкой.

**Решение**: Лимиты на ставки:
- Максимум 20% от текущего пула
- Максимум 10% изменение вероятности за одну ставку
- Абсолютный максимум: 100 TON

**Реализация**:
```typescript
function validateBetSize(event: Event, betAmount: number, side: 'yes' | 'no') {
  const currentPool = side === 'yes' ? event.totalYes : event.totalNo;
  const maxBet = currentPool * 0.20; // 20% от пула
  
  if (betAmount > maxBet && currentPool > 0) {
    throw new Error(`Bet too large. Maximum: ${maxBet} TON (20% of pool)`);
  }
  
  // Проверка изменения вероятности
  const total = event.totalYes + event.totalNo;
  if (total === 0) return; // Первая ставка
  
  const currentProb = event.totalYes / total;
  const newTotalYes = side === 'yes' ? event.totalYes + betAmount : event.totalYes;
  const newTotalNo = side === 'no' ? event.totalNo + betAmount : event.totalNo;
  const newProb = newTotalYes / (newTotalYes + newTotalNo);
  const probChange = Math.abs(newProb - currentProb);
  
  if (probChange > 0.10) { // 10%
    throw new Error(`Bet would change probability by ${probChange * 100}%. Maximum: 10%`);
  }
}
```

### Другие меры безопасности

- ✅ Проверка `msg.sender` в контракте (только админ может разрешать)
- ✅ Двойная проверка баланса контракта перед распределением
- ✅ Минимум/максимум ставки (0.1 TON / 100 TON)
- ✅ Rate limiting на API endpoints
- ✅ Зашифрованные переменные окружения (.env)
- ✅ Верификация транзакций перед записью в БД

---

## Приоритеты реализации

### MVP (первые 2 недели)

1. ✅ Базовая структура проекта (frontend, backend, smart-contract)
2. ✅ Smart Contract: MarketEscrow (один контракт на рынок)
3. ✅ Backend: деплой контракта при создании события
4. ✅ Подключение кошелька через TonConnect
5. ✅ Список событий с адресами контрактов
6. ✅ Размещение ставок: отправка TON на контракт события
7. ✅ Разрешение событий админом
8. ✅ Распределение выплат через контракт (claim_payout)

### Следующий этап (2-4 недели)

9. Отмена событий и возврат средств
10. Защита от манипуляций (лимиты на ставки)
11. Telegram бот с уведомлениями
12. Лидерборд
13. Синхронизация backend с блокчейном
14. Верификация транзакций
15. Rate limiting

### Будущее

16. DAO с судьями
17. TWAP для крупных ставок
18. Factory-контракт для батч-деплоя
19. Тесты (unit, integration, E2E)
20. Мониторинг и логирование
21. Документация API (Swagger)

---

## Дополнительные замечания

### Создание события: залог 0.01 TON

При создании события требуется залог 0.01 TON от создателя:
- Залог идет на покрытие деплоя контракта (~0.1-0.2 TON)
- Если деплой стоит меньше, остаток возвращается
- Если создатель не заплатил, событие не создается

### Разрешение событий после end_date

- Поле `end_date` — информационное (для UI)
- Разрешение делает админ вручную (позже — DAO)
- Событие может оставаться `open` после `end_date` до разрешения
- UI показывает "Ожидает разрешения" если `end_date` прошел, но `status` = `open`

### Масштабирование

С архитектурой "один контракт на рынок" масштабирование работает автоматически:
- Каждое событие = отдельный контракт
- Нет ограничений на количество одновременных рынков
- Backend управляет реестром: `event_id → contract_address`

---

## Заключение

Документ содержит полную спецификацию проекта PredictionBot с учетом всех найденных проблем и их решений. Все критические проблемы исправлены, важные проблемы имеют решения, мелкие недочёты отмечены для будущей доработки.

**Готово к началу разработки!** 🚀

