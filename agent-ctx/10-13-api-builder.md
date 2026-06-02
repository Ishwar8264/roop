# Task 10-13: Offers + Promos, Payments + Refunds, Reviews, Loyalty Points

## Agent: api-builder

## Summary
Built 17 route files with 22 API endpoints across 4 feature areas for the Nikharta Roop Beauty Parlour Booking Platform.

## Files Created

### Validation Schemas (4 files)
- `src/lib/validations/offers/index.ts` — createOfferSchema, updateOfferSchema, listOffersQuerySchema, validateOfferSchema, linkOfferServicesSchema
- `src/lib/validations/payments/index.ts` — createPaymentSchema, verifyPaymentSchema, listPaymentsQuerySchema, createRefundSchema, processRefundSchema
- `src/lib/validations/reviews/index.ts` — createReviewSchema, listReviewsQuerySchema, updateReviewSchema
- `src/lib/validations/loyalty/index.ts` — redeemPointsSchema, expirePointsSchema, listHistoryQuerySchema

### Feature 1: Offers + Promos (4 route files)
- `src/app/api/offers/route.ts` — GET (public list), POST (admin create)
- `src/app/api/offers/[id]/route.ts` — GET (detail), PATCH (admin update), DELETE (admin soft-delete)
- `src/app/api/offers/[id]/services/route.ts` — GET (linked services), POST (admin link), DELETE (admin unlink)
- `src/app/api/offers/validate/route.ts` — POST (public validate promo code)

### Feature 2: Payments + Refunds (6 route files)
- `src/app/api/payments/route.ts` — GET (admin/staff list)
- `src/app/api/payments/[id]/route.ts` — GET (admin/staff detail)
- `src/app/api/payments/create-order/route.ts` — POST (auth create order)
- `src/app/api/payments/verify/route.ts` — POST (auth verify payment)
- `src/app/api/refunds/route.ts` — POST (admin create refund)
- `src/app/api/refunds/[id]/route.ts` — PATCH (admin process refund)

### Feature 3: Reviews (3 route files)
- `src/app/api/reviews/route.ts` — GET (public list), POST (auth create)
- `src/app/api/reviews/[id]/route.ts` — GET (detail), PATCH (admin approve/disapprove)
- `src/app/api/services/[id]/reviews/route.ts` — GET (public service reviews)

### Feature 4: Loyalty Points (4 route files)
- `src/app/api/loyalty/balance/route.ts` — GET (auth balance)
- `src/app/api/loyalty/history/route.ts` — GET (auth history)
- `src/app/api/loyalty/redeem/route.ts` — POST (auth redeem)
- `src/app/api/loyalty/expire/route.ts` — POST (admin expire)

### Updated Files
- `src/lib/validations/index.ts` — Added exports for offers, payments, reviews, loyalty

## Patterns Followed
- All handlers use `createApiHandler` from `@/lib/api-handler`
- Auth via `requireActiveUser` from `@/lib/auth-helpers`
- Admin-only routes check `user.role === "ADMIN"` and throw `AdminRequiredError()`
- All Decimal fields serialized with `.toString()`
- Paginated lists return `{ items, pagination: { page, pageSize, total, totalPages } }`
- URL IDs extracted via `new URL(request.url).pathname.split("/")`
- Soft deletes via `isActive: false`
- Public GET endpoints require no auth
- JSDoc headers on all files

## Lint Status
- ESLint passed with no errors
