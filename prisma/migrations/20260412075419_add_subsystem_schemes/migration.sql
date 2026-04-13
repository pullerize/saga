-- CreateTable
CREATE TABLE "SubsystemScheme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "variantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "svgContent" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubsystemScheme_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "SubsystemVariant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
