# wBTC Model Implementation for wDOI

## 🎯 Goal: Build wDOI Bridge System Like wBTC

### wBTC Architecture Overview
```
Bitcoin Holders → Merchants → Custodians → wBTC Tokens
     ↓               ↓           ↓           ↓
   Send BTC    →  KYC/AML   →  Verify   →   Mint
```

### Our wDOI Architecture  
```
DOI Holders → Merchants → Custodians → wDOI Tokens
     ↓            ↓           ↓           ↓
   Send DOI  →  Process   →  Verify   →   Mint
```

## 🏗️ Current Smart Contract Status

### ✅ Already Implemented in WrappedDoichainCustodial.sol:

1. **Role System**
   ```solidity
   CUSTODIAN_ROLE ✅     // Multi-sig custodians holding DOI
   MERCHANT_ROLE ✅      // Authorized processors  
   DEFAULT_ADMIN_ROLE ✅ // System administrators
   ```

2. **Request System**
   ```solidity
   MintRequest ✅        // DOI → wDOI conversion
   BurnRequest ✅        // wDOI → DOI conversion
   ```

3. **Multi-Signature Confirmations**
   ```solidity
   requiredConfirmations ✅  // Default: 2 custodians
   mintConfirmations ✅      // Track custodian approvals
   burnConfirmations ✅      // Track burn approvals
   ```

4. **Proof of Reserves**
   ```solidity
   totalReserves ✅         // Total DOI held by custodians
   getReservesInfo() ✅     // Public reserve verification
   ```

## 🚧 What Needs to Be Built

### 1. Bridge Interface Component (/bridge page)
```
User Interface for:
├── DOI → wDOI (Wrapping)
│   ├── Submit DOI transaction hash
│   ├── Specify amount
│   └── Track request status
└── wDOI → DOI (Unwrapping)  
    ├── Burn wDOI tokens
    ├── Provide DOI address
    └── Monitor DOI release
```

### 2. Merchant Dashboard (/merchant)
```
Merchant Interface:
├── Process mint requests
├── Process burn requests  
├── View pending confirmations
└── Transaction management
```

### 3. Custodian Dashboard (/custodian)
```
Custodian Interface:
├── Confirm mint requests
├── Confirm burn requests
├── Manage DOI reserves
└── Cold storage monitoring
```

### 4. Public Transparency (/reserves)
```
Public Interface:
├── Real-time reserve status
├── Proof of reserves
├── Transaction history
└── Custodian information
```

## 🔄 wBTC Process Flow

### Wrapping Process (DOI → wDOI):
```
1. User sends DOI to custodian address
2. Merchant creates mint request with TX hash
3. Custodians verify DOI receipt (2+ confirmations)
4. wDOI automatically minted to user address
```

### Unwrapping Process (wDOI → DOI):
```
1. User submits burn request via merchant
2. wDOI tokens locked/burned
3. Custodians confirm and release DOI (2+ confirmations)  
4. DOI sent to user's Doichain address
```

## 📊 Implementation Priority

### Phase 1: Core Bridge Interface
- [ ] Create BridgeInterface.svelte component
- [ ] Add /bridge route to website
- [ ] Implement mint/burn request UI
- [ ] Add request status tracking

### Phase 2: Dashboard Interfaces  
- [ ] Merchant dashboard for request processing
- [ ] Custodian dashboard for confirmations
- [ ] Admin panel for system management

### Phase 3: Transparency & Monitoring
- [ ] Public proof of reserves page
- [ ] Real-time transaction monitoring
- [ ] Custodian reputation system
- [ ] Automated compliance reporting

### Phase 4: Production Hardening
- [ ] Multi-signature wallet integration
- [ ] Cold storage procedures
- [ ] Emergency pause mechanisms  
- [ ] Third-party audit integration

## 🎯 Key Differences from wBTC

### Advantages:
- ✅ **Simpler KYC** - Doichain is smaller ecosystem
- ✅ **Faster Processing** - Less regulatory overhead
- ✅ **Direct Integration** - Can optimize for DeFi use cases

### Adaptations:
- 🔄 **Merchant Role** - Can be more automated
- 🔄 **Custodian Network** - Smaller, trusted community
- 🔄 **Reserve Proof** - More frequent, automated verification

## 🚀 Next Steps

1. **Start with Phase 1** - Bridge Interface
2. **Test on Sepolia** - Verify all workflows  
3. **Security Audit** - Professional contract review
4. **Mainnet Deployment** - Production launch

The foundation (smart contracts) is already solid! 
Now we need to build the user interfaces and operational processes.