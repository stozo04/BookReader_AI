// scripts/env.mjs
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const localPath = join(__dirname, '..', 'src', 'environments', 'environment.local.ts');
const targetPath = join(__dirname, '..', 'src', 'environments', 'environment.ts');

if (existsSync(localPath)) {
  copyFileSync(localPath, targetPath);
  console.log('Applied local environment from', localPath);
} else {
  // If local file doesn't exist, but environment variables are present (e.g., in CI or developer shell),
  // generate environment.ts from process.env so builds can proceed without manual copying.
  const haveEnvVars = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SITE_URL;
  if (haveEnvVars) {
    const content = `// Auto-generated environment from process.env (available during build)
export const environment = {
  production: ${process.env.NODE_ENV === 'production'},
  GEMINI_API_KEY: '${process.env.GEMINI_API_KEY || ''}',
  NEXT_PUBLIC_SUPABASE_URL: '${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}',
  SITE_URL: '${process.env.SITE_URL || ''}',
};
`;
    writeFileSync(targetPath, content, { encoding: 'utf8' });
    console.log('Wrote environment.ts from process.env');
  } else {
    console.log('No local environment file found at', localPath);
  }
}