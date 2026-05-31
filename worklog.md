---
Task ID: 1
Agent: main
Task: Fix Swagger UI + Verify all 3 auth methods working

Work Log:
- Diagnosed Swagger UI failing with `adapterFn is not a function` error (swagger-ui-react incompatible with React 19)
- Uninstalled `swagger-ui-react`, `swagger-ui-dist`, `@types/swagger-ui-react`
- Installed `@scalar/api-reference-react` as modern replacement
- Rewrote `/api-docs/page.tsx` using Scalar web component approach with dynamic import
- Added spinner animation keyframe to `globals.css`
- Added `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env` and `.env.example`
- Verified build passes successfully
- Tested all auth endpoints via curl

Stage Summary:
- Swagger UI replaced with Scalar API Reference (React 19 compatible)
- All 3 auth methods fully implemented and tested
- All auth data properly saves to PostgreSQL via Prisma
- 8 API endpoints documented in OpenAPI spec

---
Task ID: 1
Agent: main
Task: Build Packages API endpoints (Phase 3.1)

Work Log:
- Created validation schemas for packages at src/lib/validations/packages/index.ts
- Built GET/POST /api/packages route — list active packages (public) + create package (admin)
- Built GET/PATCH/DELETE /api/packages/[id] route — detail (public) + update (admin) + soft delete (admin)
- Built GET/POST/DELETE /api/packages/[id]/services route — list linked services (public) + bulk link (admin) + unlink (admin)
- Updated swagger spec with packages tag, 7 endpoint paths, and all request/response schemas
- Updated validations barrel export at src/lib/validations/index.ts
- Bumped API version to 1.2.0
- Lint check passed with no errors

Stage Summary:
- 7 endpoints created for Packages feature
- All endpoints follow createApiHandler pattern
- Auth: requireActiveUser + role check for admin routes
- Soft delete only (isActive = false) — no actual record deletion
- All monetary values serialized as Decimal strings
- Swagger docs updated with Hindi-first descriptions
- Duplicate service linking handled gracefully (skip instead of error)

---
Task ID: 5-6
Agent: api-builder
Task: Build Service Categories + Services/Variants/AddOns API endpoints

Work Log:
- Created validation schemas for service-categories at src/lib/validations/service-categories/index.ts
  - createCategorySchema, updateCategorySchema, listCategoriesQuerySchema
- Created validation schemas for services at src/lib/validations/services/index.ts
  - createServiceSchema, updateServiceSchema, listServicesQuerySchema
  - createVariantSchema, updateVariantSchema
  - createAddOnSchema, updateAddOnSchema
- Built GET/POST /api/service-categories route — list categories (public) + create category (admin)
- Built GET/PATCH/DELETE /api/service-categories/[id] route — detail (public) + update (admin) + soft delete (admin)
- Built GET/POST /api/services route — list services with branchId/categoryId filters (public) + create service (admin)
- Built GET/PATCH/DELETE /api/services/[id] route — detail with variants+addons (public) + update (admin) + soft delete (admin)
- Built GET/POST /api/services/[id]/variants route — list variants (public) + add variant (admin)
- Built PATCH/DELETE /api/services/[id]/variants/[vid] route — update variant (admin) + delete variant (admin)
- Built GET/POST /api/services/[id]/addons route — list add-ons (public) + add add-on (admin)
- Built PATCH/DELETE /api/services/[id]/addons/[aid] route — update add-on (admin) + delete add-on (admin)
- Updated validations barrel export at src/lib/validations/index.ts with service-categories and services exports
- Lint check passed with no errors

Stage Summary:
- 7 route files created (2 for service-categories, 5 for services/variants/addons)
- 14 API endpoints total across both features
- All endpoints follow createApiHandler pattern
- Auth: requireActiveUser + role check for admin routes
- Public GET endpoints show only isActive: true items
- Soft delete for service categories and services (isActive = false)
- Hard delete for variants and add-ons (as per task specification)
- All Decimal fields serialized with .toString()
- Paginated lists return { items, pagination: { page, pageSize, total, totalPages } }
- Service detail includes variants and addOns in response
- Slug uniqueness checked on create and update for both categories and services

---
Task ID: 3-4
Agent: api-builder
Task: Build Branch + Holidays & User Profile API endpoints

