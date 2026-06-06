/**
 * Purpose: Seed initial data for Nikharta Roop database
 * Responsibility: Create default branches, categories, services, staff, and admin user
 * Important Notes:
 *   - Run with `bun run db:seed` — uses Prisma enums for type safety
 *   - PostgreSQL only — uses Decimal, Time, Date native types
 *   - All monetary values as Decimal strings (e.g., "8000.00")
 *   - i18n pattern: nameHi + nameEn for all user-facing content
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const UserRole = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
  USER: "USER",
} as const;

const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FLAT_AMOUNT: "FLAT_AMOUNT",
} as const;

const NotificationTrigger = {
  BOOKING_CONFIRMED: "BOOKING_CONFIRMED",
  BOOKING_REMINDER: "BOOKING_REMINDER",
} as const;

const NotificationChannel = {
  WHATSAPP: "WHATSAPP",
  SMS: "SMS",
} as const;

const NotificationStatus = {
  SENT: "SENT",
} as const;

const LoyaltyTransactionType = {
  EARN: "EARN",
} as const;

const BlogPostStatus = {
  PUBLISHED: "PUBLISHED",
  DRAFT: "DRAFT",
} as const;

async function main() {
  console.log("Seeding Nikharta Roop database (PostgreSQL)...\n");

  // ==================== 1. BRANCHES ====================
  console.log("Creating branches...");

  const branchDelhi = await prisma.branch.upsert({
    where: { id: "branch_delhi_001" },
    update: {},
    create: {
      id: "branch_delhi_001",
      nameHi: "\u0930\u093e\u091c\u094c\u0930\u0940 \u0917\u093e\u0930\u094d\u0921\u0928 \u0936\u093e\u0916\u093e",
      nameEn: "Rajouri Garden Branch",
      city: "Delhi",
      address: "Shop 12, Rajouri Garden Market, New Delhi - 110027",
      googleMapsUrl: "https://maps.google.com/?q=rajouri+garden+delhi",
      phone: "9876543210",
      openTime: new Date("1970-01-01T09:00:00"),
      closeTime: new Date("1970-01-01T20:00:00"),
      isActive: true,
    },
  });

  const branchLucknow = await prisma.branch.upsert({
    where: { id: "branch_lucknow_001" },
    update: {},
    create: {
      id: "branch_lucknow_001",
      nameHi: "\u0939\u091c\u093c\u0930\u0924\u0917\u0902\u091c \u0936\u093e\u0916\u093e",
      nameEn: "Hazratganj Branch",
      city: "Lucknow",
      address: "First Floor, Hazratganj Market, Lucknow - 226001",
      phone: "9876543211",
      openTime: new Date("1970-01-01T09:30:00"),
      closeTime: new Date("1970-01-01T19:30:00"),
      isActive: true,
    },
  });

  console.log(`  2 branches created\n`);

  // ==================== 2. BRANCH HOLIDAYS ====================
  console.log("Creating branch holidays...");

  const holidays = [
    { id: "holi_001", branchId: branchDelhi.id, date: new Date("2026-03-14"), reasonHi: "\u0939\u094b\u0932\u0940", reasonEn: "Holi" },
    { id: "holi_002", branchId: branchDelhi.id, date: new Date("2026-11-01"), reasonHi: "\u0926\u093f\u0935\u093e\u0932\u0940", reasonEn: "Diwali" },
    { id: "holi_003", branchId: branchLucknow.id, date: new Date("2026-03-14"), reasonHi: "\u0939\u094b\u0932\u0940", reasonEn: "Holi" },
  ];

  for (const h of holidays) {
    await prisma.branchHoliday.upsert({
      where: { id: h.id },
      update: {},
      create: h,
    });
  }

  console.log(`  ${holidays.length} branch holidays created\n`);

  // ==================== 3. SERVICE CATEGORIES ====================
  console.log("Creating service categories...");

  const categories = [
    { id: "scat_hair", nameHi: "\u0939\u0947\u092f\u0930 \u0915\u0947\u092f\u0930", nameEn: "Hair Care", slug: "hair-care", icon: "\u2702\ufe0f", sortOrder: 1 },
    { id: "scat_face", nameHi: "\u092b\u0947\u0938 \u0915\u0947\u092f\u0930", nameEn: "Face Care", slug: "face-care", icon: "\u2728", sortOrder: 2 },
    { id: "scat_skin", nameHi: "\u0938\u094d\u0915\u093f\u0928 \u0915\u0947\u092f\u0930", nameEn: "Skin Care", slug: "skin-care", icon: "\ud83d\udc86", sortOrder: 3 },
    { id: "scat_bridal", nameHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932", nameEn: "Bridal", slug: "bridal", icon: "\ud83d\udc70", sortOrder: 4 },
    { id: "scat_mehendi", nameHi: "\u092e\u0947\u0939\u0902\u0926\u0940", nameEn: "Mehendi", slug: "mehendi", icon: "\ud83c\udf38", sortOrder: 5 },
    { id: "scat_nail", nameHi: "\u0928\u0947\u0932 \u0915\u0947\u092f\u0930", nameEn: "Nail Care", slug: "nail-care", icon: "\ud83d\udc85", sortOrder: 6 },
    { id: "scat_makeup", nameHi: "\u092e\u0947\u0915\u0905\u092a", nameEn: "Makeup", slug: "makeup", icon: "\ud83d\udc84", sortOrder: 7 },
    { id: "scat_body", nameHi: "\u092c\u0949\u0921\u0940 \u0915\u0947\u092f\u0930", nameEn: "Body Care", slug: "body-care", icon: "\ud83e\uddd6", sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.serviceCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  console.log(`  ${categories.length} service categories created\n`);

  // ==================== 4. ADMIN USER ====================
  console.log("Creating admin user...");

  const adminUser = await prisma.user.upsert({
    where: { mobile: "9999999999" },
    update: {},
    create: {
      id: "user_admin_001",
      mobile: "9999999999",
      name: "\u092a\u0942\u091c\u093e \u0936\u0930\u094d\u092e\u093e",
      email: "admin@nikhartaroop.in",
      role: UserRole.ADMIN,
      branchId: branchDelhi.id,
      isActive: true,
      loyaltyPoints: 0,
    },
  });

  console.log(`  Admin: ${adminUser.name} (${adminUser.mobile})\n`);

  // ==================== 5. DEMO CUSTOMERS ====================
  console.log("Creating demo customers...");

  const customers = [
    { id: "user_priya", mobile: "9123456789", name: "\u092a\u094d\u0930\u093f\u092f\u093e \u0917\u0941\u092a\u094d\u0924\u093e", role: UserRole.USER },
    { id: "user_sunita", mobile: "9234567890", name: "\u0938\u0941\u0928\u0940\u0924\u093e \u0935\u0930\u094d\u092e\u093e", role: UserRole.USER },
    { id: "user_kavita", mobile: "9345678901", name: "\u0915\u0935\u093f\u0924\u093e \u0938\u093f\u0902\u0939", role: UserRole.USER },
    { id: "user_rekha", mobile: "9456789012", name: "\u0930\u0947\u0916\u093e \u0926\u0947\u0935\u0940", role: UserRole.USER },
  ];

  for (const cust of customers) {
    await prisma.user.upsert({
      where: { mobile: cust.mobile },
      update: {},
      create: {
        id: cust.id,
        mobile: cust.mobile,
        name: cust.name,
        role: cust.role,
        isActive: true,
        loyaltyPoints: 0,
      },
    });
  }

  console.log(`  ${customers.length} demo customers created\n`);

  // ==================== 6. STAFF ====================
  console.log("Creating staff...");

  // First create staff user accounts
  const staffUsers = [
    { id: "user_staff_pooja", mobile: "9000000001", name: "\u092a\u0942\u091c\u093e \u0936\u0930\u094d\u092e\u093e", role: UserRole.STAFF, branchId: branchDelhi.id },
    { id: "user_staff_neha", mobile: "9000000002", name: "\u0928\u0947\u0939\u093e \u092a\u093e\u0923\u094d\u0921\u0947\u092f", role: UserRole.STAFF, branchId: branchDelhi.id },
    { id: "user_staff_anita", mobile: "9000000003", name: "\u0905\u0928\u093f\u0924\u093e \u092f\u093e\u0926\u0935", role: UserRole.STAFF, branchId: branchDelhi.id },
  ];

  for (const su of staffUsers) {
    await prisma.user.upsert({
      where: { mobile: su.mobile },
      update: {},
      create: {
        id: su.id,
        mobile: su.mobile,
        name: su.name,
        role: su.role,
        branchId: su.branchId,
        isActive: true,
        loyaltyPoints: 0,
      },
    });
  }

  const staffMembers = [
    {
      id: "staff_pooja",
      userId: "user_staff_pooja",
      branchId: branchDelhi.id,
      specialization: "facial,bridal_makeup,hair_color",
      experienceYears: 8,
      bioHi: "8 \u0938\u093e\u0932 \u0915\u093e \u0905\u0928\u0941\u092d\u0935 \u2014 \u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a \u092e\u0947\u0902 \u0935\u093f\u0936\u0947\u0937\u091c\u094d\u091e",
      bioEn: "8 years experience \u2014 Bridal Makeup specialist",
      rating: 4.9,
      isAvailable: true,
      workDays: "{\"mon\":true,\"tue\":true,\"wed\":true,\"thu\":true,\"fri\":true,\"sat\":true,\"sun\":false}",
      workStart: new Date("1970-01-01T09:00:00"),
      workEnd: new Date("1970-01-01T19:00:00"),
      commissionRate: 15.0,
    },
    {
      id: "staff_neha",
      userId: "user_staff_neha",
      branchId: branchDelhi.id,
      specialization: "hair_cutting,hair_styling,threading",
      experienceYears: 5,
      bioHi: "\u0939\u0947\u092f\u0930 \u0938\u094d\u091f\u093e\u0907\u0932\u093f\u0902\u0917 \u0914\u0930 \u0925\u094d\u0930\u0947\u0921\u093f\u0902\u0917 \u092e\u0947\u0902 \u092e\u093e\u0939\u093f\u0930",
      bioEn: "Expert in Hair Styling and Threading",
      rating: 4.7,
      isAvailable: true,
      workDays: "{\"mon\":true,\"tue\":true,\"wed\":false,\"thu\":true,\"fri\":true,\"sat\":true,\"sun\":true}",
      workStart: new Date("1970-01-01T09:00:00"),
      workEnd: new Date("1970-01-01T18:00:00"),
      commissionRate: 12.0,
    },
    {
      id: "staff_anita",
      userId: "user_staff_anita",
      branchId: branchDelhi.id,
      specialization: "mehendi,nail_art,facial",
      experienceYears: 6,
      bioHi: "\u092e\u0947\u0939\u0902\u0926\u0940 \u0914\u0930 \u0928\u0947\u0932 \u0906\u0930\u094d\u091f \u0915\u0940 \u0935\u093f\u0936\u0947\u0937\u091c\u094d\u091e",
      bioEn: "Mehendi and Nail Art specialist",
      rating: 4.8,
      isAvailable: true,
      workDays: "{\"mon\":true,\"tue\":true,\"wed\":true,\"thu\":true,\"fri\":true,\"sat\":true,\"sun\":false}",
      workStart: new Date("1970-01-01T10:00:00"),
      workEnd: new Date("1970-01-01T19:00:00"),
      commissionRate: 10.0,
    },
  ];

  for (const s of staffMembers) {
    await prisma.staff.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  console.log(`  ${staffMembers.length} staff members created\n`);

  // ==================== 7. SERVICES ====================
  console.log("Creating services...");

  const services = [
    // Hair Care
    { id: "svc_haircut", nameHi: "\u0939\u0947\u092f\u0930 \u0915\u091f\u093f\u0902\u0917", nameEn: "Hair Cutting", slug: "hair-cutting", descriptionHi: "\u091f\u094d\u0930\u0947\u0902\u0921\u0940 \u0938\u0947 \u0932\u0947\u0915\u0930 \u0915\u094d\u0932\u093e\u0938\u093f\u0915 \u2014 \u0906\u092a\u0915\u0940 \u092a\u0938\u0902\u0926 \u0915\u093e \u0938\u094d\u091f\u093e\u0907\u0932", price: 200.00, durationMinutes: 30, categoryId: "scat_hair", branchId: branchDelhi.id },
    { id: "svc_haircolor", nameHi: "\u0939\u0947\u092f\u0930 \u0915\u0932\u0930\u093f\u0902\u0917", nameEn: "Hair Coloring", slug: "hair-coloring", descriptionHi: "\u0917\u094d\u0932\u094b\u092c\u0932 \u092f\u093e \u0930\u0942\u091f\u094d\u0938 \u2014 \u092a\u094d\u0930\u094b\u092b\u0947\u0936\u0928\u0932 \u0939\u0947\u092f\u0930 \u0915\u0932\u0930", price: 1500.00, durationMinutes: 90, categoryId: "scat_hair", branchId: branchDelhi.id },
    { id: "svc_hairspa", nameHi: "\u0939\u0947\u092f\u0930 \u0938\u094d\u092a\u093e", nameEn: "Hair Spa", slug: "hair-spa", descriptionHi: "\u0921\u0940\u092a \u0915\u0902\u0921\u0940\u0936\u0928\u093f\u0902\u0917 \u0914\u0930 \u0938\u094d\u0915\u0948\u0932\u094d\u092a \u091f\u094d\u0930\u0940\u091f\u092e\u0947\u0902\u091f", price: 800.00, durationMinutes: 60, categoryId: "scat_hair", branchId: branchDelhi.id },
    // Face Care
    { id: "svc_facial", nameHi: "\u092b\u0947\u0936\u093f\u092f\u0932", nameEn: "Facial", slug: "facial", descriptionHi: "\u0917\u094d\u0932\u094b\u0907\u0902\u0917 \u0938\u094d\u0915\u093f\u0928 \u0915\u0947 \u0932\u093f\u090f \u092a\u094d\u0930\u094b\u092b\u0947\u0936\u0928\u0932 \u092b\u0947\u0936\u093f\u092f\u0932 \u091f\u094d\u0930\u0940\u091f\u092e\u0947\u0902\u091f", price: 500.00, durationMinutes: 60, categoryId: "scat_face", branchId: branchDelhi.id },
    { id: "svc_threading", nameHi: "\u0925\u094d\u0930\u0947\u0921\u093f\u0902\u0917", nameEn: "Threading", slug: "threading", descriptionHi: "\u0906\u0907\u092c\u094d\u0930\u094b \u0914\u0930 \u092b\u0947\u0938 \u0925\u094d\u0930\u0947\u0921\u093f\u0902\u0917", price: 50.00, durationMinutes: 15, categoryId: "scat_face", branchId: branchDelhi.id },
    { id: "svc_cleanup", nameHi: "\u092b\u0947\u0938 \u0915\u094d\u0932\u0940\u0928\u0905\u092a", nameEn: "Face Cleanup", slug: "face-cleanup", descriptionHi: "\u0921\u0940\u092a \u0915\u094d\u0932\u0940\u0928\u091c\u093c\u093f\u0902\u0917 \u0914\u0930 \u0938\u094d\u0915\u094d\u0930\u092c\u093f\u0902\u0917", price: 300.00, durationMinutes: 45, categoryId: "scat_face", branchId: branchDelhi.id },
    // Skin Care
    { id: "svc_bleach", nameHi: "\u092c\u094d\u0932\u0940\u091a", nameEn: "Bleach", slug: "bleach", descriptionHi: "\u092b\u0947\u0938 \u0914\u0930 \u092c\u0949\u0921\u0940 \u092c\u094d\u0932\u0940\u091a\u093f\u0902\u0917", price: 250.00, durationMinutes: 30, categoryId: "scat_skin", branchId: branchDelhi.id },
    { id: "svc_waxing", nameHi: "\u0935\u0948\u0915\u094d\u0938\u093f\u0902\u0917", nameEn: "Waxing", slug: "waxing", descriptionHi: "\u092b\u0941\u0932 \u092c\u0949\u0921\u0940 \u092f\u093e \u092a\u093e\u0930\u094d\u0936\u093f\u092f\u0932 \u0935\u0948\u0915\u094d\u0938\u093f\u0902\u0917", price: 600.00, durationMinutes: 60, categoryId: "scat_skin", branchId: branchDelhi.id },
    // Bridal
    { id: "svc_bridal", nameHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a", nameEn: "Bridal Makeup", slug: "bridal-makeup", descriptionHi: "\u0906\u092a\u0915\u0947 \u0916\u093e\u0938 \u0926\u093f\u0928 \u0915\u0947 \u0932\u093f\u090f \u092a\u0930\u092b\u0947\u0915\u094d\u091f \u0932\u0941\u0915 \u2014 HD \u0914\u0930 \u090f\u092f\u0930\u092c\u094d\u0930\u0936", price: 8000.00, durationMinutes: 180, categoryId: "scat_bridal", branchId: branchDelhi.id },
    { id: "svc_engagement", nameHi: "\u090f\u0902\u0917\u0947\u091c\u092e\u0947\u0902\u091f \u092e\u0947\u0915\u0905\u092a", nameEn: "Engagement Makeup", slug: "engagement-makeup", descriptionHi: "\u090f\u0902\u0917\u0947\u091c\u092e\u0947\u0902\u091f \u0915\u0947 \u0932\u093f\u090f \u090f\u0932\u093f\u0917\u0947\u0902\u091f \u0932\u0941\u0915", price: 4000.00, durationMinutes: 120, categoryId: "scat_bridal", branchId: branchDelhi.id },
    // Mehendi
    { id: "svc_mehendi_full", nameHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0939\u0902\u0926\u0940", nameEn: "Bridal Mehendi", slug: "bridal-mehendi", descriptionHi: "\u0926\u094b\u0928\u094b\u0902 \u0939\u093e\u0925\u094b\u0902 \u092a\u0930 \u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0939\u0902\u0926\u0940 \u2014 \u0935\u093f\u0938\u094d\u0924\u0943\u0924 \u0921\u093f\u091c\u093c\u093e\u0907\u0928", price: 3000.00, durationMinutes: 180, categoryId: "scat_mehendi", branchId: branchDelhi.id },
    { id: "svc_mehendi_party", nameHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u092e\u0947\u0939\u0902\u0926\u0940", nameEn: "Party Mehendi", slug: "party-mehendi", descriptionHi: "\u090f\u0915 \u0939\u093e\u0925 \u092a\u0930 \u0938\u0941\u0902\u0926\u0930 \u092e\u0947\u0939\u0902\u0926\u0940 \u0921\u093f\u091c\u093c\u093e\u0907\u0928", price: 500.00, durationMinutes: 45, categoryId: "scat_mehendi", branchId: branchDelhi.id },
    // Nail Care
    { id: "svc_manicure", nameHi: "\u092e\u0948\u0928\u0940\u0915\u094d\u092f\u094b\u0930", nameEn: "Manicure", slug: "manicure", descriptionHi: "\u091c\u0947\u0932 \u092f\u093e \u0930\u0947\u0917\u0941\u0932\u0930 \u092e\u0948\u0928\u0940\u0915\u094d\u092f\u094b\u0930", price: 400.00, durationMinutes: 45, categoryId: "scat_nail", branchId: branchDelhi.id },
    { id: "svc_pedicure", nameHi: "\u092a\u0947\u0921\u0940\u0915\u094d\u092f\u094b\u0930", nameEn: "Pedicure", slug: "pedicure", descriptionHi: "\u091c\u0947\u0932 \u092f\u093e \u0930\u0947\u0917\u0941\u0932\u0930 \u092a\u0947\u0921\u0940\u0915\u094d\u092f\u094b\u0930", price: 500.00, durationMinutes: 60, categoryId: "scat_nail", branchId: branchDelhi.id },
    // Makeup
    { id: "svc_party_makeup", nameHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u092e\u0947\u0915\u0905\u092a", nameEn: "Party Makeup", slug: "party-makeup", descriptionHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u0914\u0930 \u0907\u0935\u0947\u0902\u091f \u0915\u0947 \u0932\u093f\u090f \u0917\u094d\u0932\u0948\u092e\u0930\u0938 \u0932\u0941\u0915", price: 1500.00, durationMinutes: 60, categoryId: "scat_makeup", branchId: branchDelhi.id },
    // Body Care
    { id: "svc_body_spa", nameHi: "\u092c\u0949\u0921\u0940 \u0938\u094d\u092a\u093e", nameEn: "Body Spa", slug: "body-spa", descriptionHi: "\u0930\u093f\u0932\u0948\u0915\u094d\u0938\u093f\u0902\u0917 \u092c\u0949\u0921\u0940 \u092e\u0938\u093e\u091c \u0914\u0930 \u0938\u094d\u092a\u093e \u091f\u094d\u0930\u0940\u091f\u092e\u0947\u0902\u091f", price: 2000.00, durationMinutes: 90, categoryId: "scat_body", branchId: branchDelhi.id },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: svc,
    });
  }

  console.log(`  ${services.length} services created\n`);

  // ==================== 8. SERVICE VARIANTS ====================
  console.log("Creating service variants...");

  const variants = [
    { id: "var_facial_gold", serviceId: "svc_facial", nameHi: "\u0917\u094b\u0932\u094d\u0921 \u092b\u0947\u0936\u093f\u092f\u0932", nameEn: "Gold Facial", price: 800.00, durationMinutes: 60, isActive: true, sortOrder: 1 },
    { id: "var_facial_diamond", serviceId: "svc_facial", nameHi: "\u0921\u093e\u0907\u092e\u0902\u0921 \u092b\u0947\u0936\u093f\u092f\u0932", nameEn: "Diamond Facial", price: 1200.00, durationMinutes: 75, isActive: true, sortOrder: 2 },
    { id: "var_facial_fruit", serviceId: "svc_facial", nameHi: "\u092b\u094d\u0930\u0942\u091f \u092b\u0947\u0936\u093f\u092f\u0932", nameEn: "Fruit Facial", price: 600.00, durationMinutes: 45, isActive: true, sortOrder: 3 },
    { id: "var_hairspa_keratin", serviceId: "svc_hairspa", nameHi: "\u0915\u0947\u0930\u093e\u091f\u093f\u0928 \u0939\u0947\u092f\u0930 \u0938\u094d\u092a\u093e", nameEn: "Keratin Hair Spa", price: 1200.00, durationMinutes: 90, isActive: true, sortOrder: 1 },
    { id: "var_bridal_hd", serviceId: "svc_bridal", nameHi: "HD \u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a", nameEn: "HD Bridal Makeup", price: 10000.00, durationMinutes: 180, isActive: true, sortOrder: 1 },
    { id: "var_bridal_airbrush", serviceId: "svc_bridal", nameHi: "\u090f\u092f\u0930\u092c\u094d\u0930\u0936 \u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a", nameEn: "Airbrush Bridal Makeup", price: 15000.00, durationMinutes: 200, isActive: true, sortOrder: 2 },
  ];

  for (const v of variants) {
    await prisma.serviceVariant.upsert({
      where: { id: v.id },
      update: {},
      create: v,
    });
  }

  console.log(`  ${variants.length} service variants created\n`);

  // ==================== 9. SERVICE ADD-ONS ====================
  console.log("Creating service add-ons...");

  const addOns = [
    { id: "addon_eye_mask", serviceId: "svc_facial", nameHi: "\u0906\u0908 \u092e\u093e\u0938\u094d\u0915", nameEn: "Eye Mask", price: 100.00, durationMinutes: 10, isActive: true },
    { id: "addon_scalp_massage", serviceId: "svc_hairspa", nameHi: "\u0938\u094d\u0915\u0948\u0932\u094d\u092a \u092e\u0938\u093e\u091c", nameEn: "Scalp Massage", price: 200.00, durationMinutes: 15, isActive: true },
    { id: "addon_nail_art", serviceId: "svc_manicure", nameHi: "\u0928\u0947\u0932 \u0906\u0930\u094d\u091f", nameEn: "Nail Art", price: 150.00, durationMinutes: 20, isActive: true },
    { id: "addon_hair_wash", serviceId: "svc_haircut", nameHi: "\u0939\u0947\u092f\u0930 \u0935\u093e\u0936", nameEn: "Hair Wash", price: 100.00, durationMinutes: 15, isActive: true },
  ];

  for (const a of addOns) {
    await prisma.serviceAddOn.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }

  console.log(`  ${addOns.length} service add-ons created\n`);

  // ==================== 10. STAFF SERVICES ====================
  console.log("Creating staff-service mappings...");

  const staffServices = [
    { staffId: "staff_pooja", serviceId: "svc_facial" },
    { staffId: "staff_pooja", serviceId: "svc_bridal" },
    { staffId: "staff_pooja", serviceId: "svc_engagement" },
    { staffId: "staff_pooja", serviceId: "svc_haircolor" },
    { staffId: "staff_pooja", serviceId: "svc_party_makeup" },
    { staffId: "staff_neha", serviceId: "svc_haircut" },
    { staffId: "staff_neha", serviceId: "svc_hairspa" },
    { staffId: "staff_neha", serviceId: "svc_threading" },
    { staffId: "staff_neha", serviceId: "svc_haircolor" },
    { staffId: "staff_anita", serviceId: "svc_mehendi_full" },
    { staffId: "staff_anita", serviceId: "svc_mehendi_party" },
    { staffId: "staff_anita", serviceId: "svc_manicure" },
    { staffId: "staff_anita", serviceId: "svc_pedicure" },
    { staffId: "staff_anita", serviceId: "svc_facial" },
  ];

  for (const ss of staffServices) {
    await prisma.staffService.upsert({
      where: { staffId_serviceId: { staffId: ss.staffId, serviceId: ss.serviceId } },
      update: {},
      create: ss,
    });
  }

  console.log(`  ${staffServices.length} staff-service mappings created\n`);

  // ==================== 11. PACKAGES ====================
  console.log("Creating packages...");

  const packages = [
    {
      id: "pkg_bridal_complete",
      nameHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u0915\u0949\u092e\u094d\u092a\u094d\u0932\u0940\u091f \u092a\u0948\u0915\u0947\u091c",
      nameEn: "Bridal Complete Package",
      slug: "bridal-complete-package",
      descriptionHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a + \u0939\u0947\u092f\u0930 \u0938\u094d\u091f\u093e\u0907\u0932\u093f\u0902\u0917 + \u092e\u0947\u0939\u0902\u0926\u0940 + \u092b\u0947\u0936\u093f\u092f\u0932 \u2014 \u0938\u092c \u090f\u0915 \u092e\u0947\u0902",
      descriptionEn: "Bridal Makeup + Hair Styling + Mehendi + Facial \u2014 All in one",
      price: 15000.00,
      originalPrice: 18000.00,
      durationMinutes: 360,
      branchId: branchDelhi.id,
      isActive: true,
    },
    {
      id: "pkg_party_ready",
      nameHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u0930\u0947\u0921\u0940 \u092a\u0948\u0915\u0947\u091c",
      nameEn: "Party Ready Package",
      slug: "party-ready-package",
      descriptionHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u092e\u0947\u0915\u0905\u092a + \u0939\u0947\u092f\u0930 \u0938\u094d\u091f\u093e\u0907\u0932\u093f\u0902\u0917 + \u0925\u094d\u0930\u0947\u0921\u093f\u0902\u0917",
      descriptionEn: "Party Makeup + Hair Styling + Threading",
      price: 2000.00,
      originalPrice: 2500.00,
      durationMinutes: 120,
      branchId: branchDelhi.id,
      isActive: true,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg,
    });
  }

  // Package Services
  const packageServices = [
    { packageId: "pkg_bridal_complete", serviceId: "svc_bridal", sortOrder: 1 },
    { packageId: "pkg_bridal_complete", serviceId: "svc_hairspa", sortOrder: 2 },
    { packageId: "pkg_bridal_complete", serviceId: "svc_mehendi_full", sortOrder: 3 },
    { packageId: "pkg_bridal_complete", serviceId: "svc_facial", sortOrder: 4 },
    { packageId: "pkg_party_ready", serviceId: "svc_party_makeup", sortOrder: 1 },
    { packageId: "pkg_party_ready", serviceId: "svc_haircut", sortOrder: 2 },
    { packageId: "pkg_party_ready", serviceId: "svc_threading", sortOrder: 3 },
  ];

  for (const ps of packageServices) {
    await prisma.packageService.upsert({
      where: { packageId_serviceId: { packageId: ps.packageId, serviceId: ps.serviceId } },
      update: {},
      create: ps,
    });
  }

  console.log(`  ${packages.length} packages with ${packageServices.length} services created\n`);

  // ==================== 12. OFFERS ====================
  console.log("Creating offers...");

  const offers = [
    {
      id: "offer_first",
      code: "NR20FIRST",
      titleHi: "\u092a\u0939\u0932\u0940 \u092c\u0941\u0915\u093f\u0902\u0917 \u092a\u0930 20% \u091b\u0942\u091f",
      titleEn: "20% off on first booking",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20.00,
      minOrder: 200.00,
      maxDiscount: 500.00,
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      usageLimit: 1000,
      isActive: true,
    },
    {
      id: "offer_diwali",
      code: "DIWALI20",
      titleHi: "\u0926\u093f\u0935\u093e\u0932\u0940 \u0938\u094d\u092a\u0947\u0936\u0932 \u2014 20% \u091b\u0942\u091f",
      titleEn: "Diwali Special \u2014 20% off",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20.00,
      minOrder: 500.00,
      maxDiscount: 1000.00,
      validFrom: new Date("2026-10-01"),
      validUntil: new Date("2026-11-15"),
      usageLimit: 500,
      isActive: true,
    },
    {
      id: "offer_flat200",
      code: "FLAT200",
      titleHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092a\u0948\u0915\u0947\u091c \u092a\u0930 \u20b9200 \u0915\u0940 \u091b\u0942\u091f",
      titleEn: "\u20b9200 off on Bridal packages",
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: 200.00,
      minOrder: 2000.00,
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-06-30"),
      usageLimit: 200,
      isActive: true,
    },
  ];

  for (const offer of offers) {
    await prisma.offer.upsert({
      where: { id: offer.id },
      update: {},
      create: offer,
    });
  }

  console.log(`  ${offers.length} offers created\n`);

  // Offer Services (applicable services)
  const offerServices = [
    { offerId: "offer_first", serviceId: "svc_facial" },
    { offerId: "offer_first", serviceId: "svc_haircut" },
    { offerId: "offer_first", serviceId: "svc_hairspa" },
    { offerId: "offer_flat200", serviceId: "svc_bridal" },
    { offerId: "offer_flat200", serviceId: "svc_engagement" },
  ];

  for (const os of offerServices) {
    await prisma.offerService.upsert({
      where: { offerId_serviceId: { offerId: os.offerId, serviceId: os.serviceId } },
      update: {},
      create: os,
    });
  }

  console.log(`  ${offerServices.length} offer-service mappings created\n`);

  // ==================== 13. DEMO BOOKINGS ====================
  console.log("Creating demo bookings...");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const todayStr = new Date().toISOString().split("T")[0];

  const demoBookings = [
    {
      id: "booking_demo_001",
      bookingDisplayId: "BK-2026-00001",
      userId: "user_kavita",
      serviceId: "svc_bridal",
      variantId: "var_bridal_hd",
      staffId: "staff_pooja",
      branchId: branchDelhi.id,
      bookingDate: new Date(tomorrowStr),
      slotStart: new Date("1970-01-01T10:00:00"),
      slotEnd: new Date("1970-01-01T13:00:00"),
      status: BookingStatus.CONFIRMED,
      totalAmount: 10000.00,
      advanceAmount: 2000.00,
    },
    {
      id: "booking_demo_002",
      bookingDisplayId: "BK-2026-00002",
      userId: "user_sunita",
      serviceId: "svc_facial",
      variantId: "var_facial_gold",
      staffId: "staff_pooja",
      branchId: branchDelhi.id,
      bookingDate: new Date(tomorrowStr),
      slotStart: new Date("1970-01-01T14:00:00"),
      slotEnd: new Date("1970-01-01T15:00:00"),
      status: BookingStatus.CONFIRMED,
      totalAmount: 800.00,
      advanceAmount: 80.00,
    },
    {
      id: "booking_demo_003",
      bookingDisplayId: "BK-2026-00003",
      userId: "user_rekha",
      serviceId: "svc_haircut",
      staffId: "staff_neha",
      branchId: branchDelhi.id,
      bookingDate: new Date(todayStr),
      slotStart: new Date("1970-01-01T11:00:00"),
      slotEnd: new Date("1970-01-01T11:30:00"),
      status: BookingStatus.COMPLETED,
      totalAmount: 200.00,
    },
    {
      id: "booking_demo_004",
      bookingDisplayId: "BK-2026-00004",
      userId: "user_priya",
      serviceId: "svc_mehendi_party",
      staffId: "staff_anita",
      branchId: branchDelhi.id,
      bookingDate: new Date(tomorrowStr),
      slotStart: new Date("1970-01-01T15:00:00"),
      slotEnd: new Date("1970-01-01T15:45:00"),
      status: BookingStatus.PENDING,
      totalAmount: 500.00,
    },
  ];

  for (const b of demoBookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }

  console.log(`  ${demoBookings.length} demo bookings created\n`);

  // ==================== 14. BOOKING STATUS HISTORY ====================
  console.log("Creating booking status history...");

  const statusHistory = [
    { id: "bsh_001", bookingId: "booking_demo_001", status: BookingStatus.PENDING, changedBy: "system", reason: "Booking created" },
    { id: "bsh_002", bookingId: "booking_demo_001", status: BookingStatus.CONFIRMED, changedBy: "system", reason: "Advance payment received" },
    { id: "bsh_003", bookingId: "booking_demo_003", status: BookingStatus.PENDING, changedBy: "system", reason: "Booking created" },
    { id: "bsh_004", bookingId: "booking_demo_003", status: BookingStatus.CONFIRMED, changedBy: "system", reason: "Auto-confirmed" },
    { id: "bsh_005", bookingId: "booking_demo_003", status: BookingStatus.IN_PROGRESS, changedBy: "staff_neha", reason: "Service started" },
    { id: "bsh_006", bookingId: "booking_demo_003", status: BookingStatus.COMPLETED, changedBy: "staff_neha", reason: "Service completed" },
  ];

  for (const sh of statusHistory) {
    await prisma.bookingStatusHistory.upsert({
      where: { id: sh.id },
      update: {},
      create: sh,
    });
  }

  console.log(`  ${statusHistory.length} status history entries created\n`);

  // ==================== 15. DEMO REVIEWS ====================
  console.log("Creating demo reviews...");

  const reviews = [
    {
      id: "review_demo_001",
      userId: "user_rekha",
      bookingId: "booking_demo_003",
      staffId: "staff_neha",
      serviceId: "svc_haircut",
      rating: 5,
      commentHi: "\u092c\u0939\u0941\u0924 \u0905\u091a\u094d\u091b\u0940 \u0939\u0947\u092f\u0930 \u0915\u091f\u093f\u0902\u0917 \u0915\u0940! \u0928\u0947\u0939\u093e \u091c\u0940 \u0928\u0947 \u092c\u0939\u0941\u0924 \u092a\u094d\u092f\u093e\u0930 \u0938\u0947 \u0915\u093e\u092e \u0915\u093f\u092f\u093e\u0964",
      isApproved: true,
    },
    {
      id: "review_demo_002",
      userId: "user_sunita",
      bookingId: "booking_demo_002",
      staffId: "staff_pooja",
      serviceId: "svc_facial",
      rating: 4,
      commentHi: "\u092b\u0947\u0936\u093f\u092f\u0932 \u0905\u091a\u094d\u091b\u093e \u0925\u093e, \u0938\u094d\u0915\u093f\u0928 \u0917\u094d\u0932\u094b \u0915\u0930 \u0930\u0939\u0940 \u0939\u0948\u0964 \u0925\u094b\u0921\u093c\u093e \u0914\u0930 \u091f\u093e\u0907\u092e \u0926\u0947 \u0938\u0915\u0924\u0940 \u0925\u0940\u0902\u0964",
      isApproved: true,
    },
  ];

  for (const r of reviews) {
    await prisma.review.upsert({
      where: { id: r.id },
      update: {},
      create: r,
    });
  }

  console.log(`  ${reviews.length} demo reviews created\n`);

  // ==================== 16. DEMO NOTIFICATIONS ====================
  console.log("Creating demo notifications...");

  const notifications = [
    {
      id: "notif_demo_001",
      userId: "user_kavita",
      trigger: NotificationTrigger.BOOKING_CONFIRMED,
      channel: NotificationChannel.WHATSAPP,
      title: "\u092c\u0941\u0915\u093f\u0902\u0917 \u092a\u0941\u0937\u094d\u091f\u093f",
      message: "\u0928\u092e\u0938\u094d\u0924\u0947 \u0915\u0935\u093f\u0924\u093e! \u0906\u092a\u0915\u0940 \u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a \u092c\u0941\u0915\u093f\u0902\u0917 confirmed \u0939\u0948\u0964",
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
    {
      id: "notif_demo_002",
      userId: "user_sunita",
      trigger: NotificationTrigger.BOOKING_CONFIRMED,
      channel: NotificationChannel.WHATSAPP,
      title: "\u092c\u0941\u0915\u093f\u0902\u0917 \u092a\u0941\u0937\u094d\u091f\u093f",
      message: "\u0928\u092e\u0938\u094d\u0924\u0947 \u0938\u0941\u0928\u0940\u0924\u093e! \u0906\u092a\u0915\u0940 \u0917\u094b\u0932\u094d\u0921 \u092b\u0947\u0936\u093f\u092f\u0932 \u092c\u0941\u0915\u093f\u0902\u0917 confirmed \u0939\u0948\u0964",
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
    {
      id: "notif_demo_003",
      userId: "user_priya",
      trigger: NotificationTrigger.BOOKING_REMINDER,
      channel: NotificationChannel.SMS,
      title: "\u092c\u0941\u0915\u093f\u0902\u0917 \u0930\u093f\u092e\u093e\u0907\u0902\u0921\u0930",
      message: "\u0928\u092e\u0938\u094d\u0924\u0947 \u092a\u094d\u0930\u093f\u092f\u093e! \u0915\u0932 \u0915\u0940 \u092a\u093e\u0930\u094d\u091f\u0940 \u092e\u0947\u0939\u0902\u0926\u0940 \u092c\u0941\u0915\u093f\u0902\u0917 \u0915\u0932 \u0915\u094b 3 \u092c\u091c\u0947 \u0939\u0948\u0964",
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: {},
      create: n,
    });
  }

  console.log(`  ${notifications.length} demo notifications created\n`);

  // ==================== 17. LOYALTY TRANSACTIONS ====================
  console.log("Creating loyalty transactions...");

  const loyaltyTxns = [
    {
      id: "loyal_001",
      userId: "user_rekha",
      type: LoyaltyTransactionType.EARN,
      points: 20,
      bookingId: "booking_demo_003",
      reason: "Booking completed \u2014 earned 10% points",
    },
    {
      id: "loyal_002",
      userId: "user_kavita",
      type: LoyaltyTransactionType.EARN,
      points: 100,
      bookingId: "booking_demo_001",
      reason: "Bridal booking confirmed \u2014 bonus points",
    },
  ];

  for (const lt of loyaltyTxns) {
    await prisma.loyaltyTransaction.upsert({
      where: { id: lt.id },
      update: {},
      create: lt,
    });
  }

  console.log(`  ${loyaltyTxns.length} loyalty transactions created\n`);

  // ==================== 18. PRODUCT CATEGORIES ====================
  console.log("Creating product categories...");

  const productCategories = [
    { id: "pcat_shampoo", nameHi: "\u0936\u0948\u092e\u094d\u092a\u0942", nameEn: "Shampoo", slug: "shampoo", icon: "\ud83e\uddf4", sortOrder: 1 },
    { id: "pcat_cream", nameHi: "\u0915\u094d\u0930\u0940\u092e", nameEn: "Cream", slug: "cream", icon: "\ud83e\udea3", sortOrder: 2 },
    { id: "pcat_oil", nameHi: "\u0924\u0947\u0932", nameEn: "Oil", slug: "oil", icon: "\ud83e\uded2", sortOrder: 3 },
    { id: "pcat_serum", nameHi: "\u0938\u0940\u0930\u092e", nameEn: "Serum", slug: "serum", icon: "\ud83d\udc8a", sortOrder: 4 },
  ];

  for (const pc of productCategories) {
    await prisma.productCategory.upsert({
      where: { id: pc.id },
      update: {},
      create: pc,
    });
  }

  console.log(`  ${productCategories.length} product categories created\n`);

  // ==================== 19. PRODUCTS ====================
  console.log("Creating products...");

  const products = [
    { id: "prod_loreal_shampoo", nameHi: "\u0932\u094b\u0930\u093f\u0905\u0932 \u0936\u0948\u092e\u094d\u092a\u0942", nameEn: "L'Oreal Shampoo", slug: "loreal-shampoo", price: 450.00, costPrice: 280.00, categoryId: "pcat_shampoo", isActive: true },
    { id: "prod_garnier_cream", nameHi: "\u0917\u093e\u0930\u094d\u0928\u093f\u090f\u0930 \u092e\u0949\u0938\u094d\u091a\u0930\u093e\u0907\u091c\u093f\u0902\u0917 \u0915\u094d\u0930\u0940\u092e", nameEn: "Garnier Moisturizing Cream", slug: "garnier-cream", price: 320.00, costPrice: 180.00, categoryId: "pcat_cream", isActive: true },
    { id: "prod_biotique_oil", nameHi: "\u092c\u093e\u092f\u094b\u091f\u093f\u0915 \u0939\u0947\u092f\u0930 \u0911\u092f\u0932", nameEn: "Biotique Hair Oil", slug: "biotique-oil", price: 250.00, costPrice: 140.00, categoryId: "pcat_oil", isActive: true },
    { id: "prod_vitamin_c_serum", nameHi: "\u0935\u093f\u091f\u093e\u092e\u093f\u0928 C \u0938\u0940\u0930\u092e", nameEn: "Vitamin C Serum", slug: "vitamin-c-serum", price: 599.00, costPrice: 350.00, categoryId: "pcat_serum", isActive: true },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }

  console.log(`  ${products.length} products created\n`);

  // ==================== 20. BLOG CATEGORIES & POSTS ====================
  console.log("Creating blog categories & posts...");

  const blogCategories = [
    { id: "blogcat_skincare", nameHi: "\u0938\u094d\u0915\u093f\u0928 \u0915\u0947\u092f\u0930 \u091f\u093f\u092a\u094d\u0938", nameEn: "Skin Care Tips", slug: "skin-care-tips", sortOrder: 1 },
    { id: "blogcat_bridal", nameHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u0917\u093e\u0907\u0921", nameEn: "Bridal Guide", slug: "bridal-guide", sortOrder: 2 },
  ];

  for (const bc of blogCategories) {
    await prisma.blogCategory.upsert({
      where: { id: bc.id },
      update: {},
      create: bc,
    });
  }

  const blogPosts = [
    {
      id: "blog_001",
      categoryId: "blogcat_skincare",
      titleHi: "10 \u092c\u094d\u092f\u0942\u091f\u0940 \u091f\u093f\u092a\u094d\u0938 \u0917\u094d\u0932\u094b\u0935\u093f\u0902\u0917 \u0938\u094d\u0915\u093f\u0928 \u0915\u0947 \u0932\u093f\u090f",
      titleEn: "10 Beauty Tips for Glowing Skin",
      slug: "10-beauty-tips-glowing-skin",
      contentHi: "\u0917\u094d\u0932\u094b\u0935\u093f\u0902\u0917 \u0938\u094d\u0915\u093f\u0928 \u0915\u0947 \u0932\u093f\u090f 10 \u0905\u091a\u094d\u091b\u0940 \u091f\u093f\u092a\u094d\u0938...",
      contentEn: "10 great tips for glowing skin...",
      status: BlogPostStatus.PUBLISHED,
      authorId: "user_admin_001",
      publishedAt: new Date(),
    },
    {
      id: "blog_002",
      categoryId: "blogcat_bridal",
      titleHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a \u0915\u0948\u0938\u0947 \u091a\u0941\u0928\u0947\u0902",
      titleEn: "How to Choose Bridal Makeup",
      slug: "how-to-choose-bridal-makeup",
      contentHi: "\u0905\u092a\u0928\u0947 \u0936\u093e\u0926\u0940 \u0926\u093f\u0928 \u0915\u0947 \u0932\u093f\u090f \u0938\u0939\u0940 \u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a \u0915\u0948\u0938\u0947 \u091a\u0941\u0928\u0947\u0902...",
      contentEn: "How to choose the right bridal makeup for your special day...",
      status: BlogPostStatus.DRAFT,
      authorId: "user_admin_001",
    },
  ];

  for (const bp of blogPosts) {
    await prisma.blogPost.upsert({
      where: { id: bp.id },
      update: {},
      create: bp,
    });
  }

  console.log(`  ${blogCategories.length} blog categories, ${blogPosts.length} blog posts created\n`);

  // ==================== SUMMARY ====================
  console.log("═══════════════════════════════════════════════");
  console.log("Nikharta Roop \u2014 Database Seeded Successfully!");
  console.log("═══════════════════════════════════════════════");
  console.log("Branches:          2 (Delhi, Lucknow)");
  console.log("Branch Holidays:   3");
  console.log("Service Categories: 8");
  console.log("Services:          16");
  console.log("Service Variants:  6");
  console.log("Service Add-Ons:   4");
  console.log("Packages:          2 (7 package-service links)");
  console.log("Admin:             \u092a\u0942\u091c\u093e \u0936\u0930\u094d\u092e\u093e (9999999999)");
  console.log("Customers:         4 (demo)");
  console.log("Staff:             3 (14 staff-service links)");
  console.log("Offers:            3 (5 offer-service links)");
  console.log("Bookings:          4 (demo)");
  console.log("Status History:    6");
  console.log("Reviews:           2 (demo)");
  console.log("Notifications:     3 (demo)");
  console.log("Loyalty Txns:      2");
  console.log("Product Categories: 4");
  console.log("Products:          4");
  console.log("Blog Categories:   2");
  console.log("Blog Posts:        2");
  console.log("═══════════════════════════════════════════════");
  console.log("\nENUMS Active:");
  console.log("  UserRole:              GUEST | USER | STAFF | ADMIN");
  console.log("  AuthOtpPurpose:        LOGIN | REGISTER | RESET");
  console.log("  AuthEventType:         LOGIN_SUCCESS | LOGIN_FAILED | OTP_SENT | OTP_VERIFIED | LOGOUT | TOKEN_REFRESHED");
  console.log("  BookingStatus:         PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW");
  console.log("  PaymentStatus:         PENDING | SUCCESS | FAILED | REFUNDED");
  console.log("  PaymentProvider:       RAZORPAY | CASH | UPI");
  console.log("  NotificationChannel:   WHATSAPP | SMS | EMAIL | PUSH");
  console.log("  NotificationStatus:    PENDING | SENT | FAILED");
  console.log("  NotificationTrigger:   BOOKING_CONFIRMED | BOOKING_REMINDER | BOOKING_CANCELLED | PAYMENT_RECEIVED | OFFER_APPLIED | LOYALTY_EARNED | LOYALTY_REDEEMED");
  console.log("  DiscountType:          PERCENTAGE | FLAT_AMOUNT");
  console.log("  LoyaltyTransactionType: EARN | REDEEM | EXPIRE");
  console.log("  BlogPostStatus:        DRAFT | PUBLISHED | ARCHIVED");
  console.log("  ProductSaleStatus:     PENDING | COMPLETED | CANCELLED");
  console.log("  ConsultationStatus:    PENDING | COMPLETED | CANCELLED");
  console.log("  RefundStatus:          PENDING | APPROVED | REJECTED | PROCESSED");
  console.log("  InventoryTransactionType: PURCHASE | SALE | ADJUSTMENT | DAMAGE");
  console.log("  ExpenseCategory:       RENT | SALARY | SUPPLIES | UTILITIES | MARKETING | MAINTENANCE | OTHER");
  console.log("  StaffCommissionStatus: PENDING | PAID");
  console.log("  MediaOwnerType:        SERVICE | STAFF | PORTFOLIO | BRANCH | BLOG | PRODUCT | OFFER");
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
