import { describe, it, expect } from 'vitest';
import { computeFingerprintHash, Fingerprint } from '../index.js';

describe('computeFingerprintHash', () => {
  const baseFingerprint: Fingerprint = {
    languages: ['TypeScript'],
    frameworks: ['Next.js'],
    fileTree: ['src/index.ts'],
    existingConfigs: {},
  };

  it('produces deterministic SHA-256 hash', () => {
    const fp = { ...baseFingerprint, gitRemoteUrl: 'https://github.com/test/repo', packageName: 'my-app' };
    const hash1 = computeFingerprintHash(fp);
    const hash2 = computeFingerprintHash(fp);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('uses gitRemoteUrl and packageName as key', () => {
    const fp1 = { ...baseFingerprint, gitRemoteUrl: 'https://github.com/a/b', packageName: 'app-a' };
    const fp2 = { ...baseFingerprint, gitRemoteUrl: 'https://github.com/a/b', packageName: 'app-b' };
    expect(computeFingerprintHash(fp1)).not.toBe(computeFingerprintHash(fp2));
  });

  it('handles missing gitRemoteUrl and packageName', () => {
    const hash = computeFingerprintHash(baseFingerprint);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('same hash for fingerprints with same url and package but different languages', () => {
    const fp1 = { ...baseFingerprint, gitRemoteUrl: 'git@github.com:test/repo', packageName: 'app' };
    const fp2 = { ...fp1, languages: ['Python', 'Go'] };
    expect(computeFingerprintHash(fp1)).toBe(computeFingerprintHash(fp2));
  });
});
