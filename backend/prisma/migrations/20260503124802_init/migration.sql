-- CreateTable
CREATE TABLE "Trade" (
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
    "screenshotUrl" TEXT
);
