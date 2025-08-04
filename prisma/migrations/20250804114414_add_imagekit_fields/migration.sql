-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "imagekit_file_id" TEXT,
ADD COLUMN     "imagekit_file_path" TEXT,
ADD COLUMN     "imagekit_url" TEXT,
ADD COLUMN     "storage_provider" TEXT NOT NULL DEFAULT 'imagekit',
ALTER COLUMN "cloudinary_public_id" DROP NOT NULL,
ALTER COLUMN "cloudinary_url" DROP NOT NULL;

-- CreateTable
CREATE TABLE "document_groups" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "document_group_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "cloudinary_public_id" TEXT,
    "cloudinary_url" TEXT,
    "imagekit_file_id" TEXT,
    "imagekit_url" TEXT,
    "imagekit_file_path" TEXT,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "storage_provider" TEXT NOT NULL DEFAULT 'imagekit',
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version_notes" TEXT,
    "is_latest" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_versions_document_group_id_version_number_key" ON "document_versions"("document_group_id", "version_number");

-- AddForeignKey
ALTER TABLE "document_groups" ADD CONSTRAINT "document_groups_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_group_id_fkey" FOREIGN KEY ("document_group_id") REFERENCES "document_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