Work Log:
- Created validation schemas for branches at src/lib/validations/branches/index.ts
  - createBranchSchema, updateBranchSchema, listBranchesQuerySchema, createHolidaySchema
- Created validation schemas for users at src/lib/validations/users/index.ts
  - updateProfileSchema, changePasswordSchema, adminUpdateUserSchema
- Built GET/POST /api/branches route — list branches with city/isActive filters (public, paginated) + create branch (admin)
- Built GET/PATCH/DELETE /api/branches/[id] route — detail with holidays (public) + update (admin) + soft delete (admin)
- Built GET/POST /api/branches/[id]/holidays route — list holidays (public) + add holiday (admin, with duplicate date check)
- Built DELETE /api/branches/[id]/holidays/[hid] route — remove holiday (admin)
- Built GET/PATCH /api/users/me route — own profile (authenticated) + update own profile (with email uniqueness check)
- Built PATCH /api/users/me/password route — change password (bcryptjs verify + hash)
- Built GET/PATCH /api/users/[id] route — any user detail (admin) + update any user (admin, with branch existence check)
- Updated validations barrel export at src/lib/validations/index.ts with branches and users exports
- Lint check passed with no errors

Stage Summary:
- 7 route files created (4 for branches/holidays, 3 for users)
- 11 API endpoints total across both features
- All endpoints follow createApiHandler pattern
- Auth: requireActiveUser + role check for admin routes
- Public GET endpoints for branches (no auth required)
- Soft delete for branches (isActive = false)
- Hard delete for holidays (actual removal)
- Time fields serialized to HH:MM format, Date fields to YYYY-MM-DD
- Password change uses bcryptjs for verify and hash
- Email change resets emailVerified flag
- Admin user update validates branch existence for branchId

---
Task ID: 7-9
Agent: api-builder
Task: Build Staff + Services + Leaves, Slot Availability, and Bookings API endpoints

Work Log:
- Created validation schemas for staff at src/lib/validations/staff/index.ts
  - createStaffSchema, updateStaffSchema, listStaffQuerySchema, linkStaffServicesSchema, addLeaveSchema
- Created validation schemas for slots at src/lib/validations/slots/index.ts
  - availableSlotsQuerySchema (branchId, serviceId, date, staffId opt, variantId opt)
- Created validation schemas for bookings at src/lib/validations/bookings/index.ts
  - createBookingSchema, listBookingsQuerySchema, cancelBookingSchema, statusUpdateSchema
- Built GET/POST /api/staff route — list staff with branchId/isAvailable filters (public, paginated) + create staff profile (admin)
- Built GET/PATCH/DELETE /api/staff/[id] route — detail with services+leaves (public) + update (admin) + soft delete by setting isAvailable=false (admin)
- Built GET/POST/DELETE /api/staff/[id]/services route — list staff services (public) + bulk link (admin) + unlink by serviceId query (admin)
- Built GET/POST /api/staff/[id]/leaves route — list leaves (public) + add leave with duplicate date check (admin)
- Built DELETE /api/staff/[id]/leaves/[lid] route — remove leave (admin)
- Built GET /api/slots/available route — calculate available slots (public)
  - Gets branch open/close time, service duration (or variant duration)
  - Checks staff work hours, work days, and leave records
  - Generates 30-min interval slots and marks availability based on existing bookings
- Built GET/POST /api/bookings route — list bookings with role-based filtering (auth required) + create booking (auth required)
  - Booking creation: checks slot availability, generates bookingDisplayId (BK-YEAR-XXXXX),
    calculates totalAmount (service + variant + addons), creates initial status history entry
- Built GET /api/bookings/[id] route — booking detail with role-based access (USER own, STAFF assigned, ADMIN all)
- Built PATCH /api/bookings/[id]/confirm route — PENDING → CONFIRMED (admin/staff)
- Built PATCH /api/bookings/[id]/cancel route — PENDING/CONFIRMED/IN_PROGRESS → CANCELLED (admin, staff, or owner)
- Built PATCH /api/bookings/[id]/start route — CONFIRMED → IN_PROGRESS (admin/staff)
- Built PATCH /api/bookings/[id]/complete route — IN_PROGRESS → COMPLETED (admin/staff)
- Built PATCH /api/bookings/[id]/no-show route — CONFIRMED → NO_SHOW (admin/staff)
- All status transitions validate current status before applying, create BookingStatusHistory entry
- Updated validations barrel export at src/lib/validations/index.ts with staff, slots, and bookings exports
- Lint check passed with no errors

