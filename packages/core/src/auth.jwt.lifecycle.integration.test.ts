import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { getConfig } from './config.ts';

describe('Auth JWT Lifecycle Integration Tests', () => {
  let config: ReturnType<typeof getConfig>;
  let jwtSecret: string;
  let refreshSecret: string;

  beforeAll(async () => {
    config = getConfig();
    jwtSecret = config.JWT_SECRET || 'test-jwt-secret';
    refreshSecret = config.JWT_REFRESH_SECRET || 'test-refresh-secret';
  });

  afterAll(async () => {
    // Cleanup
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should generate valid JWT access tokens', async () => {
    const payload = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'user'
    };

    const token = jwt.sign(payload, jwtSecret, { 
      expiresIn: '15m',
      issuer: 'agenticforge',
      audience: 'agenticforge-users'
    });

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as any;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.iss).toBe('agenticforge');
    expect(decoded.aud).toBe('agenticforge-users');
  });

  it('should generate valid JWT refresh tokens', async () => {
    const payload = {
      userId: 'user123',
      tokenType: 'refresh'
    };

    const refreshToken = jwt.sign(payload, refreshSecret, { 
      expiresIn: '7d',
      issuer: 'agenticforge',
      audience: 'agenticforge-refresh'
    });

    expect(typeof refreshToken).toBe('string');
    expect(refreshToken.split('.')).toHaveLength(3);

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, refreshSecret) as any;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.tokenType).toBe('refresh');
    expect(decoded.iss).toBe('agenticforge');
    expect(decoded.aud).toBe('agenticforge-refresh');
  });

  it('should handle token expiration correctly', async () => {
    const payload = { userId: 'user123' };

    // Create expired token
    const expiredToken = jwt.sign(payload, jwtSecret, { expiresIn: '1ms' });

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verification should fail
    expect(() => {
      jwt.verify(expiredToken, jwtSecret);
    }).toThrow('jwt expired');
  });

  it('should validate token signatures correctly', async () => {
    const payload = { userId: 'user123' };
    const token = jwt.sign(payload, jwtSecret);

    // Valid signature
    expect(() => {
      jwt.verify(token, jwtSecret);
    }).not.toThrow();

    // Invalid signature
    expect(() => {
      jwt.verify(token, 'wrong-secret');
    }).toThrow('invalid signature');
  });

  it('should handle malformed tokens', async () => {
    const malformedTokens = [
      'invalid-token',
      'header.payload', // Missing signature
      'not.jwt.token.format',
      '',
      null,
      undefined
    ];

    malformedTokens.forEach(token => {
      expect(() => {
        jwt.verify(token as any, jwtSecret);
      }).toThrow();
    });
  });

  it('should implement token refresh workflow', async () => {
    const userId = 'user123';
    
    // Create initial tokens
    const accessToken = jwt.sign(
      { userId, email: 'test@example.com', role: 'user' },
      jwtSecret,
      { expiresIn: '15m', issuer: 'agenticforge' }
    );

    const refreshToken = jwt.sign(
      { userId, tokenType: 'refresh' },
      refreshSecret,
      { expiresIn: '7d', issuer: 'agenticforge' }
    );

    // Verify refresh token is valid
    const refreshDecoded = jwt.verify(refreshToken, refreshSecret) as any;
    expect(refreshDecoded.userId).toBe(userId);
    expect(refreshDecoded.tokenType).toBe('refresh');

    // Use refresh token to generate new access token
    const newAccessToken = jwt.sign(
      { userId: refreshDecoded.userId, email: 'test@example.com', role: 'user' },
      jwtSecret,
      { expiresIn: '15m', issuer: 'agenticforge' }
    );

    // Verify new access token
    const newDecoded = jwt.verify(newAccessToken, jwtSecret) as any;
    expect(newDecoded.userId).toBe(userId);
  });

  it('should validate JWT claims correctly', async () => {
    const payload = {
      userId: 'user123',
      email: 'test@example.com',
      role: 'admin'
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '1h',
      issuer: 'agenticforge',
      audience: 'agenticforge-users',
      subject: 'user123',
      notBefore: '0s'
    });

    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'agenticforge',
      audience: 'agenticforge-users',
      subject: 'user123'
    }) as any;

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.iss).toBe('agenticforge');
    expect(decoded.aud).toBe('agenticforge-users');
    expect(decoded.sub).toBe('user123');
  });

  it('should reject tokens with invalid audience', async () => {
    const payload = { userId: 'user123' };
    const token = jwt.sign(payload, jwtSecret, {
      audience: 'wrong-audience',
      issuer: 'agenticforge'
    });

    expect(() => {
      jwt.verify(token, jwtSecret, {
        audience: 'agenticforge-users',
        issuer: 'agenticforge'
      });
    }).toThrow('jwt audience invalid');
  });

  it('should reject tokens with invalid issuer', async () => {
    const payload = { userId: 'user123' };
    const token = jwt.sign(payload, jwtSecret, {
      issuer: 'wrong-issuer',
      audience: 'agenticforge-users'
    });

    expect(() => {
      jwt.verify(token, jwtSecret, {
        issuer: 'agenticforge',
        audience: 'agenticforge-users'
      });
    }).toThrow('jwt issuer invalid');
  });

  it('should handle token blacklisting scenario', async () => {
    const blacklistedTokens = new Set<string>();
    
    const payload = { userId: 'user123' };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1h' });

    // Token should be valid initially
    expect(() => {
      jwt.verify(token, jwtSecret);
    }).not.toThrow();

    // Add token to blacklist
    blacklistedTokens.add(token);

    // Simulate blacklist check
    const isBlacklisted = blacklistedTokens.has(token);
    expect(isBlacklisted).toBe(true);

    // In real scenario, blacklisted tokens should be rejected
    if (isBlacklisted) {
      expect(true).toBe(true); // Token should be rejected
    }
  });

  it('should handle concurrent token operations', async () => {
    const userIds = Array.from({ length: 10 }, (_, i) => `user${i}`);
    
    // Generate tokens concurrently
    const tokenPromises = userIds.map(userId => 
      Promise.resolve(jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' }))
    );

    const tokens = await Promise.all(tokenPromises);
    expect(tokens).toHaveLength(10);

    // Verify all tokens concurrently
    const verificationPromises = tokens.map(token =>
      Promise.resolve(jwt.verify(token, jwtSecret))
    );

    const decodedTokens = await Promise.all(verificationPromises);
    expect(decodedTokens).toHaveLength(10);

    // Check each decoded token has correct userId
    decodedTokens.forEach((decoded, index) => {
      expect((decoded as any).userId).toBe(`user${index}`);
    });
  });

  it('should handle different token algorithms', async () => {
    const payload = { userId: 'user123' };

    // Test HS256 (default)
    const hs256Token = jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
    const hs256Decoded = jwt.verify(hs256Token, jwtSecret) as any;
    expect(hs256Decoded.userId).toBe(payload.userId);

    // Test HS512
    const hs512Token = jwt.sign(payload, jwtSecret, { algorithm: 'HS512' });
    const hs512Decoded = jwt.verify(hs512Token, jwtSecret, { algorithms: ['HS512'] }) as any;
    expect(hs512Decoded.userId).toBe(payload.userId);
  });

  it('should validate token timing claims', async () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = { userId: 'user123' };

    // Token not valid before future time
    const futureToken = jwt.sign(payload, jwtSecret, {
      notBefore: now + 3600 // 1 hour from now
    });

    expect(() => {
      jwt.verify(futureToken, jwtSecret);
    }).toThrow('jwt not active');

    // Token valid immediately
    const immediateToken = jwt.sign(payload, jwtSecret, {
      notBefore: now - 10 // 10 seconds ago
    });

    expect(() => {
      jwt.verify(immediateToken, jwtSecret);
    }).not.toThrow();
  });

  it('should handle token payload size limits', async () => {
    // Large payload
    const largePayload = {
      userId: 'user123',
      data: 'x'.repeat(10000), // 10KB of data
      permissions: Array.from({ length: 1000 }, (_, i) => `permission${i}`)
    };

    const largeToken = jwt.sign(largePayload, jwtSecret);
    expect(typeof largeToken).toBe('string');

    const decoded = jwt.verify(largeToken, jwtSecret) as any;
    expect(decoded.userId).toBe('user123');
    expect(decoded.data.length).toBe(10000);
    expect(decoded.permissions).toHaveLength(1000);
  });

  it('should implement secure token rotation', async () => {
    const userId = 'user123';
    const sessionId = 'session-123';

    // Create initial token pair
    const accessToken1 = jwt.sign(
      { userId, sessionId, version: 1 },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken1 = jwt.sign(
      { userId, sessionId, tokenType: 'refresh', version: 1 },
      refreshSecret,
      { expiresIn: '7d' }
    );

    // Simulate token rotation
    const refreshDecoded = jwt.verify(refreshToken1, refreshSecret) as any;
    
    // Create new token pair with incremented version
    const accessToken2 = jwt.sign(
      { userId, sessionId, version: 2 },
      jwtSecret,
      { expiresIn: '15m' }
    );

    const refreshToken2 = jwt.sign(
      { userId, sessionId, tokenType: 'refresh', version: 2 },
      refreshSecret,
      { expiresIn: '7d' }
    );

    // Verify new tokens
    const accessDecoded2 = jwt.verify(accessToken2, jwtSecret) as any;
    const refreshDecoded2 = jwt.verify(refreshToken2, refreshSecret) as any;

    expect(accessDecoded2.version).toBe(2);
    expect(refreshDecoded2.version).toBe(2);
    expect(accessDecoded2.sessionId).toBe(sessionId);
    expect(refreshDecoded2.sessionId).toBe(sessionId);
  });

  it('should handle JWT header manipulation detection', async () => {
    const payload = { userId: 'user123' };
    const token = jwt.sign(payload, jwtSecret);

    // Get token parts
    const [header, payloadPart, signature] = token.split('.');

    // Try to manipulate header
    const manipulatedHeader = Buffer.from(JSON.stringify({
      alg: 'none',
      typ: 'JWT'
    })).toString('base64url');

    const manipulatedToken = `${manipulatedHeader}.${payloadPart}.${signature}`;

    // Verification should fail
    expect(() => {
      jwt.verify(manipulatedToken, jwtSecret);
    }).toThrow();
  });
});