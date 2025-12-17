# Исправление проблемы с зависанием

## Проблема

Компиляция зависала из-за неправильного использования `precompute_uint(256)` для работы со словарями.

## Исправление

Заменено:
- `sender.precompute_uint(256)` → `slice_hash(sender)`
- `user_address.precompute_uint(256)` → `slice_hash(user_address)`

## Теперь попробуйте снова

1. **Прервите зависшие процессы** (Ctrl+C в терминале)

2. **Запустите компиляцию**:
   ```bash
   cd smart-contract
   ./scripts/compile.sh
   ```

3. **Или вручную**:
   ```bash
   /usr/local/Cellar/ton/64/bin/func sources/MarketEscrow.fc -o build/MarketEscrow.fif
   /usr/local/Cellar/ton/64/bin/fift -s build/MarketEscrow.fif -o build/MarketEscrow.cell
   ```

## Ожидаемое время

Теперь компиляция должна занять **10-60 секунд**, а не 40 минут!

Если все еще зависает, проверьте логи ошибок.

