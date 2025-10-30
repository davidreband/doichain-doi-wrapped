// Simple script to deploy Mock USDT and update pool
async function main() {
  console.log("🔧 Fixing USDT issue...");
  
  // Just update the frontend with a working contract address
  // Use the wDOI contract as Mock USDT for testing
  const wdoiAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  console.log("📝 Using wDOI contract as Mock USDT for testing:", wdoiAddress);
  console.log("✅ Update frontend USDT_TOKEN_ADDRESS to:", wdoiAddress);
  console.log("");
  console.log("⚠️  Note: This is a temporary fix for testing.");
  console.log("   Both wDOI and Mock USDT will use the same contract.");
}

main().catch(console.error);