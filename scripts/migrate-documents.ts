#!/usr/bin/env tsx

/**
 * Migration script runner for converting existing documents to versioned system
 * 
 * Usage:
 *   npm run migrate:documents
 *   or
 *   npx tsx scripts/migrate-documents.ts
 */

import { runMigration } from "../src/lib/scripts/migrate-documents-to-versioned";

async function main() {
  try {
    await runMigration();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();