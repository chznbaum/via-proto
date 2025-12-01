/**
 * TinaCMS Build Script
 *
 * Loads environment variables from .env.local before running tinacms build.
 * This is necessary because tinacms CLI doesn't load Next.js env files.
 *
 * Run with: npx tsx scripts/tina-build.ts
 */

import { loadEnvConfig } from '@next/env';
import { execSync } from 'child_process';

// Load environment variables
const projectDir = process.cwd();
loadEnvConfig(projectDir);

// Run tinacms build
try {
  execSync('npx tinacms build', {
    stdio: 'inherit',
    env: process.env
  });
} catch (error) {
  process.exit(1);
}
