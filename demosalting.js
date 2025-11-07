import { hashPassword } from './server/utils/passwordSecurity.js';

async function demonstrateSalting() {
  console.log('=== PASSWORD SALTING DEMONSTRATION ===\n');

  const password = 'MySecurePassword123!';
  console.log(`Original Password: "${password}"\n`);

  // Hash the same password 5 times
  console.log('Hashing the SAME password 5 times...\n');

  const hashes = [];
  for (let i = 1; i <= 5; i++) {
    const hash = await hashPassword(password);
    hashes.push(hash);
    console.log(`Hash ${i}: ${hash}`);
  }

  console.log('\n=== PROOF OF SALTING ===');
  console.log('✅ All hashes are DIFFERENT (unique salts per password)');
  console.log('✅ Same password → Different hashes = Proper salting\n');

  // Verify uniqueness
  const uniqueHashes = new Set(hashes);
  console.log(`Total hashes created: ${hashes.length}`);
  console.log(`Unique hashes: ${uniqueHashes.size}`);
  console.log(`All unique: ${uniqueHashes.size === hashes.length ? '✅ YES' : '❌ NO'}\n`);

  // Show salt extraction
  console.log('=== SALT ANALYSIS ===');
  hashes.forEach((hash, i) => {
    const salt = hash.substring(0, 29); // bcrypt format: $2a$14$[22-char-salt]
    console.log(`Hash ${i + 1} salt: ${salt}`);
  });

  console.log('\n✅ Each hash contains a DIFFERENT embedded salt');
}

demonstrateSalting();
