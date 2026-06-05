/**
 * Fixed Seed Script - Uses string values instead of Prisma enums
 * (Since the schema stores enums as Strings)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// String enum replacements
const UserRole = { ADMIN: "ADMIN", USER: "USER", STAFF: "STAFF", GUEST: "GUEST" } as const;
const BookingStatus = { PENDING: "PENDING", CONFIRMED: "CONFIRMED", IN_PROGRESS: "IN_PROGRESS", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED", NO_SHOW: "NO_SHOW" } as const;
const DiscountType = { PERCENTAGE: "PERCENTAGE", FLAT_AMOUNT: "FLAT_AMOUNT" } as const;
const NotificationChannel = { WHATSAPP: "WHATSAPP", SMS: "SMS", EMAIL: "EMAIL", PUSH: "PUSH" } as const;
const NotificationStatus = { PENDING: "PENDING", SENT: "SENT", FAILED: "FAILED" } as const;
const NotificationTrigger = { BOOKING_CONFIRMED: "BOOKING_CONFIRMED", BOOKING_REMINDER: "BOOKING_REMINDER" } as const;
const BlogPostStatus = { DRAFT: "DRAFT", PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } as const;
const LoyaltyTransactionType = { EARN: "EARN", REDEEM: "REDEEM", EXPIRE: "EXPIRE" } as const;

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

  console.log("  2 branches created\n");

  // ==================== 2. BRANCH HOLIDAYS ====================
  console.log("Creating branch holidays...");

  const holidays = [
    { id: "holi_001", branchId: branchDelhi.id, date: new Date("2026-03-14"), reasonHi: "\u0939\u094b\u0932\u0940", reasonEn: "Holi" },
    { id: "holi_002", branchId: branchDelhi.id, date: new Date("2026-11-01"), reasonHi: "\u0926\u093f\u0935\u093e\u0932\u0940", reasonEn: "Diwali" },
    { id: "holi_003", branchId: branchLucknow.id, date: new Date("2026-03-14"), reasonHi: "\u0939\u094b\u0932\u0940", reasonEn: "Holi" },
  ];

  for (const h of holidays) {
    await prisma.branchHoliday.upsert({ where: { id: h.id }, update: {}, create: h });
  }
  console.log("  3 branch holidays created\n");

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
    await prisma.serviceCategory.upsert({ where: { id: cat.id }, update: {}, create: cat });
  }
  console.log("  8 service categories created\n");

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
  console.log("  Admin created\n");

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
      create: { id: cust.id, mobile: cust.mobile, name: cust.name, role: cust.role, isActive: true, loyaltyPoints: 0 },
    });
  }
  console.log("  4 demo customers created\n");

  // ==================== 6. STAFF ====================
  console.log("Creating staff...");

  const staffUsers = [
    { id: "user_staff_pooja", mobile: "9000000001", name: "\u092a\u0942\u091c\u093e \u0936\u0930\u094d\u092e\u093e", role: UserRole.STAFF, branchId: branchDelhi.id },
    { id: "user_staff_neha", mobile: "9000000002", name: "\u0928\u0947\u0939\u093e \u092a\u093e\u0923\u094d\u0921\u0947\u092f", role: UserRole.STAFF, branchId: branchDelhi.id },
    { id: "user_staff_anita", mobile: "9000000003", name: "\u0905\u0928\u093f\u0924\u093e \u092f\u093e\u0926\u0935", role: UserRole.STAFF, branchId: branchDelhi.id },
  ];

  for (const su of staffUsers) {
    await prisma.user.upsert({
      where: { mobile: su.mobile },
      update: {},
      create: { id: su.id, mobile: su.mobile, name: su.name, role: su.role, branchId: su.branchId, isActive: true, loyaltyPoints: 0 },
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
    await prisma.staff.upsert({ where: { id: s.id }, update: {}, create: s });
  }
  console.log("  3 staff members created\n");

  // ==================== 7. SERVICES ====================
  console.log("Creating services...");

  const services = [
    { id: "svc_haircut", nameHi: "\u0939\u0947\u092f\u0930 \u0915\u091f\u093f\u0902\u0917", nameEn: "Hair Cutting", slug: "hair-cutting", descriptionHi: "\u091f\u094d\u0930\u0947\u0902\u0921\u0940 \u0938\u0947 \u0932\u0947\u0915\u0930 \u0915\u094d\u0932\u093e\u0938\u093f\u0915", price: 200.00, durationMinutes: 30, categoryId: "scat_hair", branchId: branchDelhi.id },
    { id: "svc_haircolor", nameHi: "\u0939\u0947\u092f\u0930 \u0915\u0932\u0930\u093f\u0902\u0917", nameEn: "Hair Coloring", slug: "hair-coloring", descriptionHi: "\u0917\u094d\u0932\u094b\u092c\u0932 \u092f\u093e \u0930\u0942\u091f\u094d\u0938 \u0939\u0947\u092f\u0930 \u0915\u0932\u0930", price: 1500.00, durationMinutes: 90, categoryId: "scat_hair", branchId: branchDelhi.id },
    { id: "svc_hairspa", nameHi: "\u0939\u0947\u092f\u0930 \u0938\u094d\u092a\u093e", nameEn: "Hair Spa", slug: "hair-spa", descriptionHi: "\u0921\u0940\u092a \u0915\u0902\u0921\u0940\u0936\u0928\u093f\u0902\u0917 \u0939\u0947\u092f\u0930 \u0938\u094d\u092a\u093e", price: 800.00, durationMinutes: 60, categoryId: "scat_hair", branchId: branchDelhi.id },
    { id: "svc_facial", nameHi: "\u092b\u0947\u0936\u093f\u092f\u0930", nameEn: "Facial", slug: "facial", descriptionHi: "\u0917\u094d\u0932\u094b\u0907\u0902\u0917 \u0938\u094d\u0915\u093f\u0928 \u0915\u0947 \u0932\u093f\u090f \u092b\u0947\u0936\u093f\u092f\u0930", price: 500.00, durationMinutes: 60, categoryId: "scat_face", branchId: branchDelhi.id },
    { id: "svc_threading", nameHi: "\u0925\u094d\u0930\u0947\u0921\u093f\u0902\u0917", nameEn: "Threading", slug: "threading", descriptionHi: "\u0906\u0907\u092c\u094d\u0930\u094b \u0914\u0930 \u092b\u0947\u0938 \u0925\u094d\u0930\u0947\u0921\u093f\u0902\u0917", price: 50.00, durationMinutes: 15, categoryId: "scat_face", branchId: branchDelhi.id },
    { id: "svc_cleanup", nameHi: "\u092b\u0947\u0938 \u0915\u094d\u0932\u0940\u0928\u0905\u092a", nameEn: "Face Cleanup", slug: "face-cleanup", descriptionHi: "\u0921\u0940\u092a \u0915\u094d\u0932\u0940\u0928\u091c\u093c\u093f\u0902\u0917", price: 300.00, durationMinutes: 45, categoryId: "scat_face", branchId: branchDelhi.id },
    { id: "svc_bleach", nameHi: "\u092c\u094d\u0932\u0940\u091a", nameEn: "Bleach", slug: "bleach", descriptionHi: "\u092b\u0947\u0938 \u0914\u0930 \u092c\u0949\u0921\u0940 \u092c\u094d\u0932\u0940\u091a\u093f\u0902\u0917", price: 250.00, durationMinutes: 30, categoryId: "scat_skin", branchId: branchDelhi.id },
    { id: "svc_waxing", nameHi: "\u0935\u0948\u0915\u094d\u0938\u093f\u0902\u0917", nameEn: "Waxing", slug: "waxing", descriptionHi: "\u092b\u0941\u0932 \u092c\u0949\u0921\u0940 \u0935\u0948\u0915\u094d\u0938\u093f\u0902\u0917", price: 600.00, durationMinutes: 60, categoryId: "scat_skin", branchId: branchDelhi.id },
    { id: "svc_bridal", nameHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0915\u0905\u092a", nameEn: "Bridal Makeup", slug: "bridal-makeup", descriptionHi: "\u092a\u0930\u092b\u0947\u0915\u094d\u091f \u0932\u0941\u0915 \u2014 HD \u0914\u0930 \u090f\u092f\u0930\u092c\u094d\u0930\u0936", price: 8000.00, durationMinutes: 180, categoryId: "scat_bridal", branchId: branchDelhi.id },
    { id: "svc_engagement", nameHi: "\u090f\u0902\u0917\u0947\u091c\u092e\u0947\u0902\u091f \u092e\u0947\u0915\u0905\u092a", nameEn: "Engagement Makeup", slug: "engagement-makeup", descriptionHi: "\u090f\u0902\u0917\u0947\u091c\u092e\u0947\u0902\u091f \u0915\u0947 \u0932\u093f\u090f \u092f\u0932\u0947\u0917\u0902\u091f \u0932\u0941\u0915", price: 4000.00, durationMinutes: 120, categoryId: "scat_bridal", branchId: branchDelhi.id },
    { id: "svc_mehendi_full", nameHi: "\u092c\u094d\u0930\u093e\u0907\u0921\u0932 \u092e\u0947\u0939\u0902\u0926\u0940", nameEn: "Bridal Mehendi", slug: "bridal-mehendi", descriptionHi: "\u0926\u094b\u0928\u094b\u0902 \u0939\u093e\u0925\u094b\u0902 \u092a\u0930 \u0935\u093f\u0938\u094d\u0924\u0943\u0924 \u0921\u093f\u091c\u093c\u093e\u0907\u0928", price: 3000.00, durationMinutes: 180, categoryId: "scat_mehendi", branchId: branchDelhi.id },
    { id: "svc_mehendi_party", nameHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u092e\u0947\u0939\u0902\u0926\u0940", nameEn: "Party Mehendi", slug: "party-mehendi", descriptionHi: "\u090f\u0915 \u0939\u093e\u0925 \u092a\u0930 \u0938\u0941\u0902\u0926\u0930 \u0921\u093f\u091c\u093c\u093e\u0907\u0928", price: 500.00, durationMinutes: 45, categoryId: "scat_mehendi", branchId: branchDelhi.id },
    { id: "svc_manicure", nameHi: "\u092e\u0948\u0928\u0940\u0915\u094d\u092f\u094b\u0930", nameEn: "Manicure", slug: "manicure", descriptionHi: "\u091c\u0947\u0932 \u092f\u093e \u0930\u0947\u0917\u0941\u0932\u0930 \u092e\u0948\u0928\u0940\u0915\u094d\u092f\u094b\u0930", price: 400.00, durationMinutes: 45, categoryId: "scat_nail", branchId: branchDelhi.id },
    { id: "svc_pedicure", nameHi: "\u092a\u0947\u0921\u0940\u0915\u094d\u092f\u094b\u0930", nameEn: "Pedicure", slug: "pedicure", descriptionHi: "\u091c\u0947\u0932 \u092f\u093e \u0930\u0947\u0917\u0941\u0932\u0930 \u092a\u0947\u0921\u0940\u0915\u094d\u092f\u094b\u0930", price: 500.00, durationMinutes: 60, categoryId: "scat_nail", branchId: branchDelhi.id },
    { id: "svc_party_makeup", nameHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u092e\u0947\u0915\u0905\u092a", nameEn: "Party Makeup", slug: "party-makeup", descriptionHi: "\u092a\u093e\u0930\u094d\u091f\u0940 \u0914\u0930 \u0907\u0935\u0947\u0902\u091f \u0915\u0947 \u0932\u093f\u090f \u0917\u094d\u0932\u0948\u092e\u0930\u0938 \u0932\u0941\u0915", price: 1500.00, durationMinutes: 60, categoryId: "scat_makeup", branchId: branchDelhi.id },
    { id: "svc_body_spa", nameHi: "\u092c\u0949\u0921\u0940 \u0938\u094d\u092a\u093e", nameEn: "Body Spa", slug: "body-spa", descriptionHi: "\u0930\u093f\u0932\u0948\u0915\u094d\u0938\u093f\u0902\u0917 \u092c\u0949\u0921\u0940 \u0938\u094d\u092a\u093e", price: 2000.00, durationMinutes: 90, categoryId: "scat_body", branchId: branchDelhi.id },
  ];

  for (const svc of services) {
    await prisma.service.upsert({ where: { id: svc.id }, update: {}, create: svc });
  }
  console.log("  16 services created\n");

  // ==================== 8. STAFF SERVICES ====================
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
  console.log("  14 staff-service mappings created\n");

  // ==================== SUMMARY ====================
  console.log("Database seeded successfully!");
  console.log("Branches: 2, Categories: 8, Services: 16, Staff: 3, Customers: 4, Admin: 1");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
