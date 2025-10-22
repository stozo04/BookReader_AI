// scripts/apply-local-env.js
// Copies src/environments/environment.local.ts to src/environments/environment.ts if it exists.
// This is intended for local development only. CI should write real environment.ts via secrets.

const fs = require('fs');
const path = require('path');

const localPath = path.join(__dirname, '..', 'src', 'environments', 'environment.local.ts');
const targetPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');

if (fs.existsSync(localPath)) {
  fs.copyFileSync(localPath, targetPath);
  console.log('Applied local environment from', localPath);
} else {
  console.log('No local environment file found at', localPath);
}
