# Ручная компиляция контракта

## ✅ Func compiler установлен!

Func compiler установлен через `brew install ton-blockchain/ton/ton` и находится в:
```
/usr/local/Cellar/ton/64/bin/func
```

## Компиляция вручную

### Шаг 1: Компиляция в .fif файл

```bash
cd smart-contract
/usr/local/Cellar/ton/64/bin/func sources/MarketEscrow.fc -o build/MarketEscrow.fif
```

### Шаг 2: Компиляция .fif в .cell

```bash
/usr/local/Cellar/ton/64/bin/fift -s build/MarketEscrow.fif -o build/MarketEscrow.cell
```

### Или одной командой:

```bash
cd smart-contract
/usr/local/Cellar/ton/64/bin/func sources/MarketEscrow.fc -o build/MarketEscrow.fif && \
/usr/local/Cellar/ton/64/bin/fift -s build/MarketEscrow.fif -o build/MarketEscrow.cell
```

## Проверка результата

После компиляции проверьте:

```bash
ls -lh build/MarketEscrow.cell
```

Файл должен быть размером примерно 5-50 KB.

## Обновление скрипта

После успешной компиляции обновите `scripts/compile.sh` для использования правильных путей.

## Примечание

Если компиляция занимает много времени или зависает, это нормально - контракт может быть сложным для компиляции. Подождите несколько минут.

