/**
 * Purpose: Admin user management API endpoints
 * Responsibility: Get any user detail (admin) and update any user (admin)
 *
 * Endpoints:
 *   GET   /api/users/[id]   — Get any user's detail (admin only)
 *   PATCH /api/users/[id]   — Update any user's data (admin only)
 *
 * GET Response:
 *   200: { success: true, data: user } — Full user detail
 *
 * PATCH Request Body:
 *   name (optional), email (optional), role (optional),
 *   isActive (optional), branchId (optional, nullable)
 *
 * PATCH Response:
 *   200: { success: true, data: user, message }
 *
 * Error Responses:
 *   403: { success: false, error: "PERM_ADMIN_REQUIRED" }
 *   404: { success: false, error: "RES_NOT_FOUND" }
 *   409: { success: false, error: "RES_CONFLICT" } — email already taken
 */

import { createApiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";
import { requireActiveUser } from "@/lib/auth-helpers";
import { NotFoundError, ConflictError, AdminRequiredError } from "@/lib/errors";
import { adminUpdateUserSchema } from "@/lib/validations/users";

// ==================== Helper — extract [id] from URL ====================

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split("/");
  const idIndex = segments.indexOf("users") + 1;
  return segments[idIndex] || null;
}

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

// ==================== GET — User Detail (Admin) ====================

export const GET = createApiHandler({
  schema: null,
  handler: async ({ request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("User not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Fetch target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
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

    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // 3. Return serialized user
    return serializeUser(targetUser);
  },
});

// ==================== PATCH — Update User (Admin) ====================

export const PATCH = createApiHandler({
  schema: adminUpdateUserSchema,
  successMessage: "User updated successfully",
  handler: async ({ parsedBody, request }) => {
    const id = extractIdFromUrl(request);
    if (!id) {
      throw new NotFoundError("User not found");
    }

    // 1. Verify admin access
    const { user } = await requireActiveUser(request);
    if (user.role !== "ADMIN") {
      throw new AdminRequiredError();
    }

    // 2. Check target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    // 3. If email is being changed, check uniqueness
    if (parsedBody.email && parsedBody.email !== targetUser.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: parsedBody.email },
      });
      if (existingEmail) {
        throw new ConflictError("This email is already registered");
      }
    }

    // 4. If branchId is provided, verify branch exists
    if (parsedBody.branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: parsedBody.branchId },
      });
      if (!branch) {
        throw new NotFoundError("Branch not found");
      }
    }

    // 5. Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};

    if (parsedBody.name !== undefined) updateData.name = parsedBody.name;
    if (parsedBody.email !== undefined) {
      updateData.email = parsedBody.email;
      updateData.emailVerified = false;
    }
    if (parsedBody.role !== undefined) updateData.role = parsedBody.role;
    if (parsedBody.isActive !== undefined) updateData.isActive = parsedBody.isActive;
    if (parsedBody.branchId !== undefined) updateData.branchId = parsedBody.branchId;

    // 6. Update user
    const updatedUser = await prisma.user.update({
      where: { id },
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

    // 7. Return serialized user
    return serializeUser(updatedUser);
  },
});
