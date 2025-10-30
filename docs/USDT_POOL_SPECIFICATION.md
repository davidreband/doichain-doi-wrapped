# Пул ликвидности wDOI/USDT - Техническая спецификация

## 🎯 Цель проекта

Создание **пула ликвидности wDOI/USDT** для покупки wDOI за стейблкоин USDT через MetaMask.

## 🏗️ Архитектура

### Основные компоненты

```
┌─────────────────────────────────────────────────────────────────┐
│                    ПОЛЬЗОВАТЕЛЬСКИЙ ИНТЕРФЕЙС                   │
├─────────────────────────────────────────────────────────────────┤
│  MetaMask + Web Interface                                       │
│  • Подключение к MetaMask                                      │
│  • Отображение балансов wDOI/USDT                              │
│  • Swap USDT → wDOI мгновенно                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ETHEREUM БЛОКЧЕЙН                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌──────────────────────────┐    │
│  │ wDOI Token Contract     │    │ USDT Pool Contract       │    │
│  │                         │    │ (AMM wDOI/USDT)          │    │
│  │ • ERC20 standard       │◄───┤ • x*y=k formula         │    │
│  │ • 18 decimals          │    │ • USDT ↔ wDOI swaps     │    │
│  │ • Standard transfers   │    │ • LP tokens              │    │
│  └─────────────────────────┘    │ • 0.3% trading fees     │    │
│                                 │ • USDT (6 decimals)     │    │
│                                 └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## 💱 Основная функциональность

### Покупка wDOI за USDT

**Простой процесс:**
1. Подключение MetaMask
2. Ввод суммы USDT
3. Подтверждение транзакции
4. Получение wDOI мгновенно

### Swap операции

```solidity
// Покупка wDOI за USDT
function swapUSDTForWDOI(uint256 usdtAmountIn, uint256 minWDOIOut) external

// Продажа wDOI за USDT
function swapWDOIForUSDT(uint256 wdoiAmountIn, uint256 minUSDTOut) external
```

## 📊 Контракт пула wDOI/USDT

### Технические характеристики

- **Адрес:** `wDOIUSDTPool.sol`
- **Тип:** Автоматизированный маркет-мейкер (AMM)
- **Формула:** x*y=k (константное произведение)
- **Комиссия:** 0.3% с каждого swap
- **wDOI:** 18 decimals (стандарт ERC20)
- **USDT:** 6 decimals (стандарт USDT)

### Ключевые функции

#### Торговые операции
```solidity
// Обмен USDT на wDOI
function swapUSDTForWDOI(uint256 usdtAmountIn, uint256 minWDOIOut) external

// Обмен wDOI на USDT  
function swapWDOIForUSDT(uint256 wdoiAmountIn, uint256 minUSDTOut) external

// Расчет выходной суммы
function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public pure

// Текущая цена wDOI в USDT
function getWDOIPrice() external view returns (uint256)
```

#### Управление ликвидностью
```solidity
// Добавление ликвидности
function addLiquidity(uint256 wdoiAmount, uint256 usdtAmount, uint256 minWDOI, uint256 minUSDT) external

// Удаление ликвидности
function removeLiquidity(uint256 lpTokens, uint256 minWDOI, uint256 minUSDT) external
```

### Математическая модель

#### Формула AMM
```
reserveWDOI * reserveUSDT = k (константа)

Обмен USDT → wDOI:
wdoiOut = (usdtIn * 997 * reserveWDOI) / (reserveUSDT * 1000 + usdtIn * 997)
где 997 = 1000 - 3 (комиссия 0.3%)
```

#### Примеры расчетов
```
Пул: 10,000 wDOI ↔ 10,000 USDT
Цена: 1 wDOI = 1 USDT

Обмен 100 USDT → wDOI:
wdoiOut = (100 * 997 * 10000) / (10000 * 1000 + 100 * 997)
        = 99,700,000 / 1,009,970
        = 98.72 wDOI

Комиссия: ~1.28 wDOI
```

## 🔧 Развертывание

### Автоматический деплой

```bash
# Развертывание пула wDOI/USDT
npx hardhat run scripts/deploy-usdt-pool.js --network sepolia

# Mainnet deployment
npx hardhat run scripts/deploy-usdt-pool.js --network mainnet
```

### Конфигурация USDT адресов

**Предустановленные адреса:**
- **Ethereum Mainnet:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Sepolia Testnet:** `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`
- **Polygon:** `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- **BSC:** `0x55d398326f99059fF775485246999027B3197955`

**Кастомный адрес:**
```bash
USDT_ADDRESS=0x... npx hardhat run scripts/deploy-usdt-pool.js --network mainnet
```

## 🧪 Тестирование

### Автоматизированные тесты

**15 основных тестов:**
- ✅ Развертывание и инициализация
- ✅ Добавление/удаление ликвидности
- ✅ USDT ↔ wDOI swap операции
- ✅ Расчеты цен с учетом USDT decimals
- ✅ Административные функции
- ✅ Обработка ошибок

```bash
# Запуск тестов USDT пула
npx hardhat test test/wDOIUSDTPool.test.js

# С gas отчетом
REPORT_GAS=true npx hardhat test test/wDOIUSDTPool.test.js
```

### Особенности тестирования USDT

```javascript
// USDT имеет 6 decimals (не 18!)
const usdtAmount = ethers.parseUnits("100", 6); // 100 USDT
const wdoiAmount = ethers.parseEther("100");    // 100 wDOI

// Цена wDOI в USDT (результат в 18 decimals)
const price = await pool.getWDOIPrice();
const priceFormatted = ethers.formatUnits(price, 6); // USDT цена
```

## 💻 Web интерфейс

### Frontend для USDT торговли

