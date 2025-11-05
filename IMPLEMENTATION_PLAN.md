# wDOI Implementation Plan - Operator Model

## 🎯 System Architecture (Final)

### **Roles & Access:**
- **Merchants** → Create wDOI via restricted dashboard
- **Custodians** → Confirm operations, hold DOI reserves  
- **Users** → Buy/sell wDOI for USDT via Uniswap/DEX

### **User Experience:**
```
Users never see DOI bridging → Only trade ready wDOI tokens
├── Buy wDOI with USDT/ETH on Uniswap
├── Use wDOI in any DeFi protocol
├── Sell wDOI back to USDT/ETH
└── MetaMask Swaps finds token automatically
```

## 📋 Implementation Phases

### ✅ Phase 0: Foundation (Completed)
- [x] Smart contracts deployed (WrappedDoichainCustodial.sol)
- [x] SvelteKit frontend architecture
- [x] Swap interface for trading
- [x] Liquidity management interface
- [x] Wallet integration (MetaMask)

### 🔄 Phase 1: Uniswap Integration (CURRENT)
- [ ] **Create wDOI/USDT pool on Uniswap V3**
- [ ] Add initial liquidity to pool
- [ ] Test trading functionality
- [ ] Verify MetaMask Swaps integration
- [ ] Update website to show Uniswap trading

### 📊 Phase 2: Operator Dashboards
- [ ] **Merchant Dashboard** (`/merchant`)
  - [ ] DOI balance tracking on custodian addresses
  - [ ] wDOI inventory management
  - [ ] Create mint/burn requests
  - [ ] Transaction history
  - [ ] Upload DOI transaction proofs
- [ ] **Custodian Dashboard** (`/custodian`)
  - [ ] Confirm mint/burn requests
  - [ ] Multi-signature operations
  - [ ] Reserve management
  - [ ] Security monitoring
- [ ] **Role-based authentication** system

### 🌐 Phase 3: Public Transparency
- [ ] **Public Reserves Page** (`/reserves`)
  - [ ] Real-time DOI reserves display
  - [ ] Total wDOI supply tracking
  - [ ] Reserve ratio monitoring (>100%)
  - [ ] Custodian address verification
  - [ ] Public transaction history
- [ ] Remove bridge from public navigation
- [ ] Focus main site on trading experience

### 🚀 Phase 4: Ecosystem Growth
- [ ] **DEX Aggregator Integration**
  - [ ] Submit to 1inch
  - [ ] Integration with Paraswap
  - [ ] Matcha listing
- [ ] **Listing & Marketing**
  - [ ] CoinGecko submission
  - [ ] CoinMarketCap listing
  - [ ] DeFi protocol partnerships
- [ ] **Advanced Features**
  - [ ] Mobile-optimized interface
  - [ ] Analytics dashboard
  - [ ] API for third parties

## 🎯 Current Priority: Uniswap Pool Creation

### Immediate Steps:
1. **Deploy wDOI/USDT pool** on Uniswap V3
2. **Add initial liquidity** (test amounts)
3. **Test trading** via Uniswap interface
4. **Verify MetaMask integration**
5. **Update website** to show Uniswap links

### Success Metrics:
- ✅ Pool created and liquid
- ✅ Trading works via MetaMask Swaps
- ✅ Price discovery functional
- ✅ Users can find wDOI automatically

## 🔧 Technical Implementation Notes

### Smart Contract Integration:
```solidity
Current: Custom wDOIUSDTPool.sol (for testing)
Target: Uniswap V3 Pool (for production)
Migration: Dual support initially
```

### Frontend Updates:
```
Remove: /bridge from public nav
Keep: /swap (redirect to Uniswap)
Add: /reserves (transparency)
Restrict: /merchant, /custodian (auth required)
```

### Operational Workflow:
```
1. Merchant sends DOI → Custodian
2. Merchant creates mint request
3. Custodians confirm → wDOI minted
4. Merchant adds wDOI to Uniswap pool
5. Users trade wDOI ↔ USDT via Uniswap
6. Public tracks reserves via /reserves page
```

## 💡 Business Model

### Revenue Streams:
- **Merchant fees** for wrapping services
- **Arbitrage opportunities** between DOI/wDOI
- **Liquidity provider rewards** from trading fees

### User Benefits:
- **Simple trading** experience (no bridging complexity)
- **Immediate liquidity** via established DEX
- **DeFi compatibility** for lending, farming, etc.
- **Professional backing** with transparent reserves

---

**Next Action: Start with Uniswap V3 pool creation** 🏊‍♂️