# Быстрый старт: Пул wDOI/USDT

## 🎯 Цель

Покупка токенов wDOI за стейблкоин USDT через MetaMask одним кликом.

## 🚀 Быстрый запуск

### 1. Развертывание контрактов

```bash
# Клонируйте репозиторий
git clone <repository>
cd wrapped-doichain

# Установите зависимости
npm install

# Настройте .env
cp .env.example .env
# Добавьте ваши API ключи и приватный ключ

# Компилируйте контракты
npx hardhat compile

# Запустите тесты
npx hardhat test test/wDOIUSDTPool.simple.test.js
```

### 2. Деплой на testnet

```bash
# Деплой кастодиального токена wDOI
npx hardhat run scripts/deploy-custodial.js --network sepolia

# Деплой пула wDOI/USDT
npx hardhat run scripts/deploy-usdt-pool.js --network sepolia
```

### 3. Добавление начальной ликвидности

```javascript
// Подключение к контрактам
const wdoiAddress = "0x..."; // Из файла deployments/sepolia-custodial.json
const poolAddress = "0x..."; // Из файла deployments/sepolia-usdt-pool.json

// Добавление 1000 wDOI + 1000 USDT
await wdoiToken.approve(poolAddress, ethers.parseEther("1000"));
await usdtToken.approve(poolAddress, ethers.parseUnits("1000", 6));

await pool.addLiquidity(
    ethers.parseEther("1000"),    // 1000 wDOI
    ethers.parseUnits("1000", 6), // 1000 USDT
    ethers.parseEther("990"),     // min wDOI (1% slippage)
    ethers.parseUnits("990", 6)   // min USDT (1% slippage)
);
```

### 4. Использование в MetaMask

```bash
# Откройте веб-интерфейс
firefox frontend/usdt-pool.html
# или
chrome frontend/usdt-pool.html
```

**В браузере:**
1. Нажмите "Connect MetaMask Wallet"
2. Введите сумму USDT для обмена
3. Нажмите "Swap X USDT for Y wDOI"
4. Подтвердите в MetaMask
5. Получите wDOI мгновенно!

## 📊 Основные функции

### Покупка wDOI за USDT

```solidity
function swapUSDTForWDOI(uint256 usdtAmountIn, uint256 minWDOIOut) external
```

**Пример:**
```javascript
// Покупка wDOI за 100 USDT
const usdtAmount = ethers.parseUnits("100", 6); // 100 USDT
const expectedWDOI = await pool.getAmountOut(usdtAmount, reserveUSDT, reserveWDOI);
const minWDOI = expectedWDOI * 95n / 100n; // 5% slippage

await usdtToken.approve(poolAddress, usdtAmount);
await pool.swapUSDTForWDOI(usdtAmount, minWDOI);
```

### Продажа wDOI за USDT

```solidity
function swapWDOIForUSDT(uint256 wdoiAmountIn, uint256 minUSDTOut) external
```

**Пример:**
```javascript
// Продажа 50 wDOI за USDT
const wdoiAmount = ethers.parseEther("50"); // 50 wDOI
const expectedUSDT = await pool.getAmountOut(wdoiAmount, reserveWDOI, reserveUSDT);
const minUSDT = expectedUSDT * 95n / 100n; // 5% slippage

await wdoiToken.approve(poolAddress, wdoiAmount);
await pool.swapWDOIForUSDT(wdoiAmount, minUSDT);
```

### Получение информации о пуле

```solidity
function getPoolInfo() external view returns (
    uint256 reserveWDOI,
    uint256 reserveUSDT,
    uint256 totalSupply,
    uint256 wdoiPrice,
    uint256 accFeesWDOI,
    uint256 accFeesUSDT
)
```

**Пример:**
```javascript
const [reserveWDOI, reserveUSDT, totalSupply, wdoiPrice] = await pool.getPoolInfo();

console.log("wDOI в пуле:", ethers.formatEther(reserveWDOI));
console.log("USDT в пуле:", ethers.formatUnits(reserveUSDT, 6));
console.log("Цена 1 wDOI:", ethers.formatUnits(wdoiPrice, 6), "USDT");
```

## 🔧 Конфигурация сетей

### USDT адреса

```javascript
const USDT_ADDRESSES = {
    mainnet: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    sepolia: "0x7169D38820dfd117C3FA1f22a697dBA58d90BA06", 
    polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    bsc: "0x55d398326f99059fF775485246999027B3197955"
};
```

### Frontend конфигурация

```javascript
// В файле frontend/usdt-pool.html обновите адреса:
const WDOI_TOKEN_ADDRESS = '0x...'; // Адрес деплоенного wDOI
const USDT_TOKEN_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7'; // USDT
const USDT_POOL_ADDRESS = '0x...'; // Адрес деплоенного пула
```

## 💡 Особенности USDT

### Decimals различия

- **wDOI:** 18 decimals (стандарт ERC20)
- **USDT:** 6 decimals (особенность USDT)

**Важно учитывать:**
```javascript
// Правильно
const usdtAmount = ethers.parseUnits("100", 6);   // 100 USDT
const wdoiAmount = ethers.parseEther("100");      // 100 wDOI

// Неправильно  
const usdtAmount = ethers.parseEther("100");      // Ошибка! USDT = 6 decimals
```

