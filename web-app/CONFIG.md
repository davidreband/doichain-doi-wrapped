# 🔧 Configuration Guide

## Environment Configuration

### Setup Instructions

1. **Copy environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Update addresses in `.env.local`:**
   ```bash
   # Core tokens
   VITE_WDOI_TOKEN_ADDRESS=0x3e67e32FeE4FA2788672B856fB22670c63Bd0ac5
   VITE_USDT_TOKEN_ADDRESS=0x584d5D62adaa8123E1726777AA6EEa154De6c76f
   
   # Add your authorized addresses
   VITE_AUTHORIZED_MERCHANTS=0xYourAddress1,0xYourAddress2
   VITE_AUTHORIZED_CUSTODIANS=0xYourCustodianAddress
   VITE_AUTHORIZED_ADMINS=0xYourAdminAddress
   ```

## 👥 Adding New Authorized Users

### Method 1: Environment Variables (.env.local)
```bash
# Merchants (comma-separated)
VITE_AUTHORIZED_MERCHANTS=0x60eAe063F1Fd429814cA4C65767fDF0d8991506E,0x742d35Cc65C7a6123e18EBA0DA27Ad60DCD9F0dd,0xNEW_MERCHANT_ADDRESS

# Custodians
VITE_AUTHORIZED_CUSTODIANS=0x60eAe063F1Fd429814cA4C65767fDF0d8991506E,0xNEW_CUSTODIAN_ADDRESS

# Admins  
VITE_AUTHORIZED_ADMINS=0x60eAe063F1Fd429814cA4C65767fDF0d8991506E,0xNEW_ADMIN_ADDRESS
```

### Method 2: Smart Contract (Production)
1. Deploy MerchantRegistry contract
2. Update contract address:
   ```bash
   VITE_MERCHANT_REGISTRY_ADDRESS=0xYourDeployedContractAddress
   ```
3. Use contract functions to manage users

## 🌐 Network Configuration

### Sepolia Testnet (Current)
```bash
VITE_NETWORK_NAME=sepolia
VITE_CHAIN_ID=0xaa36a7
```

### Mainnet (Production)
```bash
VITE_NETWORK_NAME=mainnet  
VITE_CHAIN_ID=0x1
# Update all token addresses to mainnet versions
```

## 📋 File Structure

```
/src/lib/config/
├── addresses.js          # Central configuration loader
│
/.env                     # Default values (committed)
/.env.example            # Template (committed)  
/.env.local              # Your overrides (not committed)
```

## 🔄 Migration from Hardcoded

The system automatically detects configuration method:

1. **Environment Mode** (Current): Loads from `.env` files
2. **Contract Mode** (Production): Reads from blockchain when `VITE_MERCHANT_REGISTRY_ADDRESS` is set

## 🛡️ Security Notes

- Never commit `.env.local` files
- Keep private keys separate from this config
- Use contract-based auth for production
- Regularly audit authorized addresses

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production  
```bash
# Build with production env
npm run build

# Serve static files
npm run preview
```

## 📝 Example Configurations

### Development Team
```bash
VITE_AUTHORIZED_MERCHANTS=0xDev1,0xDev2,0xDev3
VITE_AUTHORIZED_CUSTODIANS=0xDevAdmin
VITE_DEV_MODE=true
```

### Production
```bash
VITE_MERCHANT_REGISTRY_ADDRESS=0xProductionContract
VITE_DEV_MODE=false
VITE_ENABLE_DEBUG_LOGS=false
```