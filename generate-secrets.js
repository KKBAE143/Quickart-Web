// Generate JWT Secret Keys
// Run this script with: node generate-secrets.js

import crypto from 'crypto';

console.log('\n🔐 JWT Secret Keys Generator\n');
console.log('Copy these values to your server/.env file:\n');
console.log('─'.repeat(80));

const accessToken = crypto.randomBytes(64).toString('hex');
const refreshToken = crypto.randomBytes(64).toString('hex');

console.log('\nSECRET_KEY_ACCESS_TOKEN=' + accessToken);
console.log('\nSECRET_KEY_REFRESH_TOKEN=' + refreshToken);

console.log('\n' + '─'.repeat(80));
console.log('\n✅ Keys generated successfully!\n');
console.log('⚠️  Keep these keys secret and never commit them to version control.\n');

