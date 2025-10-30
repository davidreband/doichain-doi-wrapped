# 🏦 Detaillierte Beschreibung des Custodial-Modells WrappedDoichain

## 📋 Überblick der Architektur nach dem WBTC-Modell

### 🌟 Kernprinzipien:
Das **Custodial-Modell** ist ein System, bei dem **vertrauenswürdige Organisationen (Custodians)** die ursprünglichen DOI-Token physisch auf **Cold Wallets** speichern, während in der Ethereum-Blockchain durch diese abgesicherte Wrapped-Token wDOI erstellt werden.

## 🏗️ Systemarchitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    DOICHAIN NETZWERK                            │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   Cold Wallet   │    │   Cold Wallet   │                    │
│  │   Custodian 1   │    │   Custodian 2   │                    │
│  │   1000 DOI      │    │   2000 DOI      │                    │
│  └─────────────────┘    └─────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                            │
                     Physische Verwahrung
                            │
┌─────────────────────────────────────────────────────────────────┐
│                   ETHEREUM NETZWERK                             │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐                    │
│  │   Händler 1     │    │   Händler 2     │                    │
│  │  (Initiiert)    │    │  (Initiiert)    │                    │
│  └─────────────────┘    └─────────────────┘                    │
│           │                       │                            │
│           └───────────┬───────────┘                            │
│                       │                                        │
│          ┌─────────────────────────────┐                       │
│          │  WrappedDoichainCustodial   │                       │
│          │       Smart Contract       │                       │
│          │     3000 wDOI Ausgabe      │                       │
│          └─────────────────────────────┘                       │
│                       │                                        │
│  ┌─────────────────┐  │  ┌─────────────────┐                  │
│  │   Custodian 1   │──┼──│   Custodian 2   │                  │
│  │  (Ethereum)     │  │  │  (Ethereum)     │                  │
│  │   Bestätigt     │  │  │   Bestätigt     │                  │
│  └─────────────────┘  │  └─────────────────┘                  │
│                       │                                        │
│  ┌─────────────────┐  │  ┌─────────────────┐                  │
│  │   Nutzer 1      │──┼──│   Nutzer 2      │                  │
│  │   500 wDOI      │  │  │   800 wDOI      │                  │
│  └─────────────────┘  │  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## 👥 Hauptakteure des Systems

### 🏛️ **1. Custodians (Verwahrer)**
- **Rolle**: Verwahrung von DOI-Token auf Cold Wallets
- **Verantwortlichkeiten**: 
  - Physische Sicherheit der DOI-Token
  - Bestätigung von DOI-Eingängen/-Ausgängen
  - Multisig-Bestätigung von Operationen
- **Anforderungen**: Lizenzierte Finanzorganisationen

### 🏪 **2. Merchants (Händler)**
- **Rolle**: Initiatoren von Mint/Burn-Operationen
- **Funktionen**:
  - Entgegennahme von Nutzeranfragen
  - Erstellung von Mint/Burn-Anfragen
  - KYC/AML-Prüfungen von Nutzern
- **Beispiele**: Börsen, Wechselstuben, institutionelle Services

### 👨‍💼 **3. Administratoren**
- **Rolle**: Systemverwaltung
- **Befugnisse**:
  - Hinzufügen/Entfernen von Custodians
  - Verwaltung von Merchants
  - Notfallpause des Systems
  - Konfiguration von Sicherheitsparametern

## 🔄 Mint-Prozess (DOI-Einzahlung → wDOI-Erstellung)

### Schritt 1: Nutzer-Initiierung
```
Nutzer → Händler: "Ich möchte 100 wDOI"
```

### Schritt 2: DOI-Versendung an Custodian
```
Nutzer → Cold Wallet des Custodians: 100 DOI
```

### Schritt 3: Mint-Anfrage durch Händler
```solidity
// Händler erstellt Anfrage im Contract
merchant.requestMint(
    userAddress,
    100 * 10^18, // 100 wDOI
    "doichain_tx_hash_abc123",
    "custodian_doichain_address"
);
```

### Schritt 4: Custodian-Bestätigung
```solidity
// Custodian 1 bestätigt DOI-Erhalt
custodian1.confirmMint(requestId);

// Custodian 2 bestätigt (2 Bestätigungen erforderlich)
custodian2.confirmMint(requestId);
// → Automatisches Mint von 100 wDOI an den Nutzer
```

