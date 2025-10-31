const fs = require("fs");

async function updateFrontendAddresses() {
  console.log("🔄 Updating frontend with testnet contract addresses...\n");

  // Load deployment info
  const networkName = process.env.HARDHAT_NETWORK || "localhost";
  const deploymentFile = `./deployments/${networkName}-deployment.json`;
  
  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ Deployment file not found:", deploymentFile);
    console.log("Please run deploy-testnet.js first");
    return;
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  console.log("📄 Loaded deployment info:");
  console.log("   Network:", networkName);
  console.log("   Mock USDT:", deployments.mockUSDT.address);
  console.log("   wDOI Custodial:", deployments.wdoiCustodial.address);
  console.log("   USDT Pool:", deployments.usdtPool.address);
  console.log("");

  // Frontend configuration template
  const frontendConfig = `
// Testnet Configuration for ${networkName.toUpperCase()}
// Generated automatically on ${new Date().toISOString()}

const NETWORK_CONFIG = {
  chainId: ${networkName === 'sepolia' ? '0xaa36a7' : networkName === 'localhost' ? '0x7a69' : '0x1'}, // ${networkName === 'sepolia' ? 'Sepolia' : networkName === 'localhost' ? 'Localhost (31337)' : 'Mainnet'}
  chainName: "${networkName === 'sepolia' ? 'Sepolia Test Network' : networkName === 'localhost' ? 'Localhost 8545' : 'Ethereum Mainnet'}",
  rpcUrls: ["${networkName === 'sepolia' ? 'https://sepolia.infura.io/v3/' : networkName === 'localhost' ? 'http://127.0.0.1:8545' : 'https://mainnet.infura.io/v3/'}"],
  blockExplorerUrls: ["${networkName === 'sepolia' ? 'https://sepolia.etherscan.io' : networkName === 'localhost' ? 'http://127.0.0.1:8545' : 'https://etherscan.io'}"]
};

// Contract Addresses (${networkName.toUpperCase()})
const CONTRACT_ADDRESSES = {
  WDOI_TOKEN: "${deployments.wdoiCustodial.address}",
  USDT_TOKEN: "${deployments.mockUSDT.address}",
  USDT_POOL: "${deployments.usdtPool.address}"
};

// Contract ABIs (minimal for frontend)
const WDOI_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

const USDT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function faucet(address to, uint256 amount)" // Only for testnet
];

const POOL_ABI = [
  "function getPoolInfo() view returns (uint256, uint256, uint256, uint256, uint256, uint256)",
  "function getWDOIPrice() view returns (uint256)",
  "function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) view returns (uint256)",
  "function swapUSDTForWDOI(uint256 usdtAmountIn, uint256 minWDOIOut)",
  "function swapWDOIForUSDT(uint256 wdoiAmountIn, uint256 minUSDTOut)",
  "function addLiquidity(uint256 wdoiAmount, uint256 usdtAmount, uint256 minWDOI, uint256 minUSDT) returns (uint256)",
  "function removeLiquidity(uint256 lpTokens, uint256 minWDOI, uint256 minUSDT)"
];

// Export for use in HTML
if (typeof window !== 'undefined') {
  window.NETWORK_CONFIG = NETWORK_CONFIG;
  window.CONTRACT_ADDRESSES = CONTRACT_ADDRESSES;
  window.WDOI_ABI = WDOI_ABI;
  window.USDT_ABI = USDT_ABI;
  window.POOL_ABI = POOL_ABI;
}

console.log("📡 Frontend configuration loaded for ${networkName.toUpperCase()}");
console.log("Contract addresses:", CONTRACT_ADDRESSES);
`;

  // Write configuration file
  const configFile = `./frontend/config-${networkName}.js`;
  fs.writeFileSync(configFile, frontendConfig);
  
  console.log("✅ Frontend configuration saved to:", configFile);
  console.log("");

  // Update main HTML file to use testnet config
  const htmlFiles = ['./frontend/index.html', './frontend/usdt-pool.html'];
  
  htmlFiles.forEach(htmlFile => {
    if (fs.existsSync(htmlFile)) {
      let htmlContent = fs.readFileSync(htmlFile, 'utf8');
      
      // Replace config import
      htmlContent = htmlContent.replace(
        /<script src="config\.js"><\/script>/g,
        `<script src="config-${networkName}.js"></script>`
      );
      
      // Add network switch warning
      const networkWarning = `
    <!-- Network Configuration Warning -->
    <div id="networkWarning" style="background: #fff3cd; padding: 10px; margin: 10px 0; border: 1px solid #ffeaa7; border-radius: 5px;">
      <strong>⚠️ Testnet Mode:</strong> This interface is configured for ${networkName.toUpperCase()} testnet.
      Make sure MetaMask is connected to the ${networkName} network.
    </div>`;
      
      // Insert warning after body tag
      htmlContent = htmlContent.replace(
        /<body[^>]*>/i,
        `$&${networkWarning}`
      );
      
      fs.writeFileSync(htmlFile, htmlContent);
      console.log("✅ Updated", htmlFile, "for testnet");
    }
  });

  console.log("");
  console.log("📋 Next steps for frontend testing:");
  console.log("1. Open frontend/index.html in your browser");
  console.log("2. Switch MetaMask to Sepolia testnet");
  console.log("3. Import test tokens:");
  console.log(`   • Add wDOI: ${deployments.wdoiCustodial.address}`);
  console.log(`   • Add USDT: ${deployments.mockUSDT.address}`);
  console.log("4. Get test USDT from faucet (built into MockUSDT contract)");
  console.log("5. Test trading!");
  console.log("");

  return {
    configFile,
    addresses: {
      wdoi: deployments.wdoiCustodial.address,
      usdt: deployments.mockUSDT.address,
      pool: deployments.usdtPool.address
    }
  };
}

// Run if called directly
if (require.main === module) {
  updateFrontendAddresses()
    .then(() => {
      console.log("🎉 Frontend update completed!");
    })
    .catch((error) => {
      console.error("❌ Frontend update failed:", error);
      process.exit(1);
    });
}

module.exports = updateFrontendAddresses;