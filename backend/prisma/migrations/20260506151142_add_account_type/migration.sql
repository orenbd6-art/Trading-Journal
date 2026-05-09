-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "account" TEXT NOT NULL DEFAULT 'DEMO',
    "date" DATETIME NOT NULL,
    "ticker" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "entryTime" TEXT,
    "exitTime" TEXT,
    "entryModel" TEXT,
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
    "screenshotUrls" TEXT
);
INSERT INTO "new_Trade" ("contracts", "createdAt", "date", "direction", "emotionalState", "entry", "entryModel", "entryTime", "exit", "exitTime", "followedPlan", "id", "notes", "pnl", "rr", "screenshotUrls", "session", "setupGrade", "stop", "target", "ticker", "updatedAt") SELECT "contracts", "createdAt", "date", "direction", "emotionalState", "entry", "entryModel", "entryTime", "exit", "exitTime", "followedPlan", "id", "notes", "pnl", "rr", "screenshotUrls", "session", "setupGrade", "stop", "target", "ticker", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
CREATE INDEX "Trade_ticker_idx" ON "Trade"("ticker");
CREATE INDEX "Trade_date_idx" ON "Trade"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
