-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DoorSystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "minWidth" INTEGER NOT NULL,
    "maxWidth" INTEGER NOT NULL,
    "maxFullWidth" INTEGER,
    "hasExtraField" BOOLEAN NOT NULL DEFAULT false,
    "minHeight" INTEGER NOT NULL DEFAULT 1800,
    "maxHeight" INTEGER NOT NULL DEFAULT 3500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT,
    "posterUrl" TEXT,
    "tooltipWidthUrl" TEXT,
    "tooltipHeightUrl" TEXT,
    "tooltipOpenUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DoorSystem" ("createdAt", "hasExtraField", "id", "isActive", "maxFullWidth", "maxWidth", "minWidth", "name", "posterUrl", "slug", "sortOrder", "tooltipHeightUrl", "tooltipOpenUrl", "tooltipWidthUrl", "updatedAt", "videoUrl") SELECT "createdAt", "hasExtraField", "id", "isActive", "maxFullWidth", "maxWidth", "minWidth", "name", "posterUrl", "slug", "sortOrder", "tooltipHeightUrl", "tooltipOpenUrl", "tooltipWidthUrl", "updatedAt", "videoUrl" FROM "DoorSystem";
DROP TABLE "DoorSystem";
ALTER TABLE "new_DoorSystem" RENAME TO "DoorSystem";
CREATE UNIQUE INDEX "DoorSystem_slug_key" ON "DoorSystem"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
