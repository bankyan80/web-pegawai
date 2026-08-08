#!/usr/bin/env node

/**
 * Simple Cloudflare AI Test
 * Run dari nodejs folder: node test-cf.js
 */

require('dotenv').config();

console.log('\n🧪 Cloudflare AI Connection Test\n');
console.log('═'.repeat(50));

// Test 1: Environment Check
console.log('\n📋 Checking Environment Variables...');
console.log('─'.repeat(50));

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

if (accountId) {
  console.log(`✅ CLOUDFLARE_ACCOUNT_ID: ${accountId.substring(0, 10)}...`);
} else {
  console.log(`❌ CLOUDFLARE_ACCOUNT_ID: NOT SET`);
}

if (apiToken) {
  console.log(`✅ CLOUDFLARE_API_TOKEN: ${apiToken.substring(0, 10)}...`);
} else {
  console.log(`❌ CLOUDFLARE_API_TOKEN: NOT SET`);
}

// Test 2: Database Check
console.log('\n📊 Checking Database...');
console.log('─'.repeat(50));

try {
  const { getStatistics } = require('./models/analysis');
  const stats = getStatistics();
  
  if (stats) {
    console.log(`✅ Database connected`);
    console.log(`   - Total Pegawai: ${stats.totalPegawai}`);
    console.log(`   - Total Divisi: ${stats.totalDivisi}`);
    console.log(`   - Total Jabatan: ${stats.totalJabatan}`);
  } else {
    console.log(`⚠️  Database returned no stats`);
  }
} catch (error) {
  console.log(`❌ Database error: ${error.message}`);
}

// Test 3: API Test (if credentials exist)
console.log('\n🌐 Cloudflare API Test...');
console.log('─'.repeat(50));

if (!accountId || !apiToken) {
  console.log(`⚠️  Cannot test API - Credentials not set`);
  console.log('\n📝 Setup Instructions:');
  console.log('   1. Get credentials from: https://dash.cloudflare.com');
  console.log('   2. Edit nodejs/.env and add:');
  console.log('      CLOUDFLARE_ACCOUNT_ID=your_account_id');
  console.log('      CLOUDFLARE_API_TOKEN=your_api_token');
  console.log('   3. Run this test again');
  process.exit(0);
}

(async () => {
  try {
    console.log('Attempting API connection...');
    const { callCloudflareAI } = require('./config/cloudflare');
    
    const response = await callCloudflareAI(
      'Jelaskan dalam 1 baris apa itu kepegawaian yang baik.',
      { maxTokens: 100 }
    );
    
    console.log(`✅ Cloudflare AI Connected!`);
    console.log(`\n📝 Sample Response:\n${response.substring(0, 100)}...\n`);
    
    console.log('═'.repeat(50));
    console.log('✅ All tests PASSED!');
    console.log('\nYou can now use:');
    console.log('  - npm start (to run server)');
    console.log('  - Test endpoints at http://localhost:3000/api/analysis/*');
    console.log('\n');
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
    console.log('\nPossible causes:');
    console.log('  - Invalid API token');
    console.log('  - Invalid account ID');
    console.log('  - API token expired');
    console.log('  - No network connection');
    process.exit(1);
  }
})();
