# 🏦 wDOI System User Guide

Welcome to the wDOI (Wrapped Doichain) system! This guide will help you master all system features.

## 🌐 System Access

### Frontend (Web Interface)
- **URL**: http://localhost:5173
- **Description**: Web interface for users
- **Requirements**: MetaMask, Sepolia testnet

### Backend API
- **URL**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **Documentation**: Below in this guide

### Smart Contract
- **Network**: Ethereum Sepolia Testnet
- **Contract Address**: `0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72`
- **Etherscan**: https://sepolia.etherscan.io/address/0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72

## 👥 User Roles

### 1. 🏪 Regular Users (Traders)
**What you do:**
- Buy/sell wDOI on Uniswap
- View reserve information
- No need to interact with bridge directly

**Your path:**
1. Connect MetaMask to Sepolia
2. Go to Uniswap
3. Trade wDOI/USDT like regular ERC20 tokens

### 2. 👨‍💼 Merchants
**What you do:**
- Service clients for large volumes
- Request mint/burn operations from custodians
- Receive commissions for services

**Your permissions:**
- Access to Merchant Dashboard
- View transaction history
- Manage client requests

### 3. 🏦 Custodians
**What you do:**
- Manage DOI reserves
- Confirm mint/burn operations
- Ensure 1:1 backing

**Your permissions:**
- Call mint() function
- Access to Custodian Dashboard
- Manage reserves

### 4. ⚙️ Administrators (Admins)
**What you do:**
- Manage roles
- Add/remove merchants and custodians
- Control system

## 🚀 Quick Start

### Step 1: Setup MetaMask
1. Install MetaMask extension
2. Add Sepolia testnet:
   - Network Name: Sepolia
   - RPC URL: https://sepolia.infura.io/v3/a9780544d8f2417cbb93c4da5ed9a954
   - Chain ID: 11155111
   - Currency: SepoliaETH

3. Get test SepoliaETH: https://sepoliafaucet.com/

### Step 2: Access Interface
1. Open http://localhost:5173
2. Connect MetaMask wallet
3. Switch to Sepolia network

### Step 3: Explore Interface
- **Trading**: Main page with trading options
- **Reserves**: Information about backing and reserves
- **Merchant**: Panel for merchants (role required)
- **Custodian**: Panel for custodians (role required)

## 📱 Using Web Interface

### Main Page (Trading)
![Trading Page Features]

**Available options:**
1. **🦄 Trade on Uniswap** (Recommended)
   - Direct DEX trading
   - Best liquidity
   - Instant trades

2. **⚡ Direct Trading**
   - Custom interface
   - For testing

3. **💧 Liquidity Management**
   - Liquidity management
   - For advanced users

### Reserves Page
**System information:**
- Current backing ratio
- Total wDOI supply
- DOI reserves
- System health status

**WBTC Model explanation:**
- How minting process works
- How burning process works
- Participant roles
- Key principles

### Merchant Dashboard
**For authorized merchants:**
- Pending requests
- Transaction history
- Client management
- Commission tracking

### Custodian Dashboard
**For authorized custodians:**
- Mint requests confirmation
- Burn requests processing
- Reserve monitoring
- System health overview

## 🔧 API Reference

### Base URL: http://localhost:3001/api/v1

### Health Check
```bash
GET /health
```
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-06T10:42:06.402Z",
  "version": "1.0.0"
}
```

### Reserves Information
```bash
GET /api/v1/reserves
```
**Response:**
```json
{
  "wdoi": {
    "totalSupply": 0,
    "contractAddress": "0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72",
    "network": "Ethereum Sepolia"
  },
  "doi": {
    "balance": 1245.67,
    "custodialAddress": "D8KpX2Ym5VzQr3LmNn4bCvR9sH1tE6wX2fG9hK4m",
    "network": "Doichain"
  },
  "backing": {
    "ratio": 0,
    "percentage": "0.00",
    "isHealthy": false,
    "status": "Attention Required"
  }
}
```

### Request Mint
```bash
POST /api/v1/mint
Content-Type: application/json

