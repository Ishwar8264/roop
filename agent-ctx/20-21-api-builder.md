# Task 20-21: Media Assets + Portfolio and Blog API Endpoints

## Agent: api-builder

## Summary
Built 2 features with 8 route files and 12 API endpoints total.

## Files Created

### Validation Schemas
- `src/lib/validations/portfolio/index.ts` — addPortfolioItemSchema, listPortfolioQuerySchema, saveMediaSchema
- `src/lib/validations/blog/index.ts` — createBlogCategorySchema, updateBlogCategorySchema, createBlogPostSchema, updateBlogPostSchema, listBlogPostsQuerySchema

### Route Files — Portfolio/Media (3 files)
- `src/app/api/portfolio/route.ts` — GET (public, paginated list with staff info)
- `src/app/api/staff/[id]/portfolio/route.ts` — GET (public), POST (admin), DELETE (admin, by itemId query)
- `src/app/api/media/route.ts` — POST (admin, save media URL with polymorphic ownership)

### Route Files — Blog (5 files)
- `src/app/api/blog/categories/route.ts` — GET (public, with post count), POST (admin)
- `src/app/api/blog/categories/[id]/route.ts` — PATCH (admin), DELETE (admin, soft-delete isActive=false)
- `src/app/api/blog/posts/route.ts` — GET (public=PUBLISHED only, admin=all), POST (admin, starts as DRAFT)
- `src/app/api/blog/posts/[id]/route.ts` — GET (role-based), PATCH (admin), DELETE (admin, status=ARCHIVED)
- `src/app/api/blog/posts/[id]/publish/route.ts` — PATCH (admin, PUBLISHED + publishedAt=now)

### Schema Changes
- Added `posts BlogPost[]` to User model
- Added `author User? @relation(...)` to BlogPost model
- Ran db:push successfully

### Barrel Exports Updated
- `src/lib/validations/index.ts` — added portfolio and blog exports

## Key Patterns
- All routes use `createApiHandler` from `@/lib/api-handler`
- Admin routes: `requireActiveUser` + `user.role === "ADMIN"` check + `AdminRequiredError()`
- Decimal serialization: `.toString()` on all Decimal fields
- Paginated responses: `{ items, pagination: { page, pageSize, total, totalPages } }`
- URL ID extraction: `new URL(request.url).pathname.split("/")`
- Blog post soft-delete: `status = "ARCHIVED"` (not isActive)
- Blog category soft-delete: `isActive = false`
- Portfolio delete: hard delete (actual removal)
