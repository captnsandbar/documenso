-- AlterEnum
ALTER TYPE "FieldType" ADD VALUE 'ATTACHMENT';

-- CreateTable
CREATE TABLE "FieldUpload" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fieldId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "previewImageAsBase64" TEXT,
    "documentDataId" TEXT NOT NULL,

    CONSTRAINT "FieldUpload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FieldUpload_fieldId_key" ON "FieldUpload"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldUpload_documentDataId_key" ON "FieldUpload"("documentDataId");

-- AddForeignKey
ALTER TABLE "FieldUpload" ADD CONSTRAINT "FieldUpload_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldUpload" ADD CONSTRAINT "FieldUpload_documentDataId_fkey" FOREIGN KEY ("documentDataId") REFERENCES "DocumentData"("id") ON DELETE CASCADE ON UPDATE CASCADE;
