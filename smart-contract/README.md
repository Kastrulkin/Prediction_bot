# PredictionBot Smart Contracts

TON смарт-контракты для PredictionBot.

## Структура

- `sources/MarketEscrow.fc` - основной контракт для хранения ставок и распределения выплат
- `wrappers/MarketEscrow.ts` - TypeScript wrapper для работы с контрактом
- `scripts/deploy.ts` - скрипт для деплоя контракта
- `scripts/compile.sh` - скрипт для компиляции контракта
- `imports/stdlib.fc` - стандартная библиотека FunC

## Установка func compiler

См. [INSTALL_FUNC.md](./INSTALL_FUNC.md) для детальных инструкций.

**Быстрая установка (macOS)**:
```bash
brew install func
```

## Компиляция

После установки func compiler:

```bash
npm run build
```

Или напрямую:

```bash
./scripts/compile.sh
```

Скомпилированный контракт будет в `build/MarketEscrow.cell`

## Деплой

```bash
# Testnet
npm run deploy:testnet

# Mainnet
npm run deploy:mainnet
```

## Функции контракта

### place_bet(side, amount)
Размещение ставки на событие.

### resolve_market(outcome)
Разрешение рынка администратором.

### claim_payout()
Получение выплаты победителем.

### refund_market(refund_fee_bps)
Возврат средств при отмене события.

## Get методы

### get_market_data()
Возвращает данные рынка: total_yes, total_no, resolved_outcome, fee_in_bps, fee_out_bps.

### get_user_position(user_address)
Возвращает позицию пользователя: amount_yes, amount_no.

