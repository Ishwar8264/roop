/**
 * Purpose: Loyalty feature types — shared across service, routes, and client
 * Responsibility: Type definitions for loyalty balance, transactions, and redemption APIs
 * Important Notes:
 *   - These are API response types — never expose raw Prisma models
 *   - EARN is already handled in booking-service on COMPLETE
 *   - This API is for balance check, transaction history, REDEEM, and EXPIRE
 *   - Date fields returned as ISO strings for frontend convenience
 */

// ==================== ENUMS ====================

/** Loyalty transaction type — mirrors Prisma LoyaltyTransactionType enum */
export type LoyaltyTransactionType = "EARN" | "REDEEM" | "EXPIRE";

// ==================== BALANCE ====================

/** Response for GET /api/loyalty/balance */
export interface LoyaltyBalanceResponse {
  currentPoints: number;
  totalEarned: number;
  totalRedeemed: number;
  totalExpired: number;
}

// ==================== TRANSACTION ====================

/** Single transaction in list response */
export interface LoyaltyTransactionItemResponse {
  id: string;
  type: LoyaltyTransactionType;
  points: number;
  bookingId: string | null;
  reason: string;
  createdAt: string;
}

/** Paginated transaction list response */
export interface LoyaltyTransactionListResponse {
  transactions: LoyaltyTransactionItemResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== REDEEM ====================

/** Response for POST /api/loyalty/redeem */
export interface RedeemPointsResponse {
  transactionId: string;
  points: number;
  remainingBalance: number;
  message: string;
}

// ==================== EXPIRE ====================

/** Response for POST /api/loyalty/expire */
export interface ExpirePointsResponse {
  expiredCount: number;
  totalPointsExpired: number;
  message: string;
}

// ==================== QUERY / FILTER TYPES ====================

/** Query params for GET /api/loyalty/transactions */
export interface LoyaltyTransactionListQuery {
  type?: LoyaltyTransactionType;
  page?: number;
  limit?: number;
}
