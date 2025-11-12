#!/usr/bin/env node

// Simple ElectrumX test script
const { DoichainService } = require('./src/services/doichain.js');

async function testElectrumX() {
  console.log('🧪 Testing ElectrumX connection for real DOI data...\n');
  
  const doichainService = new DoichainService();
  const testAddress = 'dc1qvrs6j3j0cn8jzgt8au0rnxxq40sz8j0lrr6k7n';
  
  console.log(`📍 Test address: ${testAddress}`);
  console.log(`🌐 ElectrumX servers: ${doichainService.electrumServers.join(', ')}`);
  console.log(`🔧 Use mock data: ${doichainService.useMockData}`);
  console.log(`⚡ Use ElectrumX: ${doichainService.useElectrumX}\n`);
  
  try {
    console.log('⏳ Getting balance...');
    const balance = await doichainService.getBalance(testAddress);
    
    console.log('\n✅ SUCCESS!');
    console.log('📊 Balance result:', JSON.stringify(balance, null, 2));
    
    if (balance.source === 'ElectrumX') {
      console.log('🎉 Successfully connected to ElectrumX servers!');
    } else if (balance.source === 'RPC') {
      console.log('⚠️ ElectrumX failed, but RPC worked');
    } else {
      console.log('❌ Fell back to mock data');
    }
    
  } catch (error) {
    console.log('\n❌ ERROR!');
    console.error('Error:', error.message);
  }
}

testElectrumX();