### Отображение балансов

```javascript
// USDT баланс
const usdtBalance = await usdtToken.balanceOf(userAddress);
const usdtFormatted = ethers.formatUnits(usdtBalance, 6); // 6 decimals

// wDOI баланс
const wdoiBalance = await wdoiToken.balanceOf(userAddress);
const wdoiFormatted = ethers.formatEther(wdoiBalance); // 18 decimals
```

## 🧪 Тестирование

### Запуск тестов

```bash
# Все тесты USDT пула
npx hardhat test test/wDOIUSDTPool.simple.test.js

# С детальным gas отчетом
REPORT_GAS=true npx hardhat test test/wDOIUSDTPool.simple.test.js

# Coverage
npx hardhat coverage --testfiles test/wDOIUSDTPool.simple.test.js
```

### Результат тестов

```
✅ 8 passing tests:
  - Deployment (2 tests)
  - Basic Functionality (5 tests) 
  - Pool Information (1 test)

Gas Usage:
  - addLiquidity: ~269,012 gas
  - swapUSDTForWDOI: ~105,348 gas
  - collectFees: ~47,261 gas
```

## 📈 Экономика пула

### Комиссии

- **Торговая комиссия:** 0.3% с каждого swap
- **Сбор:** Автоматический в обоих токенах (wDOI + USDT)
- **Владелец:** Может собрать через `collectFees()`

### Формула ценообразования

```
Константное произведение: reserveWDOI * reserveUSDT = k

Обмен USDT → wDOI:
wdoiOut = (usdtIn * 997 * reserveWDOI) / (reserveUSDT * 1000 + usdtIn * 997)

Где:
- 997 = 1000 - 3 (комиссия 0.3%)
- usdtIn в 6 decimals
- wdoiOut в 18 decimals
```

### Пример расчета

```
Пул: 10,000 wDOI ↔ 10,000 USDT
Обмен: 100 USDT → ? wDOI

Расчет:
wdoiOut = (100e6 * 997 * 10000e18) / (10000e6 * 1000 + 100e6 * 997)
        = 98.72 wDOI

Комиссия: 100 - 98.72 = 1.28 wDOI (~1.3%)
```

## 🔒 Безопасность

### Встроенные защиты

- ✅ **ReentrancyGuard** - защита от реентрантности
- ✅ **Pausable** - экстренная пауза операций  
- ✅ **Ownable** - контроль административных функций
- ✅ **Slippage Protection** - защита от неблагоприятных цен

### Административные функции

```solidity
function pause() external onlyOwner;           // Пауза пула
function unpause() external onlyOwner;         // Снятие паузы
function collectFees() external onlyOwner;     // Сбор комиссий  
function emergencyWithdraw() external onlyOwner; // Экстренный вывод
```

## 📱 Frontend интеграция

### Основные элементы

```html
<!-- Подключение кошелька -->
<button id="connectBtn" onclick="connectWallet()">Connect MetaMask</button>

<!-- Ввод суммы USDT -->
<input id="usdtInput" type="number" placeholder="0.0" oninput="calculateSwap()">

<!-- Отображение выходной суммы wDOI -->
<input id="wdoiOutput" type="number" readonly>

<!-- Кнопка swap -->
<button id="swapBtn" onclick="executeSwap()">Swap USDT for wDOI</button>
```

### JavaScript функции

```javascript
// Подключение к MetaMask
async function connectWallet() {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
}

// Расчет swap
async function calculateSwap() {
    const usdtInput = document.getElementById('usdtInput').value;
    const usdtInputWei = ethers.utils.parseUnits(usdtInput, 6);
    const wdoiOutputWei = await poolContract.getAmountOut(usdtInputWei, reserveUSDT, reserveWDOI);
    const wdoiOutput = ethers.utils.formatEther(wdoiOutputWei);
    document.getElementById('wdoiOutput').value = wdoiOutput;
}

// Выполнение swap
async function executeSwap() {
    const usdtInput = document.getElementById('usdtInput').value;
    const wdoiOutput = document.getElementById('wdoiOutput').value;
    
    const usdtInputWei = ethers.utils.parseUnits(usdtInput, 6);
    const minWDOIWei = ethers.utils.parseEther((wdoiOutput * 0.95).toString());
    
    // Approve и swap
    await usdtContract.connect(signer).approve(USDT_POOL_ADDRESS, usdtInputWei);
    await poolContract.connect(signer).swapUSDTForWDOI(usdtInputWei, minWDOIWei);
}
```

## ✅ Итоговый чеклист

### Для разработчика

- [ ] Скомпилированы контракты
- [ ] Пройдены все тесты  
- [ ] Деплоены контракты на testnet
- [ ] Добавлена начальная ликвидность
- [ ] Обновлены адреса в frontend
- [ ] Протестирован веб-интерфейс

### Для пользователя

- [ ] Установлен MetaMask
- [ ] Есть USDT на балансе
- [ ] Подключен к правильной сети
- [ ] Открыт веб-интерфейс пула
- [ ] Готов к покупке wDOI! 🚀

---

**Результат:** Пользователи могут покупать wDOI за USDT одним кликом в MetaMask без сложных процедур! 💰