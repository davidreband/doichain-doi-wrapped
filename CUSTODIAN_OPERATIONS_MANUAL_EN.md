# 📚 wDOI CUSTODIAN OPERATIONS MANUAL

## 🎯 Executive Summary

This comprehensive manual covers the centralized custodian system management for wDOI (Wrapped Doichain) token. The system provides:

- ✅ **Automatic reserve auditing** every 24 hours
- ✅ **Real-time liquidity monitoring** 
- ✅ **Emergency pause system** with detailed reasons
- ✅ **Rate limiting** for security
- ✅ **DOI balance verification** before each mint operation

---

## 🚀 QUICK START

### 1. Contract Deployment
```bash
# Deploy wDOI V3 with enhanced security
npm run deploy:v3:sepolia

# Check deployment status
npm run check-liquidity:sepolia
```

### 2. Initial Setup
```bash
# Declare initial reserves (1000 DOI)
npx hardhat console --network sepolia
> const wdoi = await ethers.getContractAt("WrappedDoichainV3", "CONTRACT_ADDRESS")
> await wdoi.declareReserves(ethers.parseEther("1000"))

# Add yourself as custodian (if needed)
> await wdoi.addCustodian("YOUR_ADDRESS")
```

### 3. Monitoring
Open enhanced custodian dashboard: `http://localhost:5173/custodian/enhanced`

---

## 📊 DAILY OPERATIONS

### Morning Check (9:00 AM)
```bash
# 1. Check pool status
npm run check-liquidity:sepolia

# 2. Check reserves and audit
# Open dashboard and verify:
# - Reserve Status (should be 100%+)
# - Audit Required (should be false)
# - Emergency Status (should be inactive)
```

### Alert Response
```javascript
// Alert: Low Liquidity (< 500 wDOI in pool)
npm run manage-liquidity:sepolia mint-and-add 1000 doi_tx_hash_123 5000

// Alert: Price Deviation (> 5% from $1)
npm run manage-liquidity:sepolia rebalance

// Alert: Large Purchase (> 100 wDOI)
// Check if additional liquidity is needed
npm run check-liquidity:sepolia
```

### Evening Check (6:00 PM)
- Review dashboard notifications
- Check daily trading volume
- Plan reserve replenishment for next day

---

## ⚠️ EMERGENCY PROCEDURES

### 1. Critical Liquidity Shortage (< 100 wDOI)
```bash
# IMMEDIATELY add liquidity
npm run manage-liquidity:sepolia mint-and-add 2000 doi_tx_emergency CURRENT_DOI_BALANCE
```

### 2. Suspicious Activity
```bash
# Activate emergency pause
npx hardhat console --network sepolia
> const wdoi = await ethers.getContractAt("WrappedDoichainV3", "CONTRACT_ADDRESS")
> await wdoi.activateEmergencyPause("Suspicious trading activity detected")
```

### 3. Technical Issues
```bash
# Emergency liquidity withdrawal
npm run manage-liquidity:sepolia emergency-withdraw LP_AMOUNT
```

---

## 🔧 TECHNICAL MANAGEMENT

### Updating Limits
```javascript
// Increase daily limits (e.g., to 20,000 wDOI)
await wdoi.setRateLimits(
    ethers.parseEther("20000"), // mint limit
    ethers.parseEther("20000")  // burn limit
)
```

### Reserve Management
```javascript
// Update declared reserves after receiving new DOI
await wdoi.declareReserves(ethers.parseEther("NEW_TOTAL_DOI_AMOUNT"))
```

### Adding New Merchants
```javascript
await wdoi.addMerchant("MERCHANT_ADDRESS")
```

---

## 📈 PERFORMANCE MONITORING

### Key Metrics to Track:

1. **Reserve Ratio** - should be 100%+
2. **wDOI Pool Balance** - recommended 500+ wDOI
3. **Price Deviation** - should be < 5% from $1.00
4. **Daily Volume** - track usage growth
5. **LP Earnings** - fee profitability

