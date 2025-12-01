/**
 * TinaCMS Build Script
 *
 * Loads environment variables from .env.local before running tinacms build.
 * Next.js loads these automatically, but tinacms CLI needs them explicitly.
 *
 * Run with: npx tsx scripts/tina-build.ts
 */

import { loadEnvConfig } from "@next/env";
import { execSync } from "child_process";

const projectDir = process.cwd();
loadEnvConfig(projectDir);

try {
  execSync("npx tinacms build", {
    stdio: "inherit",
    env: process.env,
  });
} catch {
  process.exit(1);
}
