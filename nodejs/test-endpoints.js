#!/usr/bin/env node

/**
 * Quick API Test Script
 * Test all Cloudflare AI Analysis endpoints
 */

console.log('\n🧪 Testing Cloudflare AI Analysis Endpoints\n');
console.log('═'.repeat(60));

const BASE_URL = 'http://localhost:3000/api/analysis';

async function testEndpoint(name, url) {
  console.log(`\n📍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log(`   ⚠️  Status: 401 Unauthorized`);
      console.log(`   Note: Need to login first. Test from browser.`);
      return;
    }
    
    if (response.status === 403) {
      console.log(`   ⚠️  Status: 403 Forbidden`);
      console.log(`   Note: Need admin access. Test from browser as admin.`);
      return;
    }
    
    if (response.ok && data.success) {
      console.log(`   ✅ Status: ${response.status} OK`);
      console.log(`   Response size: ${JSON.stringify(data).length} bytes`);
      
      if (data.data && typeof data.data === 'object') {
        const keys = Object.keys(data.data);
        console.log(`   Fields: ${keys.join(', ')}`);
        
        if (data.data.statistics) {
          console.log(`   Statistics found: ${JSON.stringify(data.data.statistics).substring(0, 100)}...`);
        }
      }
    } else {
      console.log(`   ❌ Status: ${response.status}`);
      console.log(`   Error: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n1️⃣  Testing Statistics Endpoint (No Auth Required)');
  await testEndpoint('Statistics', `${BASE_URL}/statistics`);
  
  console.log('\n2️⃣  Testing AI Analysis Endpoint (Admin Required)');
  await testEndpoint('Analyze', `${BASE_URL}/analyze`);
  
  console.log('\n3️⃣  Testing Audit Endpoint (Admin Required)');
  await testEndpoint('Audit', `${BASE_URL}/audit`);
  
  console.log('\n4️⃣  Testing Recommendations Endpoint (Admin Required)');
  await testEndpoint('Recommendations', `${BASE_URL}/recommendations`);
  
  console.log('\n5️⃣  Testing Full Report Endpoint (Admin Required)');
  await testEndpoint('Full Report', `${BASE_URL}/full-report`);
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n📝 Notes:');
  console.log('   • Endpoints 2-5 require authentication and admin role');
  console.log('   • Test authentication endpoints from browser');
  console.log('   • Or use cookies from authenticated session');
  console.log('   • API Response time: Statistics (~100ms), Others (10-30s)');
  console.log('\n✅ Endpoint tests complete!\n');
}

runTests();