Stage Summary:
- 13 route files created (5 for staff, 1 for slots, 7 for bookings)
- 21 API endpoints total across all three features
- All endpoints follow createApiHandler pattern
- Staff: public GET, admin POST/PATCH/DELETE, soft delete (isAvailable=false)
- Staff services: link/unlink pattern same as packages, skip duplicates
- Staff leaves: unique constraint on staffId+date, duplicate check returns ConflictError
- Slot availability: full calculation engine with branch hours, staff schedule, leave checks, booking overlap detection
- Bookings: role-based access (USER own data, STAFF assigned, ADMIN all)
- Booking creation: double-booking prevention, displayId generation, totalAmount calculation with addons
- Status transitions enforced with proper validation (terminal states blocked)
- All status changes create BookingStatusHistory audit trail entries
- All Decimal fields serialized with .toString()
- Paginated lists return { items, pagination: { page, pageSize, total, totalPages } }

---
Task ID: 14-19
Agent: api-builder
Task: Build Product Categories, Products + Sales, Inventory, Expenses, Staff Commissions, and Revenue Snapshots API endpoints

Work Log:
- Created validation schemas for product-categories at src/lib/validations/product-categories/index.ts
  - createProductCategorySchema, updateProductCategorySchema, listProductCategoriesQuerySchema
- Created validation schemas for products at src/lib/validations/products/index.ts
  - createProductSchema, updateProductSchema, listProductsQuerySchema
  - createProductSaleSchema, updateProductSaleSchema
- Created validation schemas for inventory at src/lib/validations/inventory/index.ts
  - listInventoryQuerySchema, updateInventorySchema, createTransactionSchema
- Created validation schemas for expenses at src/lib/validations/expenses/index.ts
  - createExpenseSchema, updateExpenseSchema, listExpensesQuerySchema
- Created validation schemas for commissions at src/lib/validations/commissions/index.ts
  - listCommissionsQuerySchema, payCommissionSchema
- Created validation schemas for revenue at src/lib/validations/revenue/index.ts
  - dailyRevenueQuerySchema, summaryQuerySchema, generateSnapshotSchema
- Feature 1: Product Categories — 2 route files
  - GET/POST /api/product-categories — list (public, paginated) + create (admin)
  - GET/PATCH/DELETE /api/product-categories/[id] — detail (public) + update (admin) + soft delete (admin)
- Feature 2: Products + Sales — 4 route files
  - GET/POST /api/products — list (public, paginated, with category filter) + create (admin)
  - GET/PATCH/DELETE /api/products/[id] — detail (public) + update (admin) + soft delete (admin)
  - GET/POST /api/product-sales — list (admin, paginated) + create sale with price lookup + transaction (admin)
  - GET/PATCH /api/product-sales/[id] — detail (admin) + update status (admin, with inventory update on COMPLETED)
- Feature 3: Inventory — 4 route files
  - GET /api/inventory — list (admin, paginated, with lowStock filter)
  - GET /api/inventory/low-stock — low stock alerts (admin)
  - GET/PATCH /api/inventory/[id] — detail (admin, with recent transactions) + update quantity/threshold (admin)
  - GET/POST /api/inventory/[id]/transactions — list transactions (admin, paginated) + add transaction (admin, with stock update)
- Feature 4: Expenses — 2 route files
  - GET/POST /api/expenses — list (admin, paginated, with branchId/category/date filters) + create (admin)
  - GET/PATCH/DELETE /api/expenses/[id] — detail (admin) + update (admin) + hard delete (admin)
- Feature 5: Staff Commissions — 4 route files
  - GET /api/commissions — list (admin, paginated, with staffId/status filters)
  - GET /api/commissions/[id] — detail (admin)
  - PATCH /api/commissions/[id]/pay — mark as paid (admin, sets status=PAID + paidAt=now)
  - GET /api/commissions/staff/[staffId] — staff commission summary (admin, with aggregates)
