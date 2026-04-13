-- CreateTable
CREATE TABLE "SystemFormula" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemName" TEXT NOT NULL,
    "subsystemName" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemFormula_systemName_subsystemName_componentName_key" ON "SystemFormula"("systemName", "subsystemName", "componentName");