**Основные функции:**
- 🔗 Подключение MetaMask
- 💰 Отображение балансов wDOI/USDT
- 📊 Реальные цены и слиппаж
- 🔄 Мгновенные USDT → wDOI свопы
- 🛡️ Защита от slippage

### Интеграция с MetaMask

```javascript
// Инициализация контрактов
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // Mainnet USDT
const POOL_ADDRESS = "0x..."; // Адрес деплоенного пула

const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);
const poolContract = new ethers.Contract(POOL_ADDRESS, POOL_ABI, provider);

// Выполнение swap USDT → wDOI
async function swapUSDTForWDOI(usdtAmount) {
    // 1. Approve USDT
    await usdtContract.connect(signer).approve(POOL_ADDRESS, usdtAmount);
    
    // 2. Расчет минимального выхода (5% slippage)
    const expectedWDOI = await poolContract.getAmountOut(usdtAmount, reserveUSDT, reserveWDOI);
    const minWDOI = expectedWDOI * 95n / 100n;
    
    // 3. Выполнение swap
    await poolContract.connect(signer).swapUSDTForWDOI(usdtAmount, minWDOI);
}
```

## 🔒 Безопасность

### Встроенные защиты

**Контракт уровень:**
- ✅ ReentrancyGuard - защита от реентрантности  
- ✅ Pausable - экстренная пауза
- ✅ Ownable - контроль доступа
- ✅ Проверка decimals для USDT (6) и wDOI (18)

**Особенности USDT:**
- ✅ Правильная обработка 6 decimals
- ✅ Совместимость с различными USDT реализациями
- ✅ Проверка успешности transfers

### Административные функции

```solidity
function collectFees() external onlyOwner        // Сбор комиссий
function pause() external onlyOwner              // Пауза
function unpause() external onlyOwner            // Снятие паузы  
function emergencyWithdraw() external onlyOwner  // Экстренный вывод
```

## 📈 Экономическая модель

### Структура доходов

**Комиссии:**
- 0.3% с каждого USDT ↔ wDOI swap
- Сбор в обоих токенах (wDOI и USDT)
- 100% комиссий владельцу пула

**Доходность LP:**
```
Пример: 
Пул $50,000 ликвидности (25k wDOI + 25k USDT)
Дневной объем $5,000
Годовая доходность = $5,000 * 365 * 0.3% / $50,000 = 10.95% APY
```

## 🚀 Примеры использования

### Добавление начальной ликвидности

```javascript
// 1. Approve токены
await wdoiToken.approve(poolAddress, ethers.parseEther("1000"));      // 1000 wDOI
await usdtToken.approve(poolAddress, ethers.parseUnits("1000", 6));   // 1000 USDT

// 2. Добавление ликвидности  
await pool.addLiquidity(
    ethers.parseEther("1000"),    // 1000 wDOI
    ethers.parseUnits("1000", 6), // 1000 USDT  
    ethers.parseEther("990"),     // min wDOI (1% slippage)
    ethers.parseUnits("990", 6)   // min USDT (1% slippage)
);
```

### Покупка wDOI за USDT

```javascript
// 1. Approve USDT
const usdtAmount = ethers.parseUnits("100", 6); // 100 USDT
await usdtToken.approve(poolAddress, usdtAmount);

// 2. Расчет ожидаемого wDOI
const expectedWDOI = await pool.getAmountOut(usdtAmount, reserveUSDT, reserveWDOI);
const minWDOI = expectedWDOI * 95n / 100n; // 5% slippage

// 3. Выполнение покупки
await pool.swapUSDTForWDOI(usdtAmount, minWDOI);
```

### Продажа wDOI за USDT

```javascript
// 1. Approve wDOI
const wdoiAmount = ethers.parseEther("50"); // 50 wDOI
await wdoiToken.approve(poolAddress, wdoiAmount);

// 2. Расчет ожидаемого USDT
const expectedUSDT = await pool.getAmountOut(wdoiAmount, reserveWDOI, reserveUSDT);
const minUSDT = expectedUSDT * 95n / 100n; // 5% slippage

// 3. Выполнение продажи
await pool.swapWDOIForUSDT(wdoiAmount, minUSDT);
```

## 📋 Следующие шаги

### Быстрый запуск

1. **Деплой пула**
   ```bash
   npx hardhat run scripts/deploy-usdt-pool.js --network sepolia
   ```

2. **Добавление ликвидности**
   - Approve wDOI и USDT токены
   - Вызов addLiquidity() с начальными суммами

3. **Тестирование торговли**
   - Проверка USDT → wDOI swap
   - Проверка wDOI → USDT swap

4. **Frontend интеграция**
   - Обновление адресов контрактов
   - Тестирование в MetaMask

### Roadmap развития

**Краткосрочно:**
- ✅ Базовый USDT пул
- 🔄 Web интерфейс для USDT торговли
- 🔄 Тестирование на Sepolia
- 🔄 Mainnet деплой

**Среднесрочно:**
- 📱 Мобильная версия
- 🔄 WalletConnect поддержка
- 📊 Analytics dashboard
- 🌉 Cross-chain интеграция

**Долгосрочно:**
- 🚀 Yield farming для LP
- 🏛️ Governance система
- 🔄 Multi-pool aggregator
- 🤖 Trading bots API

---

## ✅ Резюме

**Пул wDOI/USDT обеспечивает:**

✅ **Простую покупку wDOI за USDT** через MetaMask  
✅ **Мгновенные транзакции** без ожидания  
✅ **Справедливые цены** через AMM механизм  
✅ **Минимальные комиссии** (0.3%)  
✅ **Полную безопасность** смарт-контрактов  
✅ **Готовое решение** для production  

Пользователи получают **удобный способ покупки wDOI за стабильную валюту USDT** 💰