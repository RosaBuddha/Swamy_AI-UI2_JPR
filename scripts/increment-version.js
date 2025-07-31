#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION_FILE = path.join(__dirname, '..', 'VERSION');

try {
  // Read current version
  const currentVersion = fs.readFileSync(VERSION_FILE, 'utf8').trim();
  const currentNumber = parseInt(currentVersion, 10);
  
  if (isNaN(currentNumber)) {
    console.error('Invalid version format in VERSION file');
    process.exit(1);
  }
  
  // Increment version
  const newNumber = currentNumber + 1;
  const newVersion = newNumber.toString().padStart(5, '0');
  
  // Write new version
  fs.writeFileSync(VERSION_FILE, newVersion);
  
  console.log(`Version incremented: ${currentVersion} → ${newVersion}`);
  
  // Write version info for build
  const versionInfo = {
    version: newVersion,
    timestamp: new Date().toISOString(),
    buildDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'version-info.json'),
    JSON.stringify(versionInfo, null, 2)
  );
  
  console.log(`Build info written: v.${newVersion}`);
  
} catch (error) {
  console.error('Error incrementing version:', error.message);
  process.exit(1);
}