- Feature 6: Revenue Snapshots — 3 route files
  - GET /api/revenue/daily — daily revenue for date range (admin)
  - GET /api/revenue/summary — period summary with aggregates (admin)
  - POST /api/revenue/generate — generate snapshot (admin, upsert with booking+expense calculations)
- Updated validations barrel export at src/lib/validations/index.ts with 6 new feature exports
- Lint check passed with no errors

Stage Summary:
- 19 route files created across 6 features
- 35+ API endpoints total
- All endpoints follow createApiHandler pattern
- Auth: requireActiveUser + role check for admin routes
- Public GET for product-categories and products; admin-only for all others
- Soft delete for product-categories and products (isActive = false)
- Hard delete for expenses
- Product sale creation: transactional with price lookup and total calculation
- Product sale completion: inventory stock reduction with transaction audit trail
- Inventory transactions: quantity validation (prevent negative stock) and automatic stock updates
- Commission payment: status transition with paidAt timestamp, prevents double payment
- Revenue snapshot generation: upsert with booking revenue + expense calculation
- All Decimal fields serialized with .toString()
- Paginated lists return { items, pagination: { page, pageSize, total, totalPages } }

---
Task ID: 20-21
Agent: api-builder
Task: Build Media Assets + Portfolio and Blog API endpoints

Work Log:
- Updated Prisma schema — added `posts BlogPost[]` relation to User model and `author User? @relation(...)` to BlogPost
- Started PostgreSQL and ran db:push to sync schema changes
- Created validation schemas for portfolio at src/lib/validations/portfolio/index.ts
  - addPortfolioItemSchema, listPortfolioQuerySchema, saveMediaSchema
- Created validation schemas for blog at src/lib/validations/blog/index.ts
  - createBlogCategorySchema, updateBlogCategorySchema
  - createBlogPostSchema, updateBlogPostSchema, listBlogPostsQuerySchema
- Updated validations barrel export at src/lib/validations/index.ts with portfolio and blog exports
- Built GET /api/portfolio route — list all portfolio items with pagination and staff info (public)
- Built GET/POST/DELETE /api/staff/[id]/portfolio route — staff portfolio (public) + add item (admin) + remove by itemId query (admin)
- Built POST /api/media route — save media URL record with polymorphic ownership (admin)
- Built GET/POST /api/blog/categories route — list active categories with post count (public) + create category (admin)
- Built PATCH/DELETE /api/blog/categories/[id] route — update category (admin) + soft delete by isActive=false (admin)
- Built GET/POST /api/blog/posts route — list posts with role-based status filter (public=PUBLISHED only, admin=all) + create post (admin)
- Built GET/PATCH/DELETE /api/blog/posts/[id] route — detail with role-based access + update (admin) + soft delete by status=ARCHIVED (admin)
- Built PATCH /api/blog/posts/[id]/publish route — publish post (admin, sets status=PUBLISHED + publishedAt=now)
- Lint check passed with no errors

Stage Summary:
- 8 route files created (3 for portfolio/media, 5 for blog)
- 12 API endpoints total across both features
- All endpoints follow createApiHandler pattern
- Portfolio: public GET with staff info, admin POST/DELETE with ownership verification
- Media: admin-only POST using existing MediaAsset model with polymorphic ownership
- Blog categories: public GET with post count, admin CRUD with slug uniqueness check, soft delete (isActive=false)
- Blog posts: role-based status visibility (public=PUBLISHED only, admin=all statuses)
- Blog post create: always starts as DRAFT, authorId defaults to current admin user
- Blog post publish: validates DRAFT status, sets PUBLISHED + publishedAt
- Blog post delete: soft delete via status=ARCHIVED (not isActive)
- Archived posts cannot be published directly (must update to DRAFT first)
- All Decimal fields serialized with .toString()
- Paginated lists return { items, pagination: { page, pageSize, total, totalPages } }

---
Task ID: 10-13
Agent: api-builder
Task: Build Offers + Promos, Payments + Refunds, Reviews, and Loyalty Points API endpoints

Work Log:
- Created validation schemas for offers at src/lib/validations/offers/index.ts
  - createOfferSchema, updateOfferSchema, listOffersQuerySchema, validateOfferSchema, linkOfferServicesSchema
  - discountTypeEnum (PERCENTAGE|FLAT_AMOUNT), promo code regex validation
