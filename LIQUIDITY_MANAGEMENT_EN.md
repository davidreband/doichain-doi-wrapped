# 🏦 wDOI LIQUIDITY SYSTEM - Comprehensive Guide

## 📖 What is Liquidity?

**Liquidity** is the availability of sufficient tokens in a trading pair to ensure smooth trading without significant price changes.

### For wDOI/USDT pool this means:
- **wDOI tokens** in the pool for selling to users
- **USDT tokens** in the pool for buying wDOI from users  
- **Stable price** during high-volume trading

---

## 🔄 How the Liquidity System Works

### 1. **Creating Liquidity Pool (LP)**
```
wDOI/USDT Pool = 1000 wDOI + 1000 USDT
Initial price: 1 wDOI = 1 USDT
```

### 2. **Users buy wDOI with USDT**
```
Before: Pool = 1000 wDOI + 1000 USDT
Purchase: 100 USDT → receive ~95 wDOI
After: Pool = 905 wDOI + 1100 USDT
New price: 1 wDOI ≈ 1.21 USDT
```

### 3. **Problem: Low wDOI in pool**
- When wDOI becomes scarce → price increases dramatically
- Users receive less wDOI for their USDT
- Trading becomes unprofitable

---

## 🎯 CUSTODIAN'S ROLE IN LIQUIDITY

### **Main Task:**
Maintain stable wDOI price ≈ 1 USDT by replenishing liquidity

### **How custodian replenishes liquidity:**

1. **Received DOI from user** → creates wDOI
2. **Adds wDOI to pool** → price stabilizes
3. **Receives LP tokens** → earns from trading fees

---

## 🛠️ PRACTICAL ORGANIZATION SCHEME

### **Phase 1: Infrastructure Setup**

#### A) Contract Deployment:
```bash
# 1. Deploy wDOI V3 contract
npx hardhat run scripts/deploy-v3.js --network sepolia

# 2. Deploy Uniswap V2 pool
npx hardhat run scripts/create-liquidity-pool.js --network sepolia
```

#### B) Initial liquidity:
```javascript
// Custodian adds initial liquidity
const initialLiquidity = {
    wdoi: ethers.parseEther("1000"),  // 1000 wDOI
    usdt: ethers.parseUnits("1000", 6) // 1000 USDT
}
```

### **Phase 2: Real-time Monitoring**

#### A) Automatic alerts:
```javascript
// Pool Monitor in web-app implemented
// Alerts when:
- wDOI in pool < 500 tokens (warning)
- wDOI in pool < 100 tokens (critical)
- Large purchase >100 wDOI (requires replenishment)
```

#### B) Custodian dashboard shows:
- Current wDOI/USDT amounts in pool
- Current wDOI price
- Recent large purchases
- Recommended wDOI amount for replenishment

### **Phase 3: Operational Process**

#### When user wants to buy wDOI:

**Option A: Through DEX (automatic)**
1. User buys wDOI with USDT on Uniswap
2. Pool Monitor notifies custodian
3. If liquidity is low → custodian replenishes

**Option B: Through custodian (manual)**
1. User sends DOI to custodian
2. Custodian creates wDOI through contract
3. Custodian adds wDOI to pool
4. User receives wDOI

---

## 💰 ECONOMIC MODEL

### **Custodian Revenue:**
1. **LP fees**: 0.3% from each trade in pool
2. **Arbitrage opportunities**: buy low, sell high
3. **Reserve stability**: maintaining 1:1 backing

### **Custodian Expenses:**
1. **Gas fees** for adding liquidity
2. **Temporary locking** of DOI reserves
3. **Impermanent loss risk** (temporary losses)

### **Example calculation:**
```
Pool: 1000 wDOI + 1000 USDT
Daily trading volume: 5000 USDT
Custodian commission: 5000 * 0.3% = 15 USDT/day
Annual income: 15 * 365 = 5,475 USDT
ROI: 5,475 / 2000 = 274% annually
```

---

## 🔧 TECHNICAL SCRIPTS FOR CUSTODIAN

Created scripts for liquidity management automation:

### 1. **Pool status check**
### 2. **Automatic liquidity addition**  
### 3. **Optimal wDOI amount calculator**
### 4. **Profitability monitoring**

---

## 🚨 ALERTS AND NOTIFICATIONS

### **Critical situations:**
- wDOI in pool < 100 → URGENT replenishment
- wDOI price > 1.2 USDT → add liquidity
- Large purchase > 500 wDOI → check reserves

### **Warnings:**
- wDOI in pool < 500 → plan replenishment
- Daily volume > usual → prepare reserves

---

## 📊 ANALYTICS AND REPORTING

### **Daily metrics:**
- Trading volume in pool
- Earned LP commissions
- wDOI price changes
- Number of new buyers

### **Weekly reports:**
- Total TVL (Total Value Locked)
- Liquidity efficiency
- Comparison with other stablecoins

---

## 🎯 MANAGEMENT STRATEGIES

### **Conservative strategy:**
- Maintain large liquidity (2000+ wDOI)
- Quick response to purchases
- Minimal price fluctuation

### **Optimized strategy:**
- Dynamic liquidity management
- Use arbitrage opportunities
- Automation through scripts

### **Scalable strategy:**
- Multiple pools on different DEXes
- Automatic rebalancing
- Integration with other protocols

---

## 🏁 STEP-BY-STEP LAUNCH PLAN

### **Week 1: Preparation**
- [ ] Deploy contracts
- [ ] Setup monitoring
- [ ] Prepare initial reserves

### **Week 2: Testing**  
- [ ] Create test pool
- [ ] Test alerts
- [ ] Debug scripts

### **Week 3: Launch**
- [ ] Add initial liquidity
- [ ] Activate monitoring
- [ ] Announce launch

### **Week 4: Optimization**
- [ ] Analyze first data
- [ ] Adjust parameters
- [ ] Improve strategy

---

## ❓ FAQ

**Q: How much initial liquidity is needed?**
A: Minimum 1000 wDOI + 1000 USDT, optimally 5000+ each

**Q: How often should liquidity be replenished?**
A: Upon receiving alerts or when price deviates >5%

**Q: What to do if DOI reserves are insufficient?**
A: Temporarily halt new wDOI creation until replenishment

**Q: How to protect against impermanent loss?**
A: Maintain stable 1:1 price, react quickly to deviations

This system ensures stable wDOI trading and steady custodian income!