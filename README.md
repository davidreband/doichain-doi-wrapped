# Wrapped Doichain (wDOI)

A Hardhat-based Ethereum smart contract project for creating a wrapped version of Doichain tokens.

## Overview

This project implements a comprehensive wrapped token ecosystem for DOI tokens from the Doichain blockchain:

1. **Bridge Model** (`WrappedDoichain.sol`) - Automated bridge with mint/burn functionality
2. **Custodial Model** (`WrappedDoichainCustodial.sol`) - WBTC-style custodial architecture with cold storage
3. **USDT Liquidity Pool** (`wDOIUSDTPool.sol`) - AMM for direct USDT ↔ wDOI trading
4. **Mock USDT** (`MockUSDT.sol`) - Test token for development and testing
5. **MetaMask Interface** (`frontend/index.html`) - Web UI for trading wDOI with USDT

The system provides secure token wrapping with **instant purchasing capability through MetaMask** without complex conversion requests.

### Key Features

#### Bridge Model Features
🌉 **Automated Bridge**: Direct mint/burn operations with blockchain confirmations
🔐 **Role-Based Access**: Bridge operators and administrators
⚡ **Fast Operations**: Immediate execution upon confirmation

#### Custodial Model Features (WBTC-style)
🏛️ **Custodial Architecture**: Licensed institutions hold DOI in cold storage
🔐 **Multisig Security**: Multiple custodian confirmations required
🏪 **Merchant System**: KYC/AML compliant token issuance
❄️ **Cold Storage**: Offline wallet security for underlying assets
📊 **Proof of Reserves**: Real-time verification of backing assets

#### USDT Liquidity Pool Features (NEW! 🚀)
🔄 **Instant Swaps**: Trade wDOI ↔ USDT directly through MetaMask
🏊 **AMM Protocol**: Automated Market Maker with x*y=k formula
💰 **LP Rewards**: Earn 0.3% fees by providing liquidity
📱 **MetaMask Integration**: Bidirectional trading in your browser
🛡️ **Slippage Protection**: Configurable slippage tolerance (5% default)
💧 **USDT Pairing**: Stable trading against USDT for price stability

