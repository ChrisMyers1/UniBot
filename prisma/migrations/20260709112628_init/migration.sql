-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "adminRoleId" TEXT,
    "logChannelId" TEXT,
    "currentWeekStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dashboardTitle" TEXT NOT NULL DEFAULT 'UniBot Dashboard',
    "dashboardSubtitle" TEXT NOT NULL DEFAULT 'Title',
    "dashboardColor" TEXT NOT NULL DEFAULT '#5865F2',
    "dashboardChannelId" TEXT,
    "dashboardMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clockInAt" TIMESTAMP(3) NOT NULL,
    "clockOutAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeTotal" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TimeTotal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppOption" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "targetChannelId" TEXT NOT NULL,

    CONSTRAINT "AppOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppResponse" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "optionValue" TEXT NOT NULL,
    "optionLabel" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeEntry_guildId_userId_status_idx" ON "TimeEntry"("guildId", "userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TimeTotal_guildId_userId_weekStart_key" ON "TimeTotal"("guildId", "userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "AppOption_guildId_value_key" ON "AppOption"("guildId", "value");

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeTotal" ADD CONSTRAINT "TimeTotal_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppOption" ADD CONSTRAINT "AppOption_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppResponse" ADD CONSTRAINT "AppResponse_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;
