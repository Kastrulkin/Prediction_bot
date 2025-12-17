# Исправление проблемы с зависанием (версия 2)

## Проблема

Компиляция зависала из-за неправильного использования `udict_set`:
- `udict_set` принимает `slice value`
- Мы передавали `cell` (результат `store_user_position`)

## Исправление

Заменено:
- `user_positions_dict~udict_set(256, sender_key, store_user_position(...))`
- На: `user_positions_dict = user_positions_dict.udict_set_ref(256, sender_key, store_user_position(...))`

`udict_set_ref` принимает `cell value`, что нам и нужно.

## Теперь попробуйте снова

1. **Прервите зависшие процессы** (Ctrl+C)

2. **Запустите компиляцию**:
   ```bash
   cd smart-contract
   ./scripts/compile.sh
   ```

Теперь должно работать!

