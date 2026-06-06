/**
 * Purpose: Update user profile (name, email, phone)
 * Endpoint: PATCH /api/user/profile
 *
 * Flow:
 *   1. Require auth (requireAuthWithSession)
 *   2. Validate with updateProfileSchema (name, email, phone — at least one)
 *   3. If email is changing: set emailVerified = false, update Account.providerAccountId
 *   4. If phone is changing: set phoneVerified = false, update Account.providerAccountId
 *   5. Update user in DB (with Prisma P2002 handling for race conditions)
 *   6. Return updated user with providers
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAuthWithSession, getUserWithProviders } from "@/features/auth/services/session-service";
import { updateProfileSchema } from "@/features/user/validations/user";
import { AuthEmailTakenError, AuthPhoneTakenError, isAppError, toAppError } from "@/lib/server/errors";
import { HTTP_STATUS, ERROR_CODES } from "@/shared/constants";
import { Prisma } from "@prisma/client";
import type { UpdateProfileInput } from "@/features/user/validations/user";

export async function PATCH(request: NextRequest) {
  try {
    // 1. Require authenticated user with valid session
    const { user } = await requireAuthWithSession(request);

    // 2. Parse and validate request body
    let parsedBody: UpdateProfileInput;
    try {
      const body = await request.json();
      const result = updateProfileSchema.safeParse(body);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        const fieldPath = firstIssue.path.join(".");
        const message = fieldPath ? `${fieldPath}: ${firstIssue.message}` : firstIssue.message;
        return NextResponse.json(
          { success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message, statusCode: HTTP_STATUS.BAD_REQUEST },
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
      parsedBody = result.data;
    } catch {
      return NextResponse.json(
        { success: false, error: ERROR_CODES.VAL_INVALID_INPUT, message: "Invalid JSON in request body.", statusCode: HTTP_STATUS.BAD_REQUEST },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // 3. Build update data + account updates
    const updateData: Record<string, unknown> = {};
    const accountUpdates: { provider: "EMAIL" | "MOBILE"; providerAccountId: string }[] = [];

    if (parsedBody.email !== undefined) {
      const existingUser = await prisma.user.findFirst({
        where: { email: parsedBody.email, NOT: { id: user.id } },
        select: { id: true },
      });
      if (existingUser) throw new AuthEmailTakenError();
      updateData.email = parsedBody.email;
      updateData.emailVerified = false;
      accountUpdates.push({ provider: "EMAIL", providerAccountId: parsedBody.email });
    }

    if (parsedBody.phone !== undefined) {
      const existingUser = await prisma.user.findFirst({
        where: { phone: parsedBody.phone, NOT: { id: user.id } },
        select: { id: true },
      });
      if (existingUser) throw new AuthPhoneTakenError();
      updateData.phone = parsedBody.phone;
      updateData.phoneVerified = false;
      accountUpdates.push({ provider: "MOBILE", providerAccountId: parsedBody.phone });
    }

    if (parsedBody.name !== undefined) {
      updateData.name = parsedBody.name;
    }

    if (parsedBody.avatarUrl !== undefined) {
      updateData.avatarUrl = parsedBody.avatarUrl;
    }

    // 4. Update user + accounts in transaction (handles race conditions)
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: user.id }, data: updateData });

        // Update Account.providerAccountId for changed email/phone (parallel)
        await Promise.all(
          accountUpdates.map(({ provider, providerAccountId }) =>
            tx.account.updateMany({
              where: { userId: user.id, provider },
              data: { providerAccountId },
            })
          )
        );
      });
    } catch (error) {
      // Handle Prisma P2002 unique constraint violation (race condition)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const field = (error.meta?.target as string[])?.[0];
        if (field === "email") throw new AuthEmailTakenError();
        if (field === "phone") throw new AuthPhoneTakenError();
      }
      throw error;
    }

    // 5. Return updated user with providers
    const updatedUser = await getUserWithProviders(user.id);

    return NextResponse.json(
      { success: true, data: updatedUser, message: "Profile updated successfully." },
      { status: HTTP_STATUS.OK }
    );
  } catch (error: unknown) {
    if (isAppError(error)) {
      return NextResponse.json(
        { success: false, error: error.code, message: error.message, statusCode: error.statusCode },
        { status: error.statusCode }
      );
    }
    const appError = toAppError(error);
    console.error("[UNHANDLED_ERROR]", error);
    return NextResponse.json(
      { success: false, error: appError.code, message: appError.message, statusCode: appError.statusCode },
      { status: appError.statusCode }
    );
  }
}
