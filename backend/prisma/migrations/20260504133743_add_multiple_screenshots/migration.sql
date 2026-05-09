/*
  Warnings:

  - You are about to drop the column `screenshotUrl` on the `Trade` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "date" DATETIME NOT NULL,
    "ticker" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "entry" REAL NOT NULL,
    "stop" REAL NOT NULL,
    "target" REAL NOT NULL,
    "exit" REAL,
    "contracts" INTEGER NOT NULL,
    "pnl" REAL,
    "rr" REAL,
    "setupGrade" TEXT NOT NULL,
    "notes" TEXT,
    "emotionalState" TEXT NOT NULL,
    "followedPlan" BOOLEAN NOT NULL DEFAULT false,
    "screenshotUrls" TEXT NOT NULL DEFAULT '[]'
);
INSERT INTO "new_Trade" ("contracts", "createdAt", "date", "direction", "emotionalState", "entry", "exit", "followedPlan", "id", "notes", "pnl", "rr", "session", "setupGrade", "stop", "target", "ticker", "updatedAt") SELECT "contracts", "createdAt", "date", "direction", "emotionalState", "entry", "exit", "followedPlan", "id", "notes", "pnl", "rr", "session", "setupGrade", "stop", "target", "ticker", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
