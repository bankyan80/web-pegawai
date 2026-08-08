#!/usr/bin/env node

/**
 * Admin Password Reset Tool
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function resetAdminPassword(newPassword) {
  console.log('\n🔐 Admin Password Reset Tool\n');
  console.log('=' .repeat(60));

  if (!newPassword) {
    newPassword = 'admin123';
    console.log('Using default password: admin123');
  }

  console.log(`\nGenerating bcrypt hash for password: ${newPassword}`);
  
  const hash = bcrypt.hashSync(newPassword, 10);
  console.log(`Bcrypt hash: ${hash}\n`);

  // Try to update in Supabase
  try {
    console.log('Updating admin user in Supabase...\n');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/member?username=eq.admin`, {
      method: 'PATCH',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ passwors: hash })
    });

    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const updated = await response.json();
      console.log('\n✅ Admin password updated successfully!');
      console.log('   Username: admin');
      console.log(`   New Password: ${newPassword}`);
      console.log('   Role: administrator');
    } else {
      const error = await response.text();
      console.log('❌ Error:', error);
    }
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    console.log('\n⚠️  Troubleshooting:');
    console.log('1. Check internet connection');
    console.log('2. Verify SUPABASE_URL in .env');
    console.log('3. Verify SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('4. Try manual update in Supabase dashboard');
  }
}

const password = process.argv[2];
resetAdminPassword(password);

console.log('\n' + '='.repeat(60));
console.log('💡 To login, use:');
console.log('   Username: admin');
console.log(`   Password: ${process.argv[2] || 'admin123'}\n`);