#### Common Features
⏸️ **Emergency Pause**: Ability to halt operations in emergency situations
📊 **Statistics Tracking**: Monitor total deposits and withdrawals
🛡️ **Security**: OpenZeppelin-based implementation with comprehensive testing
🔍 **Event Logging**: Full audit trail of all operations

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd doichain-doi-wrapped
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit the `.env` file with your actual values:
- Get API keys from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- Get Etherscan API key from [Etherscan](https://etherscan.io/apis)
- Add your private key (keep it secure!)

## Usage

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Local Network
```bash
# Start local Hardhat network
npx hardhat node

# In another terminal, deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Testnet (Sepolia)
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deploy to Mainnet
```bash
npx hardhat run scripts/deploy.js --network mainnet
```

### Verify Contract on Etherscan
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Project Structure

```
doichain-doi-wrapped/
├── contracts/                          # Solidity smart contracts
│   ├── WrappedDoichain.sol            # Bridge model ERC20 token
│   ├── WrappedDoichainCustodial.sol   # Custodial model (WBTC-style)
│   ├── wDOIUSDTPool.sol               # USDT/wDOI AMM liquidity pool
│   └── MockUSDT.sol                   # Mock USDT token for testing
├── scripts/                           # Deployment and utility scripts
│   ├── deploy.js                      # Bridge model deployment
│   ├── deploy-custodial.js            # Custodial model deployment
│   ├── test-deploy.js                 # USDT pool deployment
│   ├── add-liquidity.js               # Add initial liquidity
│   └── send-tokens-to-user.js         # Send test tokens
├── test/                              # Contract tests
│   ├── WrappedDoichain.test.js        # Bridge model tests
│   ├── WrappedDoichainCustodial.test.js # Custodial model tests
│   └── wDOIUSDTPool.test.js           # USDT liquidity pool tests
├── frontend/                          # MetaMask web interface
│   └── index.html                     # wDOI ↔ USDT trading interface
├── docs/                              # Documentation
│   ├── CUSTODIAL_ARCHITECTURE.md     # Custodial model docs
│   ├── LIQUIDITY_POOL_ARCHITECTURE.md # Pool architecture
│   └── TECHNICAL_SPECIFICATION_RU.md # Russian tech specs
├── deployments/                       # Deployment artifacts
├── hardhat.config.js                  # Hardhat configuration
├── .env.example                       # Environment variables template
└── README.md                          # This file
```

## Contract Features

The `WrappedDoichain` contract implements:

### Core Functionality
- **ERC20 Standard**: Full ERC20 compatibility with transfer, approve, allowance
- **Mint/Burn**: Create wDOI when DOI is deposited, burn wDOI when DOI is withdrawn
- **Bridge Management**: Add/remove authorized bridge contracts
- **Access Control**: Role-based permissions (Admin, Bridge, Pauser roles)

### Token Properties
- **Name**: "Wrapped Doichain"
- **Symbol**: "wDOI"  
- **Decimals**: 18
- **Supply**: Dynamic based on deposits/withdrawals

### Security Features
- **Pausable**: Emergency pause functionality
- **Duplicate Protection**: Prevents double-processing of deposits
- **Role Verification**: Only authorized bridges can mint/burn
- **Event Logging**: Comprehensive event emission for transparency

### Bridge Operations
```solidity
// Deposit DOI → Mint wDOI
function deposit(address user, uint256 amount, string doichainTxHash)

// Withdraw DOI ← Burn wDOI  
function withdraw(address user, uint256 amount, string doichainAddress)
```

## Development

### Available Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Run only USDT pool tests
npx hardhat test test/wDOIUSDTPool.test.js

# Deploy to local network
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# Deploy Bridge Model to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy Custodial Model to testnet  
npx hardhat run scripts/deploy-custodial.js --network sepolia

# Deploy USDT Liquidity Pool (NEW! 🚀)
npx hardhat run scripts/test-deploy.js --network localhost

# Deploy to mainnet  
npx hardhat run scripts/deploy.js --network mainnet
npx hardhat run scripts/deploy-custodial.js --network mainnet
npx hardhat run scripts/deploy-pool.js --network mainnet

# Verify on Etherscan
npx hardhat verify --network sepolia DEPLOYED_ADDRESS "ADMIN_ADDRESS" "[]"

# Manage bridges
npx hardhat run scripts/manage-bridges.js list
npx hardhat run scripts/manage-bridges.js add 0x1234...
npx hardhat run scripts/manage-bridges.js remove 0x1234...
```

### Trade wDOI ↔ USDT with MetaMask (NEW! 🚀)

**Quick Start:**
1. Start local Hardhat network: `npx hardhat node`
2. Deploy contracts: `npx hardhat run scripts/test-deploy.js`
3. Add liquidity: `npx hardhat run scripts/add-liquidity.js`
4. Send test tokens: `npx hardhat run scripts/send-tokens-to-user.js`
5. Open `frontend/index.html` in your browser
6. Connect MetaMask and trade wDOI ↔ USDT instantly!

**Features:**
- 🔗 **One-Click Connection**: Connect MetaMask wallet
- 💰 **Real-Time Balances**: View USDT and wDOI balances
- 📊 **Live Pricing**: See current wDOI/USDT exchange rate
- 🔄 **Bidirectional Swaps**: Trade wDOI ↔ USDT in both directions
- 🛡️ **Slippage Protection**: 5% slippage tolerance
- 📱 **Mobile Friendly**: Works on desktop and mobile browsers
- ⇅ **Direction Toggle**: Switch between USDT→wDOI and wDOI→USDT

```bash
# After deploying contracts, simply open:
firefox frontend/index.html
# or
chrome frontend/index.html
```

### Testing

The project includes comprehensive tests covering:

**Bridge & Custodial Models (28 tests):**
- Contract deployment and initialization
- Bridge management (add/remove)
- Deposit functionality with validation
- Withdrawal functionality with validation  
- Pause/unpause emergency controls
- ERC20 standard compliance
- Access control and permissions
- Statistical tracking

**USDT Liquidity Pool (20 tests):**
- AMM functionality and price calculations
- USDT ↔ wDOI swap operations
- Liquidity provision and removal
- Fee collection and distribution (0.3%)
- Slippage protection and error handling
- Administrative controls and emergency functions

Run all tests: `npx hardhat test`

### Network Configuration

The project is configured for:
- **Hardhat Network** (local development)
- **Sepolia Testnet** (testing)
- **Ethereum Mainnet** (production)

## Security Considerations

⚠️ **Important Security Notes:**

- Never commit your `.env` file to version control
- Keep your private keys secure
- Test thoroughly on testnets before mainnet deployment
- Consider using a multisig wallet for mainnet deployments
- Audit contracts before production use

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the ISC License.

## Usage Example

```javascript
const WrappedDoichain = await ethers.getContractFactory("WrappedDoichain");
const contract = WrappedDoichain.attach(DEPLOYED_ADDRESS);

// Add a bridge (admin only)
await contract.addBridge(bridgeAddress);

// Deposit DOI → Mint wDOI (bridge only)
await contract.connect(bridge).deposit(
  userAddress, 
  ethers.parseEther("100"), 
  "doichain_tx_hash_123"
);

// Withdraw DOI ← Burn wDOI (bridge only)  
await contract.connect(bridge).withdraw(
  userAddress,
  ethers.parseEther("50"),
  "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
);

// Standard ERC20 operations
await contract.connect(user).transfer(recipient, amount);
await contract.connect(user).approve(spender, amount);
```

## Bridge Architecture

```
Doichain Network          Ethereum Network
      │                        │
   [DOI] ──── Lock ────► [Bridge Service] ────► Mint [wDOI]
      │                        │
   [DOI] ◄──── Release ──── [Bridge Service] ◄──── Burn [wDOI]
```

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Support

For questions and support, please open an issue in the GitHub repository.