#!/usr/bin/env node

/**
 * Check Admin User in Supabase
 */

require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dkixmotzmmioupclqpan.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function checkMembers() {
  console.log('\n🔍 Checking Member Table in Supabase...\n');
  console.log('Supabase URL:', SUPABASE_URL);
  console.log('Service Key:', SERVICE_KEY.substring(0, 20) + '...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/member`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📊 Response Status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error:', error);
      console.log('\n⚠️  Possible issues:');
      console.log('  1. Supabase URL incorrect');
      console.log('  2. Service key invalid or expired');
      console.log('  3. Member table does not exist');
      return;
    }

    const members = await response.json();
    
    if (!Array.isArray(members)) {
      console.log('❌ Unexpected response format:', members);
      return;
    }

    console.log(`\n✅ Found ${members.length} members:\n`);

    if (members.length === 0) {
      console.log('❌ No members found!');
      console.log('\n📝 Action needed: Create admin user in Supabase');
      return;
    }

    members.forEach((member, i) => {
      console.log(`${i + 1}. ${member.fullname || member.username}`);
      console.log(`   Username: ${member.username}`);
      console.log(`   Role: ${member.role || 'N/A'}`);
      console.log(`   Email: ${member.email || 'N/A'}`);
      console.log(`   Password Hash: ${member.passwors?.substring(0, 20)}...`);
      console.log();
    });

    // Check for admin
    const admin = members.find(m => m.role === 'administrator' || m.role === 'admin');
    if (admin) {
      console.log('✅ Admin user found:', admin.username);
    } else {
      console.log('❌ No admin user found!');
      console.log('⚠️  Need to create/set role to administrator');
    }

  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    console.log('\n⚠️  Possible issues:');
    console.log('  1. No internet connection');
    console.log('  2. Supabase service down');
    console.log('  3. Invalid configuration');
  }
}

async function testDefaultLogin() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔐 Testing Default Login Credentials\n');

  const credentials = [
    { username: 'admin', password: 'admin123' },
    { username: 'admin', password: 'password' },
    { username: 'administrator', password: 'admin' },
  ];

  for (const cred of credentials) {
    console.log(`Trying: ${cred.username} / ${cred.password}...`);
    
    try {
      const response = await fetch('http://localhost:3000/controller/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cookie': 'keepegawaian_session=test'
        },
        body: `username=${cred.username}&password=${cred.password}`
      });

      console.log(`  Status: ${response.status}`);
      if (response.redirected) {
        console.log(`  Redirected to: ${response.url}`);
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

checkMembers();
// testDefaultLogin();

console.log('\n💡 Tips:');
console.log('  1. Check Supabase dashboard: https://app.supabase.com');
console.log('  2. Go to Table Editor → member table');
console.log('  3. Check if admin user exists');
console.log('  4. If not, create one with role="administrator"');
console.log('  5. Password can be SHA1 or bcrypt hash\n');
