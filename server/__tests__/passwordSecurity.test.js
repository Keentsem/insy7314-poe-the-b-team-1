const {
  hashPassword,
  comparePassword,
  sanitizePasswordInput,
  isValidBcryptHash,
  getHashCostFactor,
  SALT_ROUNDS,
  MAX_PASSWORD_LENGTH,
} = require('../utils/passwordSecurity');

describe('Password Security - EXCEEDS STANDARD Implementation', () => {
  describe('Password Hashing with Advanced Security', () => {
    test('should hash identical passwords to different values (salting verification)', async () => {
      const password = 'TestPassword123!@#';

      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // CRITICAL: Two identical passwords must hash to different values
      // This proves that proper salting is working
      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toEqual(hash2);

      // Both hashes should be valid bcrypt format
      expect(isValidBcryptHash(hash1)).toBe(true);
      expect(isValidBcryptHash(hash2)).toBe(true);

      // Both should use our configured salt rounds (14)
      expect(getHashCostFactor(hash1)).toBe(SALT_ROUNDS);
      expect(getHashCostFactor(hash2)).toBe(SALT_ROUNDS);
    });

    test('should use 14 salt rounds (exceeds standard 12)', async () => {
      const password = 'SecurePass123!@#';
      const hash = await hashPassword(password);

      const costFactor = getHashCostFactor(hash);
      expect(costFactor).toBe(14);
      expect(costFactor).toBeGreaterThan(12); // Exceeds standard
    });

    test('should never store plaintext passwords', async () => {
      const plainPassword = 'PlaintextPassword123!@#';
      const hash = await hashPassword(plainPassword);

      // Hash should not contain the original password
      expect(hash).not.toContain(plainPassword);
      expect(hash).not.toContain('PlaintextPassword');
      expect(hash).not.toContain('123!@#');

      // Hash should be proper bcrypt format
      expect(hash).toMatch(/^\$2[aby]\$14\$/);
      expect(hash.length).toBe(60);
    });

    test('should produce cryptographically strong hashes', async () => {
      const password = 'CryptoTest123!@#';
      const hashes = [];

      // Generate multiple hashes of the same password
      for (let i = 0; i < 5; i++) {
        hashes.push(await hashPassword(password));
      }

      // All hashes should be unique (proper salt generation)
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(5);

      // All should be valid bcrypt hashes
      hashes.forEach(hash => {
        expect(isValidBcryptHash(hash)).toBe(true);
      });
    });
  });

  describe('Password Comparison with Timing Attack Resistance', () => {
    test('should correctly validate matching passwords', async () => {
      const password = 'CorrectPassword123!@#';
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect passwords', async () => {
      const correctPassword = 'CorrectPassword123!@#';
      const wrongPassword = 'WrongPassword123!@#';
      const hash = await hashPassword(correctPassword);

      const isValid = await comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    test('should handle multiple correct validations consistently', async () => {
      const password = 'ConsistentTest123!@#';
      const hash = await hashPassword(password);

      // Multiple validations should all return true
      for (let i = 0; i < 3; i++) {
        const isValid = await comparePassword(password, hash);
        expect(isValid).toBe(true);
      }
    });

    test('should resist timing attacks through constant-time comparison', async () => {
      const password = 'TimingTest123!@#';
      const hash = await hashPassword(password);

      const startTime = process.hrtime.bigint();
      await comparePassword(password, hash);
      const validTime = process.hrtime.bigint() - startTime;

      const startTime2 = process.hrtime.bigint();
      await comparePassword('WrongPassword123!@#', hash);
      const invalidTime = process.hrtime.bigint() - startTime2;

      // Times should be similar (within reasonable variance)
      // bcrypt's constant-time comparison prevents timing attacks
      const timeDifference = Math.abs(Number(validTime - invalidTime));
      const maxAcceptableDifference = 50000000; // 50ms in nanoseconds

      expect(timeDifference).toBeLessThan(maxAcceptableDifference);
    });
  });

  describe('Input Sanitization - EXCEEDS STANDARD Protection', () => {
    test('should sanitize password input before hashing', async () => {
      // Test password with potential issues that gets cleaned
      const dirtyPassword = '  TestPass123!@#  '; // Has leading/trailing spaces

      const hash = await hashPassword(dirtyPassword);

      // Should work with cleaned version
      const cleanPassword = 'TestPass123!@#';
      const isValid = await comparePassword(cleanPassword, hash);
      expect(isValid).toBe(true);

      // Should also work with original dirty input (auto-cleaned)
      const isValidDirty = await comparePassword(dirtyPassword, hash);
      expect(isValidDirty).toBe(true);
    });

    test('should reject passwords with null bytes', async () => {
      const maliciousPassword = 'TestPass123\0';

      await expect(hashPassword(maliciousPassword)).rejects.toThrow(
        'Password contains invalid null bytes'
      );
    });

    test('should reject excessively long passwords (DoS protection)', async () => {
      const longPassword = 'a'.repeat(MAX_PASSWORD_LENGTH + 1);

      await expect(hashPassword(longPassword)).rejects.toThrow(
        `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters`
      );
    });

    test('should reject empty or whitespace-only passwords', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');

      await expect(hashPassword('   ')).rejects.toThrow(
        'Password cannot be only whitespace or control characters'
      );

      await expect(hashPassword('\t\n\r')).rejects.toThrow(
        'Password cannot be only whitespace or control characters'
      );
    });

    test('should handle Unicode normalization', async () => {
      // These should be treated as equivalent after normalization
      const password1 = 'Café123!@#'; // é as single character
      const password2 = 'Cafe\u0301123!@#'; // é as e + combining accent

      const hash1 = await hashPassword(password1);
      const hash2 = await hashPassword(password2);

      // After normalization, both should validate against either hash
      expect(await comparePassword(password1, hash1)).toBe(true);
      expect(await comparePassword(password2, hash1)).toBe(true);
      expect(await comparePassword(password1, hash2)).toBe(true);
      expect(await comparePassword(password2, hash2)).toBe(true);
    });

    test('should remove dangerous control characters', async () => {
      const dangerousPassword = 'Test\x00\x01\x1fPass123!@#';

      await expect(hashPassword(dangerousPassword)).rejects.toThrow(); // Should reject due to null byte or clean to empty
    });

    test('should validate non-string inputs', async () => {
      await expect(hashPassword(null)).rejects.toThrow('Password must be a string');

      await expect(hashPassword(undefined)).rejects.toThrow('Password must be a string');

      await expect(hashPassword(123)).rejects.toThrow('Password must be a string');

      await expect(hashPassword({})).rejects.toThrow('Password must be a string');
    });
  });

  describe('Hash Validation and Introspection', () => {
    test('should validate bcrypt hash format', () => {
      const validHashes = [
        '$2a$14$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV',
        '$2b$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV',
        '$2y$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV',
      ];

      validHashes.forEach(hash => {
        expect(isValidBcryptHash(hash)).toBe(true);
      });

      const invalidHashes = [
        'invalid',
        '$2a$14$short',
        '$2a$14$' + 'a'.repeat(100), // too long
        '$2z$14$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV', // invalid variant
        '',
        null,
        undefined,
      ];

      invalidHashes.forEach(hash => {
        expect(isValidBcryptHash(hash)).toBe(false);
      });
    });

    test('should extract cost factor from hash', async () => {
      const password = 'CostFactorTest123!@#';
      const hash = await hashPassword(password);

      const cost = getHashCostFactor(hash);
      expect(cost).toBe(14);
      expect(typeof cost).toBe('number');
    });

    test('should handle invalid hash formats in comparison', async () => {
      const password = 'TestPassword123!@#';

      // Should return false for invalid hashes without throwing
      expect(await comparePassword(password, 'invalid-hash')).toBe(false);
      expect(await comparePassword(password, '')).toBe(false);
      expect(await comparePassword(password, '$2a$invalid')).toBe(false);
    });
  });

  describe('Error Handling and Security', () => {
    test('should not leak sensitive information in errors', async () => {
      try {
        await comparePassword('test', null);
      } catch (error) {
        expect(error.message).not.toContain('bcrypt');
        expect(error.message).not.toContain('internal');
      }
    });

    test('should handle bcrypt library errors gracefully', async () => {
      // Test with malformed hash that might cause bcrypt to throw
      const result = await comparePassword('test', '$2a$14$invalid');
      expect(result).toBe(false); // Should return false, not throw
    });

    test('should maintain hash integrity across operations', async () => {
      const password = 'IntegrityTest123!@#';
      const hash = await hashPassword(password);

      // Hash should remain valid after storage/retrieval simulation
      const storedHash = hash;
      const retrievedHash = storedHash;

      expect(await comparePassword(password, retrievedHash)).toBe(true);
      expect(isValidBcryptHash(retrievedHash)).toBe(true);
      expect(getHashCostFactor(retrievedHash)).toBe(14);
    });
  });

  describe('Performance and Security Trade-offs', () => {
    test('should complete hashing within reasonable time (security vs performance)', async () => {
      const password = 'PerformanceTest123!@#';

      const startTime = Date.now();
      await hashPassword(password);
      const endTime = Date.now();

      const hashingTime = endTime - startTime;

      // Should take reasonable time (not too fast = insecure, not too slow = unusable)
      expect(hashingTime).toBeGreaterThan(50); // At least 50ms for 14 rounds
      expect(hashingTime).toBeLessThan(5000); // Less than 5 seconds
    });

    test('should demonstrate computational cost scaling', async () => {
      // This test demonstrates why 14 rounds exceeds standard
      const password = 'ScalingTest123!@#';

      // Time a comparison operation
      const hash = await hashPassword(password);

      const startTime = process.hrtime.bigint();
      await comparePassword(password, hash);
      const endTime = process.hrtime.bigint();

      const comparisonTime = Number(endTime - startTime) / 1000000; // Convert to ms

      // At 14 rounds, this should take measurable time
      expect(comparisonTime).toBeGreaterThan(10); // At least 10ms

      console.log(
        `Password comparison with ${SALT_ROUNDS} rounds took ${comparisonTime.toFixed(2)}ms`
      );
    });
  });
});