## 🔥 Burn-Prozess (wDOI-Verbrennung → DOI-Rückgabe)

### Schritt 1: Rückgabe-Anfrage
```solidity
// Händler erstellt Burn-Anfrage
merchant.requestBurn(
    userAddress,
    50 * 10^18, // 50 wDOI
    "user_doichain_address_for_withdrawal"
);
```

### Schritt 2: Custodian-Bestätigung
```solidity
// Custodians bestätigen Bereitschaft zur DOI-Sendung
custodian1.confirmBurn(requestId);
custodian2.confirmBurn(requestId);
// → Automatische Verbrennung von 50 wDOI
```

### Schritt 3: DOI-Sendung an Nutzer
```
Custodian → Nutzer-Doichain-Adresse: 50 DOI
```

## 🛡️ Sicherheitssystem

### 🔐 **Multisig-Bestätigungen**
```solidity
uint256 public requiredConfirmations = 2; // Konfigurierbar durch Admin

// Jede Operation erfordert Bestätigung von 2+ Custodians
mapping(uint256 => mapping(address => bool)) public mintConfirmations;
mapping(uint256 => mapping(address => bool)) public burnConfirmations;
```

### ❄️ **Cold Storage**
- DOI-Token werden auf **Offline-Wallets** gespeichert
- Private Schlüssel sind vom Internet isoliert
- Multisig-Wallets für zusätzliche Sicherheit

### 📊 **Proof of Reserves**
```solidity
function getReservesInfo() external view returns (
    uint256 totalSupplyAmount,     // Gesamtmenge wDOI
    uint256 totalReservesAmount,   // Gesamtmenge DOI-Reserven
    bool isFullyBacked            // Vollständige Deckung
);
```

### ⏸️ **Notfallpause**
```solidity
// Admin kann alle Operationen stoppen
function pause() external onlyRole(PAUSER_ROLE);
```

## 🏦 Custodian-Verwaltung

### Hinzufügen eines Custodians
```solidity
contract.addCustodian(
    "0x1234...",                           // Ethereum-Adresse
    "BitGo Custodial Services",            // Organisationsname  
    "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm" // Doichain-Adresse des Cold Wallets
);
```

### Aktualisierung der Reserven
```solidity
// Aktualisierung der DOI-Menge in Custodian-Reserven
contract.updateCustodianReserves(
    custodianAddress,
    1000 * 10^18 // 1000 DOI
);
```

## 📈 Vorteile des Custodial-Modells

### ✅ **Sicherheit**
- Physische Verwahrung auf Cold Wallets
- Multisig-Bestätigung von Operationen
- Lizenzierte Custodians

### ✅ **Transparenz**
- Öffentliche Reserve-Adressen
- Auditierbare Operationen
- Echtzeit-Proof of Reserves

### ✅ **Regulatorische Compliance**
- KYC/AML durch Merchants
- Lizenzierte Custodians
- Einhaltung von Bankstandards

### ✅ **Institutionelles Vertrauen**
- Geprüfte Finanzorganisationen
- Versicherung der Reserven
- Sicherheitsaudit

## 🔧 Technische Implementierungsdetails

### **Zugangsrollen:**
```solidity
bytes32 public constant CUSTODIAN_ROLE = keccak256("CUSTODIAN_ROLE");
bytes32 public constant MERCHANT_ROLE = keccak256("MERCHANT_ROLE");  
bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
bytes32 public constant RESERVE_MANAGER_ROLE = keccak256("RESERVE_MANAGER_ROLE");
```

### **Datenstrukturen:**
```solidity
struct MintRequest {
    address recipient;          // wDOI-Empfänger
    uint256 amount;            // Mint-Menge
    string doichainTxHash;     // DOI-Transaktions-Hash
    string custodianAddress;   // Custodian-Adresse
    address merchant;          // Anfrage-Initiator
    uint256 timestamp;         // Erstellungszeit
    bool approved;             // Genehmigungsstatus
    bool executed;             // Ausführungsstatus
    uint256 confirmations;     // Anzahl Bestätigungen
}
```

