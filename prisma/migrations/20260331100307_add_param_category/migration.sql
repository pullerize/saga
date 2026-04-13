-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParamDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ParamDefinition" ("createdAt", "id", "key", "label", "updatedAt") SELECT "createdAt", "id", "key", "label", "updatedAt" FROM "ParamDefinition";
DROP TABLE "ParamDefinition";
ALTER TABLE "new_ParamDefinition" RENAME TO "ParamDefinition";
CREATE UNIQUE INDEX "ParamDefinition_key_key" ON "ParamDefinition"("key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