### Weekly Reports:
- Total exchange volume
- Earned LP commissions  
- Number of new users
- Liquidity efficiency

---

## 🎛️ USER INTERFACE

### Enhanced Custodian Dashboard (`/custodian/enhanced`)

**Main Sections:**
1. **Status Grid** - current status of reserves, limits, emergencies
2. **Live Notifications** - alerts about purchases and low liquidity
3. **Operations Panel** - manage reserves, emergency pauses, limits

**Automatic Notifications:**
- 🔴 Large Purchase (>100 wDOI) - requires liquidity attention
- 🟠 Low Liquidity (<500 wDOI) - need to add liquidity  
- 🔴 Critical Liquidity (<100 wDOI) - urgently add liquidity

---

## 💰 ECONOMIC MODEL

### Revenue Sources:
1. **LP fees**: 0.3% from each trade
2. **Spread trading**: buy low, sell high
3. **Stabilization operations**: price maintenance

### Expected Profitability:
```
With pool 2000 wDOI + 2000 USDT:
Daily volume: 1000 USDT
Daily commission: 3 USDT  
Annual yield: ~27% of invested capital
```

---

## 🔒 SECURITY AND COMPLIANCE

### Mandatory Checks:
- ✅ Daily reserve audit (automatic)
- ✅ DOI balance verification before mint
- ✅ Rate limiting for large operations
- ✅ Multi-layer transaction monitoring

### Security Measures:
- 🔐 OpenZeppelin AccessControl for roles
- 🛡️ ReentrancyGuard for attack prevention
- ⏸️ Pausable for emergency stops
- 🔍 Comprehensive event logging

---

## 📞 SUPPORT AND TROUBLESHOOTING

### Common Issues:

**Q: Dashboard shows "Contract not found"**
A: Check contract address in `web-app/src/lib/config/addresses.js`

**Q: Transaction fails to execute**  
A: Check ETH balance for gas fees and token allowances

**Q: Pool Monitor not working**
A: Ensure WDOI_USDT_POOL is correctly configured in env variables

**Q: High price impact during trading**
A: Add more liquidity to pool to reduce slippage

### Support Contacts:
- **Technical Support**: tech@doichain.org
- **Security Issues**: security@doichain.org  
- **General Inquiries**: info@doichain.org

---

## 🗓️ DEVELOPMENT ROADMAP

### Short-term Improvements (1-3 months):
- [ ] Automatic pool rebalancing
- [ ] Integration with additional DEXes
- [ ] SMS/Email notifications for critical events

### Long-term Improvements (6-12 months):  
- [ ] Multi-custodian system with DAO governance
- [ ] Hardware security module (HSM) integration
- [ ] Automated insurance system

---

## ✅ PRODUCTION READINESS CHECKLIST

### Before Launch Ensure:
- [ ] ✅ wDOI V3 contract deployed and verified
- [ ] ✅ Liquidity pool created with initial liquidity
- [ ] ✅ Enhanced dashboard configured and working
- [ ] ✅ Pool monitoring activated
- [ ] ✅ Emergency procedures tested
- [ ] ✅ Team trained on system usage

### Post-Launch Monitoring:
- [ ] Check every 4 hours during first week
- [ ] Daily checks after stabilization
- [ ] Weekly system efficiency assessment

---

## 🎛️ COMMAND REFERENCE

### Deployment Commands:
```bash
npm run deploy:v3:sepolia          # Deploy wDOI V3 contract
npm run deploy:custodial:sepolia   # Deploy custodial contract
```

### Monitoring Commands:
```bash
npm run check-liquidity:sepolia    # Check pool status
npm run manage-liquidity add 1000 1000 # Add liquidity
npm run manage-liquidity rebalance # Rebalance pool
```

### Emergency Commands:
```bash
npm run manage-liquidity emergency-withdraw 1000
```

---

**🎉 Congratulations! Your wDOI centralized custodian system is ready for production.**

**Remember: stability, security, and transparency are the core principles of successful custody operations.**