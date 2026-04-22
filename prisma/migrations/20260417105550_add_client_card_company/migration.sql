-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClientCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL DEFAULT '',
    "managerName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "systemSlug" TEXT,
    "systemName" TEXT NOT NULL,
    "subsystem" TEXT NOT NULL,
    "glass" TEXT NOT NULL,
    "shotlan" TEXT NOT NULL,
    "fullWidth" INTEGER NOT NULL,
    "openWidth" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL,
    "doorWidth" INTEGER NOT NULL,
    "totalPrice" REAL NOT NULL,
    "components" JSONB NOT NULL,
    "createdByUserId" TEXT,
    "companyName" TEXT NOT NULL DEFAULT 'Saga Group',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ClientCard" ("branch", "clientAddress", "clientName", "clientPhone", "components", "createdAt", "doorWidth", "fullWidth", "glass", "height", "id", "managerName", "openWidth", "shotlan", "subsystem", "systemName", "systemSlug", "totalPrice", "updatedAt") SELECT "branch", "clientAddress", "clientName", "clientPhone", "components", "createdAt", "doorWidth", "fullWidth", "glass", "height", "id", "managerName", "openWidth", "shotlan", "subsystem", "systemName", "systemSlug", "totalPrice", "updatedAt" FROM "ClientCard";
DROP TABLE "ClientCard";
ALTER TABLE "new_ClientCard" RENAME TO "ClientCard";
CREATE INDEX "ClientCard_companyName_idx" ON "ClientCard"("companyName");
CREATE INDEX "ClientCard_createdByUserId_idx" ON "ClientCard"("createdByUserId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
