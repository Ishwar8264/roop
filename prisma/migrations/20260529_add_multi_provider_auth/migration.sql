-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('MOBILE', 'EMAIL', 'GOOGLE');

-- AlterEnum
ALTER TYPE "AuthEventType" ADD VALUE 'REGISTER_EMAIL';
ALTER TYPE "AuthEventType" ADD VALUE 'REGISTER_GOOGLE';
ALTER TYPE "AuthEventType" ADD VALUE 'LOGIN_EMAIL';
ALTER TYPE "AuthEventType" ADD VALUE 'LOGIN_GOOGLE';

-- DropForeignKey
ALTER TABLE "auth_otps" DROP CONSTRAINT "auth_otps_mobile_fkey";

-- AlterTable
ALTER TABLE "auth_events" ALTER COLUMN "mobile" DROP NOT NULL;

-- AlterTable
ALTER TABLE "auth_otps" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'MOBILE',
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "password" TEXT,
ALTER COLUMN "mobile" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "auth_otps_userId_idx" ON "auth_otps"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_googleId_idx" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_authProvider_idx" ON "users"("authProvider");

-- AddForeignKey
ALTER TABLE "auth_otps" ADD CONSTRAINT "auth_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
