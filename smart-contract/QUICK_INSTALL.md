# Быстрая установка func compiler

## Рекомендуемый способ (через Homebrew)

```bash
brew install ton-compiler
```

Если формула `ton-compiler` недоступна, попробуйте:

```bash
brew tap ton-blockchain/ton
brew install func
```

## Альтернативный способ (через npm)

```bash
npm install -g ton-compiler
```

После установки func должен быть доступен как `func` или `func-ton`.

## Проверка установки

```bash
func --version
```

## Если ничего не работает

Можно использовать готовый скомпилированный контракт или попросить кого-то скомпилировать.

Для разработки можно временно использовать заглушку в `BlockchainService`.

## Ручная установка (последний вариант)

1. Перейдите на https://github.com/ton-blockchain/func/releases
2. Найдите последний релиз (например, v0.4.0)
3. Скачайте `func-mac` для macOS
4. Сделайте исполняемым: `chmod +x func-mac`
5. Переместите: `sudo mv func-mac /usr/local/bin/func`