### **Audit-Events:**
```solidity
event MintRequested(uint256 indexed requestId, address recipient, uint256 amount);
event MintConfirmed(uint256 indexed requestId, address custodian, uint256 confirmations);
event MintExecuted(uint256 indexed requestId, address recipient, uint256 amount);

event BurnRequested(uint256 indexed requestId, address account, uint256 amount);
event BurnConfirmed(uint256 indexed requestId, address custodian, uint256 confirmations);
event BurnExecuted(uint256 indexed requestId, address account, uint256 amount);
```

## 🧪 Testing

**21 umfassende Tests** abdeckend:
- ✅ Custodian-Verwaltung
- ✅ Merchant-Verwaltung  
- ✅ Mint-Prozess mit Multisig
- ✅ Burn-Prozess mit Multisig
- ✅ Proof of Reserves
- ✅ Administrative Funktionen
- ✅ Sicherheit und Pausen

## 🚀 Produktionsbereitschaft

Das Custodial-Modell ist bereit für:
- **Institutionelle Nutzung**
- **Regulierte Umgebung** 
- **Skalierbare Operationen**
- **Auditierbare Transparenz**

Diese Architektur gewährleistet maximale Sicherheit und Vertrauen nach dem bewährten WBTC-Modell! 🏦🔐

## 📁 Projektdateien

### Contracts
- `contracts/WrappedDoichainCustodial.sol` - Haupt-Custodial-Contract
- `contracts/WrappedDoichain.sol` - Basis-Bridge-Contract

### Tests  
- `test/WrappedDoichainCustodial.test.js` - 21 Tests des Custodial-Modells
- `test/WrappedDoichain.test.js` - 28 Tests des Basis-Modells

### Skripte
- `scripts/deploy.js` - Contract-Deployment
- `scripts/manage-bridges.js` - Bridge-Verwaltung

### Dokumentation
- `README.md` - Hauptdokumentation
- `CLAUDE.md` - Technische Entwicklerdokumentation
- `docs/CUSTODIAL_ARCHITECTURE.md` - Architektur-Beschreibung (Russisch)
- `docs/CUSTODIAL_ARCHITECTURE_DE.md` - Diese Datei (Deutsch)

## 🔄 Verwendungsbeispiele

### Contract-Deployment
```bash
# Lokales Testnetzwerk
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Testnet-Deployment  
npx hardhat run scripts/deploy.js --network sepolia
```

### Custodian-Verwaltung
```javascript
// Custodian hinzufügen
await contract.addCustodian(
  custodianAddress,
  "Deutsche Krypto Custodial GmbH", 
  "DJq9KqHjq5L7MQ8dP4L5V7s6X8zT3nKbVm"
);

// Reserven aktualisieren
await contract.updateCustodianReserves(
  custodianAddress,
  ethers.parseEther("1000") // 1000 DOI
);
```

### Mint-Prozess
```javascript
// 1. Merchant erstellt Anfrage
await contract.connect(merchant).requestMint(
  userAddress,
  ethers.parseEther("100"),
  "doichain_tx_hash_123",
  "custodian_cold_wallet_address"
);

// 2. Custodians bestätigen
await contract.connect(custodian1).confirmMint(requestId);
await contract.connect(custodian2).confirmMint(requestId);
// → Automatische Ausführung bei ausreichenden Bestätigungen
```

### Burn-Prozess  
```javascript
// 1. Merchant erstellt Burn-Anfrage
await contract.connect(merchant).requestBurn(
  userAddress,
  ethers.parseEther("50"),
  "user_doichain_withdrawal_address"
);

// 2. Custodians bestätigen
await contract.connect(custodian1).confirmBurn(requestId);
await contract.connect(custodian2).confirmBurn(requestId);
// → Automatische wDOI-Verbrennung
```

## 🎯 Compliance und Sicherheit

### Regulatorische Anforderungen
- **BaFin-Compliance** für deutsche Custodians
- **EU-MICA-Verordnung** Konformität
- **AML/KYC-Richtlinien** Einhaltung

### Sicherheitsmaßnahmen
- **Hardware Security Modules (HSM)** für Schlüsselverwaltung
- **Multi-Jurisdictional** Custodian-Verteilung
- **Versicherungsschutz** für verwahrte Assets
- **Regelmäßige Sicherheitsaudits**

### Transparenz-Mechanismen
- **Öffentliche Reserve-Adressen**
- **Echzeit-Proof-of-Reserves**
- **Auditierbare Transaktionshistorie**
- **Compliance-Berichte**