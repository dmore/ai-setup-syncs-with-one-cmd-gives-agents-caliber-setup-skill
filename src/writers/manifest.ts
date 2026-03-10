import fs from 'fs';
import crypto from 'crypto';
import { CALIBER_DIR, MANIFEST_FILE } from '../constants.js';

export interface ManifestEntry {
  path: string;
  action: 'created' | 'modified' | 'deleted';
  checksum: string;
  timestamp: string;
}

export interface Manifest {
  version: 1;
  backupDir?: string;
  entries: ManifestEntry[];
}

export function readManifest(): Manifest | null {
  try {
    if (!fs.existsSync(MANIFEST_FILE)) return null;
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

export function writeManifest(manifest: Manifest) {
  if (!fs.existsSync(CALIBER_DIR)) {
    fs.mkdirSync(CALIBER_DIR, { recursive: true });
  }
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
}

export function fileChecksum(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}
