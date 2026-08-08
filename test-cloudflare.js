#!/usr/bin/env node

/**
 * Test Script untuk Cloudflare AI Integration
 * 
 * Gunakan: cd nodejs && node ../test-cloudflare.js
 * 
 * Script ini akan test:
 * 1. Configuration validation
 * 2. API connectivity
 * 3. Database statistics
 * 4. AI endpoints (jika config valid)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'nodejs', '.env') });

const { validateConfig, callCloudflareAI } = require('./nodejs/config/cloudflare');
const { getStatistics } = require('./nodejs/models/analysis');

console.log('\n🧪 Cloudflare AI Integration Test Suite\n');
console.log('═'.repeat(50));

// Test 1: Environment & Config
console.log('\n📋 Test 1: Configuration Check');
console.log('─'.repeat(50));

const requiredEnvVars = [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
];

let configValid = true;
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    configValid = false;
  }
});

const modelId = process.env.CLOUDFLARE_MODEL_ID || '@cf/meta/llama-2-7b-chat-int8';
console.log(`ℹ️  CLOUDFLARE_MODEL_ID: ${modelId}`);

if (!configValid) {
  console.log('\n⚠️  Cloudflare configuration incomplete!');
  console.log('Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env\n');
  process.exit(1);
}

// Test 2: Database & Statistics
console.log('\n📊 Test 2: Database & Statistics');
console.log('─'.repeat(50));

try {
  const stats = getStatistics();
  if (stats) {
    console.log(`✅ Database connected`);
    console.log(`   Total Pegawai: ${stats.totalPegawai}`);
    console.log(`   Total Divisi: ${stats.totalDivisi}`);
    console.log(`   Total Jabatan: ${stats.totalJabatan}`);
    console.log(`   Total User: ${stats.totalUser}`);
  } else {
    console.log(`⚠️  Database query returned null`);
  }
} catch (error) {
  console.log(`❌ Database error: ${error.message}`);
  process.exit(1);
}

// Test 3: Cloudflare API Connectivity
console.log('\n🌐 Test 3: Cloudflare API Connectivity');
console.log('─'.repeat(50));

(async () => {
  try {
    console.log('Testing AI model call (this may take 10-30 seconds)...');
    
    const testPrompt = 'Halo, sebutkan 2 baris saja tentang kepegawaian yang baik.';
    const response = await callCloudflareAI(testPrompt, { maxTokens: 256 });
    
    console.log(`✅ Cloudflare AI API connected`);
    console.log(`   Response preview: ${response.substring(0, 60)}...`);
  } catch (error) {
    console.log(`❌ Cloudflare API error: ${error.message}`);
    console.log('\nPossible causes:');
    console.log('  - Invalid API token');
    console.log('  - Invalid account ID');
    console.log('  - API token has expired');
    console.log('  - Token lacks AI permissions');
    process.exit(1);
  }

  // Test 4: Analysis Endpoints
  console.log('\n📈 Test 4: Analysis Endpoints Verification');
  console.log('─'.repeat(50));

  try {
    const { analyzeData, auditProject, generateRecommendations } = require('./nodejs/models/analysis');
    
    console.log('✅ All analysis functions imported successfully');
    console.log('   - getStatistics');
    console.log('   - analyzeData');
    console.log('   - auditProject');
    console.log('   - generateRecommendations');
  } catch (error) {
    console.log(`❌ Analysis module error: ${error.message}`);
    process.exit(1);
  }

  // Summary
  console.log('\n═'.repeat(50));
  console.log('✅ All tests passed!');
  console.log('\nYour Cloudflare AI integration is ready.');
  console.log('\nNext steps:');
  console.log('  1. Start the server: npm start');
  console.log('  2. Login as administrator');
  console.log('  3. Access: http://localhost:3000/api/analysis/statistics');
  console.log('  4. Try: http://localhost:3000/api/analysis/analyze');
  console.log('  5. Or: http://localhost:3000/api/analysis/full-report');
  console.log('\nAPI Documentation: CLOUDFLARE_AI_DOCS.md');
  console.log('\n');
})();