{
  "doiTxHash": "doi_transaction_hash_here",
  "amount": "100.5",
  "recipientAddress": "0x742d35Cc65C7a6123e18EBA0DA27Ad60DCD9F0dd"
}
```

**Response:**
```json
{
  "message": "Mint request accepted",
  "requestId": "mint_1699272062494_abc123",
  "status": "pending_mint",
  "estimatedTime": "2-5 minutes"
}
```

### Request Burn
```bash
POST /api/v1/burn
Content-Type: application/json

{
  "burnTxHash": "0x789def456...",
  "amount": "50.25",
  "doiAddress": "D8KpX2Ym5VzQr3LmNn4bCvR9sH1tE6wX2fG9hK4m"
}
```

### Check Request Status
```bash
GET /api/v1/status/{requestId}
```

**Response:**
```json
{
  "id": "mint_1699272062494_abc123",
  "type": "mint",
  "status": "completed",
  "amount": 100.5,
  "mintTxHash": "0xabc123...",
  "createdAt": "2025-11-06T10:30:00.000Z",
  "updatedAt": "2025-11-06T10:35:00.000Z"
}
```

## 🏗️ Smart Contract Interaction

### Contract ABI (Main functions)
```solidity
// Minting (custodians only)
function mint(address to, uint256 amount, string memory doiTxHash) external

// Burning (any user)
function burn(uint256 amount, string memory doiAddress) external

// Check processed transactions
function isDoiTxProcessed(string memory doiTxHash) external view returns (bool)

// Reserve information
function totalSupply() external view returns (uint256)
function totalReserves() external view returns (uint256)
function getBackingRatio() external view returns (uint256)
```

### Interaction Examples

#### JavaScript (ethers.js)
```javascript
const { ethers } = require('ethers');

// Contract connection
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Mint wDOI (custodian only)
const mintTx = await contract.mint(
  '0x742d35Cc65C7a6123e18EBA0DA27Ad60DCD9F0dd', // recipient
  ethers.parseEther('100'),                      // amount (100 wDOI)
  'doi_tx_hash_123'                             // DOI transaction hash
);
await mintTx.wait();

// Burn wDOI (any user)
const burnTx = await contract.burn(
  ethers.parseEther('50'),                      // amount (50 wDOI)
  'D8KpX2Ym5VzQr3LmNn4bCvR9sH1tE6wX2fG9hK4m' // DOI address
);
await burnTx.wait();

// Check reserves
const totalSupply = await contract.totalSupply();
const totalReserves = await contract.totalReserves();
const backingRatio = await contract.getBackingRatio();

console.log('Supply:', ethers.formatEther(totalSupply));
console.log('Reserves:', ethers.formatEther(totalReserves));
console.log('Ratio:', ethers.formatEther(backingRatio));
```

## 📋 Step-by-Step Scenarios

### Scenario 1: Merchant requests mint
1. **Client sends DOI** to custodial wallet
2. **Merchant verifies** DOI transaction in Doichain
3. **Merchant makes API request:**
   ```bash
   curl -X POST http://localhost:3001/api/v1/mint \
     -H "Content-Type: application/json" \
     -d '{
       "doiTxHash": "doi_real_tx_hash",
       "amount": "100",
       "recipientAddress": "0x742d35Cc65C7a6123e18EBA0DA27Ad60DCD9F0dd"
     }'
   ```
4. **System processes** mint automatically
5. **Client receives** wDOI in wallet

### Scenario 2: User burns wDOI
1. **User calls** burn() on contract:
   ```javascript
   await contract.burn(
     ethers.parseEther("50"),
     "D8KpX2Ym5VzQr3LmNn4bCvR9sH1tE6wX2fG9hK4m"
   );
   ```
2. **Custodian sees** burn event in dashboard
3. **Custodian sends** DOI to specified address
4. **User receives** DOI in Doichain wallet

### Scenario 3: Regular trading on Uniswap
1. **User goes** to app.uniswap.org
2. **Selects** wDOI token by address `0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72`
3. **Trades** like regular ERC20 token
4. **Receives/sells** wDOI instantly

## 🛠️ For Developers

### Local Development
```bash
# Frontend
cd web-app
npm run dev  # http://localhost:5173