- Created validation schemas for payments at src/lib/validations/payments/index.ts
  - createPaymentSchema, verifyPaymentSchema, listPaymentsQuerySchema, createRefundSchema, processRefundSchema
  - paymentProviderEnum, paymentStatusEnum, refundStatusEnum
- Created validation schemas for reviews at src/lib/validations/reviews/index.ts
  - createReviewSchema, listReviewsQuerySchema, updateReviewSchema
  - Rating validated as integer 1-5
- Created validation schemas for loyalty at src/lib/validations/loyalty/index.ts
  - redeemPointsSchema, expirePointsSchema, listHistoryQuerySchema
  - loyaltyTypeEnum (EARN|REDEEM|EXPIRE)

Feature 1 — Offers + Promos (4 route files):
- Built GET/POST /api/offers route — list offers with isActive filter (public) + create offer (admin, code uniqueness check)
- Built GET/PATCH/DELETE /api/offers/[id] route — detail with linked services (public) + update (admin, code conflict check) + soft delete by isActive=false (admin)
- Built GET/POST/DELETE /api/offers/[id]/services route — list linked services (public) + bulk link with duplicate skip (admin) + unlink by serviceId query param (admin)
- Built POST /api/offers/validate route — validate promo code (public) with full logic: isActive check, date validity, usage limit, minOrder check, discount calculation (percentage/flat), maxDiscount cap

Feature 2 — Payments + Refunds (6 route files):
- Built GET /api/payments route — list payments with bookingId/status/provider filters (admin/staff)
- Built GET /api/payments/[id] route — payment detail with booking and refunds (admin/staff)
- Built POST /api/payments/create-order route — create Razorpay order (mock/simulate with providerOrderId) or CASH/UPI direct payment (auth required, booking ownership check)
- Built POST /api/payments/verify route — verify Razorpay payment, update payment status to SUCCESS, update booking to CONFIRMED, create BookingStatusHistory entry (auth required)
- Built POST /api/refunds route — create refund request (admin), validates payment is SUCCESS, checks refund amount doesn't exceed payment minus already refunded
- Built PATCH /api/refunds/[id] route — process refund (admin), APPROVED/REJECTED/PROCESSED status transitions with validation, updates payment status to REFUNDED on PROCESSED

Feature 3 — Reviews (3 route files):
- Built GET/POST /api/reviews route — list reviews with serviceId/staffId/rating/isApproved filters (public, default approved only) + create review (auth required, booking ownership check, COMPLETED status check, one review per booking, staff rating recalculation)
- Built GET/PATCH /api/reviews/[id] route — review detail (public) + approve/disapprove review (admin, staff rating recalculation on approval change)
- Built GET /api/services/[id]/reviews route — list reviews for a specific service with aggregate averageRating and totalReviews (public, approved only)

Feature 4 — Loyalty Points (4 route files):
- Built GET /api/loyalty/balance route — get own loyalty points balance (auth required)
- Built GET /api/loyalty/history route — get own transaction history with type filter and pagination (auth required)
- Built POST /api/loyalty/redeem route — redeem points with insufficient balance check, creates LoyaltyTransaction with negative points, decrements user.loyaltyPoints (auth required)
- Built POST /api/loyalty/expire route — expire old EARN transactions (admin), finds EARN transactions older than X months, creates EXPIRE transactions per user, updates user balances, caps expiry at current balance

- Updated validations barrel export at src/lib/validations/index.ts with offers, payments, reviews, loyalty exports
- Lint check passed with no errors

Stage Summary:
- 17 route files created (4 for offers, 6 for payments/refunds, 3 for reviews, 4 for loyalty)
- 22 API endpoints total across all four features
- All endpoints follow createApiHandler pattern
- Offers: public GET, admin POST/PATCH/DELETE, soft delete (isActive=false), full promo code validation with discount calculation
- Payments: admin/staff GET, auth-required create/verify, Razorpay order simulation, booking status update on verification
- Refunds: admin POST/PATCH, amount validation against already-refunded, status transition validation
- Reviews: public GET, auth-required POST with booking completion check, admin approval with staff rating recalculation
- Loyalty: auth-required balance/history/redeem, admin expiry processing with balance-aware logic
- All Decimal fields serialized with .toString()
- Paginated lists return { items, pagination: { page, pageSize, total, totalPages } }
