# wDOI Tokenomics - WBTC-inspired Model

## Overview

wDOI (Wrapped Doichain) follows the proven WBTC model, providing a bridge between Doichain Network and Ethereum ecosystem. This design ensures security, transparency, and decentralization while maintaining full backing of wDOI tokens.

## Key Roles

### 1. 🏦 Custodians
- **Responsibility**: Hold DOI reserves and manage minting/burning operations
- **Requirements**: Multi-signature security, insurance, regular audits
- **Current**: Centralized custodian for initial phase
- **Future**: Multi-custodian network with DAO governance

### 2. 👨‍💼 Merchants
- **Responsibility**: Interface between users and custodians
- **Requirements**: KYC/AML compliance, bonding requirements
- **Function**: Process user requests for minting/burning wDOI

### 3. 👥 Users
- **Responsibility**: Hold and trade wDOI tokens
- **Access**: Direct trading on DEXs (Uniswap, etc.)
- **Interaction**: Request mint/burn through merchants

## Minting Process

### Step 1: DOI Deposit
```
User → Merchant: Request wDOI minting
Merchant → User: Provides DOI deposit address
User → Custodian: Sends DOI to custodial address
```

### Step 2: Confirmation & Minting
```
Custodian: Confirms DOI deposit on Doichain
Custodian → Smart Contract: Mints equivalent wDOI
Smart Contract → Merchant: Transfers wDOI
Merchant → User: Delivers wDOI tokens
```

### Technical Flow:
1. **DOI Deposit**: User sends DOI to custodial wallet
2. **Confirmation**: Custodian verifies deposit (6+ confirmations)
3. **Mint Request**: Custodian initiates mint transaction
4. **Token Delivery**: wDOI tokens sent to user's Ethereum address

## Burning Process

### Step 1: Burn Request
```
User → Merchant: Request DOI redemption
Merchant: Collects wDOI from user
Merchant → Burn Address: Sends wDOI to burn
```

### Step 2: DOI Release
```
Custodian: Verifies burn transaction
Custodian → User: Releases equivalent DOI
Blockchain: wDOI supply decreases
```

### Technical Flow:
1. **Burn Transaction**: wDOI sent to burn address (0x000...dead)
2. **Verification**: Custodian confirms burn on Ethereum
3. **DOI Release**: Equivalent DOI sent to user's Doichain address
4. **Supply Update**: Total wDOI supply decreases

## Reserve Management

### 1:1 Backing Guarantee
- **Principle**: Every wDOI backed by 1 DOI in reserve
- **Transparency**: Public reserve addresses
- **Verification**: Regular proof-of-reserves
- **Auditing**: Third-party audits of holdings

### Reserve Addresses
```javascript
// Doichain Network
DOI_CUSTODIAL_ADDRESS = "D8KpX2Ym5VzQr3LmNn4bCvR9sH1tE6wX2fG9hK4m"

// Ethereum Network  
WDOI_CONTRACT = "0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5"
BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD"
```

## User Experience

### For Traders
```
1. Buy wDOI on Uniswap/DEXs directly
2. No need to interact with mint/burn process
3. Standard ERC20 token experience
4. Immediate liquidity and trading
```

### For Institutions
```
1. Direct mint/burn through merchants
2. Large volume conversions
3. Customized service and support
4. Institutional-grade custody
```

## Security Model

### Multi-Signature Custody
- **Current**: 2-of-3 multisig for custodial operations
- **Future**: Enhanced with hardware security modules (HSMs)

### Smart Contract Security
- **Audited Contracts**: Professional security audits
- **Minimal Complexity**: Simple mint/burn functions only
- **Upgradeable**: Proxy pattern for future improvements

### Operational Security
- **Cold Storage**: Majority of DOI in cold wallets
- **Hot Wallet Limits**: Limited amounts for operational needs
- **Insurance**: Coverage for custodial risks

## Governance Roadmap

### Phase 1: Centralized (Current)
- Single custodian operation
- Manual mint/burn processes
- Basic transparency measures

### Phase 2: Multi-Custodian
- Multiple independent custodians
- Automated custody management
- Enhanced audit mechanisms

### Phase 3: DAO Governance (Future)
- Community-controlled merchant approval
- Decentralized custodian selection
- Tokenized governance rights

## Compliance & Legal

### Regulatory Framework
- **Merchants**: Licensed money transmitters
- **Custodians**: Qualified custody providers
- **Compliance**: KYC/AML for large transactions

### Risk Management
- **Insurance**: Comprehensive coverage
- **Audits**: Regular financial and security audits
- **Monitoring**: Real-time reserve monitoring

## Technical Integration

### Smart Contract Functions
```solidity
// Mint new wDOI (Custodian only)
function mint(address to, uint256 amount) external onlyCustodian

// Burn wDOI (Anyone can burn)
function burn(uint256 amount) external

// Check reserves (Public view)
function totalSupply() external view returns (uint256)
```

### API Endpoints
```javascript
// Reserve status
GET /api/reserves
// Mint request
POST /api/mint
// Burn request  
POST /api/burn
// Transaction status
GET /api/status/:txId
```

## Benefits Over Direct DOI

### 1. **DeFi Integration**
- Native compatibility with Ethereum DeFi protocols
- Automated market making (Uniswap)
- Lending/borrowing integration (Compound, Aave)

### 2. **Improved Liquidity**
- 24/7 trading availability
- Lower slippage on large trades
- Multiple exchange listings

### 3. **Better UX**
- Metamask integration
- Instant transfers (vs DOI confirmations)
- Standard ERC20 wallet support

### 4. **Programmability**
- Smart contract integration
- DeFi protocol composability
- Automated trading strategies

## Conclusion

wDOI brings Doichain to Ethereum while maintaining the security and transparency principles of the WBTC model. Users get the best of both worlds: Doichain's unique properties with Ethereum's DeFi ecosystem.

The phased approach ensures security and stability while building toward full decentralization through DAO governance.