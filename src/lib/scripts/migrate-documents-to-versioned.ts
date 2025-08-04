/**
 * Migration script to convert existing documents to the versioned system
 * This script should be run once after the database schema is updated
 */

import { db } from "@/lib/db";

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
}

export async function migrateDocumentsToVersioned(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    skippedCount: 0,
    errors: [],
  };

  try {
    console.log("Starting document migration to versioned system...");

    // Get all existing documents that haven't been migrated yet
    const existingDocuments = await db.document.findMany({
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        uploadedAt: "asc", // Migrate oldest first to maintain chronological order
      },
    });

    console.log(`Found ${existingDocuments.length} documents to migrate`);

    if (existingDocuments.length === 0) {
      console.log("No documents to migrate");
      return result;
    }

    // Group documents by project and original filename
    const documentsByProject = new Map<string, Map<string, typeof existingDocuments>>();

    for (const doc of existingDocuments) {
      if (!documentsByProject.has(doc.projectId)) {
        documentsByProject.set(doc.projectId, new Map());
      }
      
      const projectDocs = documentsByProject.get(doc.projectId)!;
      if (!projectDocs.has(doc.originalFilename)) {
        projectDocs.set(doc.originalFilename, []);
      }
      
      projectDocs.get(doc.originalFilename)!.push(doc);
    }

    // Process each project's documents
    for (const [projectId, projectDocs] of documentsByProject) {
      console.log(`Migrating documents for project ${projectId}...`);
      
      for (const [originalFilename, docs] of projectDocs) {
        try {
          // Create a document group for this filename
          const documentGroup = await db.documentGroup.create({
            data: {
              projectId,
              name: originalFilename,
              createdAt: docs[0].uploadedAt, // Use the earliest upload time
              updatedAt: docs[docs.length - 1].uploadedAt, // Use the latest upload time
            },
          });

          console.log(`Created document group "${originalFilename}" for project ${projectId}`);

          // Convert each document to a version
          for (let i = 0; i < docs.length; i++) {
            const doc = docs[i];
            const versionNumber = i + 1;
            const isLatest = i === docs.length - 1; // Last document is the latest version

            await db.documentVersion.create({
              data: {
                documentGroupId: documentGroup.id,
                versionNumber,
                filename: doc.filename,
                originalFilename: doc.originalFilename,
                cloudinaryPublicId: doc.cloudinaryPublicId,
                cloudinaryUrl: doc.cloudinaryUrl,
                imagekitFileId: doc.imagekitFileId,
                imagekitUrl: doc.imagekitUrl,
                imagekitFilePath: doc.imagekitFilePath,
                fileSize: doc.fileSize,
                mimeType: doc.mimeType,
                storageProvider: doc.storageProvider,
                uploadedById: doc.uploadedById,
                uploadedAt: doc.uploadedAt,
                versionNotes: i === 0 
                  ? "Migrated from legacy system - initial version" 
                  : `Migrated from legacy system - version ${versionNumber}`,
                isLatest,
              },
            });

            console.log(`  Migrated document ${doc.id} as version ${versionNumber}`);
            result.migratedCount++;
          }

          console.log(`Completed migration for "${originalFilename}" (${docs.length} versions)`);

        } catch (error) {
          const errorMessage = `Failed to migrate document group "${originalFilename}" in project ${projectId}: ${error}`;
          console.error(errorMessage);
          result.errors.push(errorMessage);
          result.success = false;
        }
      }
    }

    console.log(`Migration completed: ${result.migratedCount} documents migrated`);

    if (result.success && result.errors.length === 0) {
      console.log("All documents migrated successfully!");
      console.log("⚠️  Note: The original documents table still contains the legacy data.");
      console.log("   You can safely remove it after verifying the migration was successful.");
    } else {
      console.log(`Migration completed with ${result.errors.length} errors`);
    }

  } catch (error) {
    const errorMessage = `Migration failed: ${error}`;
    console.error(errorMessage);
    result.errors.push(errorMessage);
    result.success = false;
  }

  return result;
}

// Helper function to verify the migration
export async function verifyMigration(): Promise<{
  originalCount: number;
  migratedCount: number;
  documentGroups: number;
}> {
  const [originalDocuments, documentVersions, documentGroups] = await Promise.all([
    db.document.count(),
    db.documentVersion.count(),
    db.documentGroup.count(),
  ]);

  return {
    originalCount: originalDocuments,
    migratedCount: documentVersions,
    documentGroups,
  };
}

// Function to rollback migration (use with caution)
export async function rollbackMigration(): Promise<void> {
  console.log("⚠️  Rolling back migration - deleting all versioned documents...");
  
  await db.documentVersion.deleteMany({});
  await db.documentGroup.deleteMany({});
  
  console.log("Rollback completed. Original documents are still intact.");
}

// Main function for running the migration
export async function runMigration() {
  try {
    console.log("=== Document Version Control Migration ===");
    
    // Check current state
    const preCheck = await verifyMigration();
    console.log(`Current state:`);
    console.log(`  - Original documents: ${preCheck.originalCount}`);
    console.log(`  - Versioned documents: ${preCheck.migratedCount}`);
    console.log(`  - Document groups: ${preCheck.documentGroups}`);
    
    if (preCheck.migratedCount > 0) {
      console.log("⚠️  Migration appears to have already run. Checking if new documents need migration...");
    }

    // Run migration
    const result = await migrateDocumentsToVersioned();
    
    // Verify results
    const postCheck = await verifyMigration();
    console.log(`\nPost-migration state:`);
    console.log(`  - Original documents: ${postCheck.originalCount}`);
    console.log(`  - Versioned documents: ${postCheck.migratedCount}`);
    console.log(`  - Document groups: ${postCheck.documentGroups}`);
    
    if (result.success) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log(`\n❌ Migration completed with errors:`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
  } catch (error) {
    console.error("Migration script failed:", error);
    throw error;
  }
}