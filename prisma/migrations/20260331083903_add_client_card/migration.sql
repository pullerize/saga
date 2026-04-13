-- CreateTable
CREATE TABLE "ClientCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientName" TEXT NOT NULL,
    "clientPhone" TEXT NOT NULL,
    "clientAddress" TEXT NOT NULL DEFAULT '',
    "managerName" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
