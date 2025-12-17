# Инструкция по компиляции контракта

## Установка func compiler

### macOS

```bash
# Через Homebrew
brew install func

# Или скачать бинарник
# https://github.com/ton-blockchain/func/releases
```

### Linux

```bash
# Скачать с GitHub releases
wget https://github.com/ton-blockchain/func/releases/latest/download/func-linux
chmod +x func-linux
sudo mv func-linux /usr/local/bin/func
```

### Windows

Скачать с https://github.com/ton-blockchain/func/releases и добавить в PATH

## Получение stdlib.fc

stdlib.fc нужно скачать из официального репозитория TON:

```bash
cd smart-contract/imports
wget https://raw.githubusercontent.com/ton-blockchain/ton/master/crypto/smartcont/stdlib.fc
```

Или скопировать из установки TON SDK.

## Компиляция

```bash
cd smart-contract
func build sources/MarketEscrow.fc -o build/MarketEscrow.cell
```

## Проверка компиляции

После компиляции должен появиться файл `build/MarketEscrow.cell`

```bash
ls -lh build/MarketEscrow.cell
```

## Автоматическая компиляция

Используйте скрипт:

```bash
npm run build
```

Или напрямую:

```bash
./scripts/compile.sh
```

