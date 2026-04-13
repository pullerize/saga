-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PARTNER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "companyName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DoorSystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "minWidth" INTEGER NOT NULL,
    "maxWidth" INTEGER NOT NULL,
    "maxFullWidth" INTEGER,
    "hasExtraField" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT,
    "posterUrl" TEXT,
    "tooltipWidthUrl" TEXT,
    "tooltipHeightUrl" TEXT,
    "tooltipOpenUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subsystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minWidth" INTEGER NOT NULL,
    "maxWidth" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "videoUrl" TEXT,
    "posterUrl" TEXT,
    "params" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subsystem_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "DoorSystem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Component" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'шт',
    "category" TEXT NOT NULL DEFAULT 'component',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "defaultPrice" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PartnerPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partnerId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PartnerPrice_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PartnerPrice_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Component" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GlassType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "defaultPrice" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "mobileImageUrl" TEXT,
    "restrictedShotlans" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ShotlanOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "mobileImageUrl" TEXT,
    "calcMethod" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdditionalService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPrice" REAL NOT NULL,
    "priceUnit" TEXT NOT NULL DEFAULT 'per_sqm',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showInPdf" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "systemId" TEXT NOT NULL,
    "subsystemId" TEXT NOT NULL,
    "fullWidth" INTEGER NOT NULL,
    "openWidth" INTEGER,
    "height" INTEGER NOT NULL,
    "doorWidth" INTEGER NOT NULL,
    "glassType" TEXT NOT NULL,
    "shotlanType" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "totalPrice" REAL NOT NULL,
    "services" JSONB,
    "pdfUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Calculation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Calculation_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "DoorSystem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Calculation_subsystemId_fkey" FOREIGN KEY ("subsystemId") REFERENCES "Subsystem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DoorSystem_slug_key" ON "DoorSystem"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subsystem_systemId_name_key" ON "Subsystem"("systemId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Component_key_key" ON "Component"("key");

-- CreateIndex
CREATE UNIQUE INDEX "PartnerPrice_partnerId_componentId_key" ON "PartnerPrice"("partnerId", "componentId");

-- CreateIndex
CREATE UNIQUE INDEX "GlassType_name_key" ON "GlassType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ShotlanOption_name_key" ON "ShotlanOption"("name");
