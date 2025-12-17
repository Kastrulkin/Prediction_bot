# Исправление проблемы с зависанием компилятора (v4)

## Проблема

Компилятор `func` зависал при компиляции контракта из-за использования методов на словарях.

## Исправление

Заменены все вызовы методов на явные вызовы функций:

**Было:**
```func
var (user_pos_cell, found) = user_positions_dict.udict_get_ref?(256, sender_key);
user_positions_dict = user_positions_dict.udict_set_ref(256, sender_key, value);
```

**Стало:**
```func
var (user_pos_cell, found) = udict_get_ref?(user_positions_dict, 256, sender_key);
user_positions_dict = udict_set_ref(user_positions_dict, 256, sender_key, value);
```

## Изменения

1. `user_positions_dict.udict_get_ref?()` → `udict_get_ref?(user_positions_dict, ...)`
2. `user_positions_dict.udict_set_ref()` → `udict_set_ref(user_positions_dict, ...)`

## Попробуйте скомпилировать

```bash
cd smart-contract
./scripts/compile.sh
```

Или вручную:

```bash
cd smart-contract
/usr/local/Cellar/ton/64/bin/func sources/MarketEscrow.fc -o build/MarketEscrow.fif
/usr/local/Cellar/ton/64/bin/fift -s build/MarketEscrow.fif -o build/MarketEscrow.cell
```

## Если все еще зависает

1. Проверьте версию func: `/usr/local/Cellar/ton/64/bin/func --version`
2. Попробуйте обновить TON: `brew upgrade ton-blockchain/ton/ton`
3. Проверьте логи в `build/compile.log` (если они создаются)