# Backend
cd wdoi-backend
npm start    # http://localhost:3001

# Smart Contracts
npm run compile          # Compilation
npm run deploy:sepolia   # Testnet deployment
```

### Environment Variables
```bash
# Frontend (.env)
VITE_WDOI_TOKEN_ADDRESS=0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72
VITE_AUTHORIZED_MERCHANTS=0x60eAe063F1Fd429814cA4C65767fDF0d8991506E
VITE_AUTHORIZED_CUSTODIANS=0x60eAe063F1Fd429814cA4C65767fDF0d8991506E

# Backend (.env)
PRIVATE_KEY=77fb262ea751fe74c48e7108bb49e008cca31113c84f13844c6821489c6258f7
WDOI_CONTRACT_ADDRESS=0xA2B6c1a7EFB3dFa75E2d9DF1180b02668c06da72
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/a9780544d8f2417cbb93c4da5ed9a954
```

### Role Customization
```javascript
// Add merchant (admin only)
await contract.addMerchant('0xNewMerchantAddress');

// Add custodian (admin only)
await contract.addCustodian('0xNewCustodianAddress');

// Check role
const hasCustodianRole = await contract.hasRole(
  await contract.CUSTODIAN_ROLE(),
  userAddress
);
```

## 🔍 Monitoring and Debugging

### Backend Logs
```bash
# Watch logs in real-time
tail -f wdoi-backend/logs/app.log

# Or in console (if not in background)
cd wdoi-backend && npm run dev
```

### Smart Contract Events
```javascript
// Listen to mint events
contract.on('Mint', (to, amount, doiTxHash, custodian) => {
  console.log(`Minted ${ethers.formatEther(amount)} wDOI for ${to}`);
});

// Listen to burn events
contract.on('Burn', (from, amount, doiAddress, initiator) => {
  console.log(`Burned ${ethers.formatEther(amount)} wDOI from ${from}`);
});
```

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Reserves info
curl http://localhost:3001/api/v1/reserves

# Status check (use real requestId)
curl http://localhost:3001/api/v1/status/mint_1699272062494_abc123
```

## ❓ FAQ

### Q: Why isn't my mint request being processed?
**A:** Check:
- DOI transaction has 6+ confirmations
- Custodian wallet has enough ETH for gas
- DOI transaction wasn't already processed

### Q: How do I get custodian/merchant role?
**A:** Contact the system administrator. They can add your address through `addCustodian()` or `addMerchant()` functions

### Q: Can I cancel a mint/burn request?
**A:** After processing starts - no. Make sure data is correct before sending.

### Q: Where can I trade wDOI?
**A:**
- **Recommended**: Uniswap (best liquidity)
- **Alternative**: Direct interface on our website
- **Coming soon**: Other DEX and CEX

### Q: Is it safe to store wDOI?
**A:** Yes, wDOI is a standard ERC20 token, fully backed 1:1 by real DOI in custodial reserves.

## 🆘 Support

### Technical Support
- **Email**: tech-support@wdoi.example
- **Telegram**: @wdoi_support
- **GitHub Issues**: https://github.com/wdoi/issues

### Documentation
- **Smart Contract**: Etherscan + source code
- **API Docs**: Postman Collection (link)
- **Architecture**: Technical Whitepaper

### Community
- **Discord**: wDOI Community Server
- **Twitter**: @wDOI_official
- **Reddit**: r/WrappedDoichain

---

**🎯 Ready to start? Go to [Quick Start](#-quick-start)!**