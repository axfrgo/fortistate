/*
  Warnings:

  - You are about to drop the `VisualStudioAccess` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VisualStudioSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "VisualStudioAccess_userId_orgId_key";

-- DropIndex
DROP INDEX "VisualStudioAccess_lastActiveAt_idx";

-- DropIndex
DROP INDEX "VisualStudioAccess_isActive_idx";

-- DropIndex
DROP INDEX "VisualStudioAccess_accessToken_idx";

-- DropIndex
DROP INDEX "VisualStudioAccess_orgId_idx";

-- DropIndex
DROP INDEX "VisualStudioAccess_userId_idx";

-- DropIndex
DROP INDEX "VisualStudioAccess_accessToken_key";

-- DropIndex
DROP INDEX "VisualStudioSession_startedAt_idx";

-- DropIndex
DROP INDEX "VisualStudioSession_isActive_idx";

-- DropIndex
DROP INDEX "VisualStudioSession_sessionId_idx";

-- DropIndex
DROP INDEX "VisualStudioSession_orgId_idx";

-- DropIndex
DROP INDEX "VisualStudioSession_userId_idx";

-- DropIndex
DROP INDEX "VisualStudioSession_sessionId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VisualStudioAccess";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "VisualStudioSession";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logo" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" TEXT NOT NULL DEFAULT 'active',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "hasEnterpriseAccess" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Organization" ("createdAt", "domain", "id", "logo", "name", "plan", "slug", "status", "subscriptionTier", "updatedAt") SELECT "createdAt", "domain", "id", "logo", "name", "plan", "slug", "status", "subscriptionTier", "updatedAt" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
CREATE INDEX "Organization_status_idx" ON "Organization"("status");
CREATE INDEX "Organization_hasEnterpriseAccess_idx" ON "Organization"("hasEnterpriseAccess");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
