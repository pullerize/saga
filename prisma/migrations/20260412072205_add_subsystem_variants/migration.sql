-- CreateTable
CREATE TABLE "SubsystemVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemSlug" TEXT NOT NULL,
    "subsystemName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SubsystemVariantItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "iconUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubsystemVariantItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "SubsystemVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SubsystemVariant_systemSlug_subsystemName_key" ON "SubsystemVariant"("systemSlug", "subsystemName");
