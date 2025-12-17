# Установка func compiler

## macOS

### Вариант 1: Через Homebrew (рекомендуется)

```bash
brew install func
```

### Вариант 2: Скачать бинарник

```bash
# Скачать последнюю версию
curl -L -o func-mac https://github.com/ton-blockchain/func/releases/latest/download/func-mac

# Сделать исполняемым
chmod +x func-mac

# Переместить в PATH
sudo mv func-mac /usr/local/bin/func

# Проверить установку
func --version
```

## Linux

```bash
# Скачать бинарник
wget https://github.com/ton-blockchain/func/releases/latest/download/func-linux

# Сделать исполняемым
chmod +x func-linux

# Переместить в PATH
sudo mv func-linux /usr/local/bin/func

# Проверить установку
func --version
```

## Windows

1. Скачать `func-win.exe` с https://github.com/ton-blockchain/func/releases
2. Переименовать в `func.exe`
3. Добавить в PATH или использовать полный путь

## Проверка установки

После установки проверьте:

```bash
func --version
```

Должна вывестись версия компилятора.

## Компиляция контракта

После установки func:

```bash
cd smart-contract
npm run build
```

Или напрямую:

```bash
./scripts/compile.sh
```

## Альтернатива: Docker

Если не хотите устанавливать func локально, можно использовать Docker:

```bash
docker run --rm -v $(pwd):/work -w /work ton-blockchain/func:latest \
  func build sources/MarketEscrow.fc -o build/MarketEscrow.cell
```

