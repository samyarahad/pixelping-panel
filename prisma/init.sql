-- CreateTable
CREATE TABLE "PanelAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VpnUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "quotaBytes" REAL NOT NULL DEFAULT 0,
    "usedBytes" REAL NOT NULL DEFAULT 0,
    "expiryDate" DATETIME,
    "uuid" TEXT NOT NULL,
    "subscriptionToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TrafficLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vpnUserId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "upBytes" REAL NOT NULL DEFAULT 0,
    "downBytes" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrafficLog_vpnUserId_fkey" FOREIGN KEY ("vpnUserId") REFERENCES "VpnUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PanelAdmin_username_key" ON "PanelAdmin"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VpnUser_username_key" ON "VpnUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VpnUser_uuid_key" ON "VpnUser"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "VpnUser_subscriptionToken_key" ON "VpnUser"("subscriptionToken");

-- CreateIndex
CREATE UNIQUE INDEX "TrafficLog_vpnUserId_day_key" ON "TrafficLog"("vpnUserId", "day");

