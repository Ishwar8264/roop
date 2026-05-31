/**
 * Purpose: User profile API endpoints — own profile
 * Responsibility: Get own profile and update own profile for authenticated users
 *
 * Endpoints:
 *   GET   /api/users/me         — Get own profile (authenticated user)
 *   PATCH /api/users/me         — Update own profile (authenticated user)
 *
 * GET Response:
 *   200: { success: true, data: user } — Own profile data
 *
 * PATCH Request Body:
 *   name (optional), email (optional), avatarUrl (optional)
 *
 * PATCH Response:
 *   200: { success: true, data: user, message }
 *
 * Error Responses:
 *   401: { success: false, error: "AUTH_*" }
 *   409: { success: false, error: "RES_CONFLICT" } — email already taken
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { ConflictError } from "@/lib/errors";
import { updateProfileSchema } from "@/lib/validations/users";

// ==================== Helper — serialize user for response ====================

function serializeUser(user: {
  id: string;
  mobile: string | null;
  name: string | null;
  email: string | null;
  emailVerified: boolean;
  authProvider: string;
  role: string;
  branchId: string | null;
  avatarUrl: string | null;
  loyaltyPoints: number;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    mobile: user.mobile,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    authProvider: user.authProvider,
    role: user.role,
    branchId: user.branchId,
    avatarUrl: user.avatarUrl,
    loyaltyPoints: user.loyaltyPoints,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() || null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ==================== GET — Own Profile ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    // 1. Require authenticated user
    const { user } = await requireActiveUser(request);

    // 2. Fetch full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true,
        emailVerified: true,
        authProvider: true,
        role: true,
        branchId: true,
        avatarUrl: true,
        loyaltyPoints: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!fullUser) {
      throw new ConflictError("User not found");
    }

    // 3. Return serialized user profile
    return serializeUser(fullUser);
  },
});

// ==================== PATCH — Update Own Profile ====================

export const PATCH = createApiHandler({
  schema: updateProfileSchema,
  successMessage: "Profile updated successfully",
  handler: async ({ parsedBody, request }) => {
    // 1. Require authenticated user
    const { user } = await requireActiveUser(request);

    // 2. If email is being changed, check uniqueness
    if (parsedBody.email && parsedBody.email !== user.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: parsedBody.email },
      });
      if (existingEmail) {
        throw new ConflictError("This email is already registered");
      }
    }

    // 3. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.name !== undefined) updateData.name = parsedBody.name;
    if (parsedBody.email !== undefined) {
      updateData.email = parsedBody.email;
      // Reset email verification if email changed
      updateData.emailVerified = false;
    }
    if (parsedBody.avatarUrl !== undefined) updateData.avatarUrl = parsedBody.avatarUrl;

    // 4. Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        mobile: true,
        name: true,
        email: true,
        emailVerified: true,
        authProvider: true,
        role: true,
        branchId: true,
        avatarUrl: true,
        loyaltyPoints: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 5. Return serialized user profile
    return serializeUser(updatedUser);
  },
});
