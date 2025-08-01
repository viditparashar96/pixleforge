/*
  Warnings:

  - You are about to drop the column `file_path` on the `documents` table. All the data in the column will be lost.
  - Added the required column `cloudinary_public_id` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cloudinary_url` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "file_path",
ADD COLUMN     "cloudinary_public_id" TEXT NOT NULL,
ADD COLUMN     "cloudinary_url" TEXT NOT NULL;
