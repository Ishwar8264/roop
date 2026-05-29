/**
 * Purpose: Seed initial data for Nikharta Roop database
 * Responsibility: Create default branches, categories, services, staff, and admin user
 * Important Notes: Run with `bun run db:seed` — uses Prisma enums for type safety
 */

import { PrismaClient, UserRole, BookingStatus, DiscountType, NotificationChannel, NotificationStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Nikharta Roop database...\n");

  // ==================== 1. BRANCHES ====================
  console.log("📍 Creating branches...");

  const branchDelhi = await prisma.branch.upsert({
    where: { id: "branch_delhi_001" },
    update: {},
    create: {
      id: "branch_delhi_001",
      nameHi: "राजौरी गार्डन शाखा",
      nameEn: "Rajouri Garden Branch",
      city: "Delhi",
      address: "Shop 12, Rajouri Garden Market, New Delhi - 110027",
      googleMapsUrl: "https://maps.google.com/?q=rajouri+garden+delhi",
      phone: "9876543210",
      openTime: "09:00",
      closeTime: "20:00",
      isActive: true,
    },
  });

  const branchLucknow = await prisma.branch.upsert({
    where: { id: "branch_lucknow_001" },
    update: {},
    create: {
      id: "branch_lucknow_001",
      nameHi: "हज़रतगंज शाखा",
      nameEn: "Hazratganj Branch",
      city: "Lucknow",
      address: "First Floor, Hazratganj Market, Lucknow - 226001",
      phone: "9876543211",
      openTime: "09:30",
      closeTime: "19:30",
      isActive: true,
    },
  });

  console.log(`  ✅ 2 branches created\n`);

  // ==================== 2. CATEGORIES ====================
  console.log("📂 Creating categories...");

  const categories = [
    { id: "cat_hair", nameHi: "हेयर केयर", nameEn: "Hair Care", icon: "✂️", sortOrder: 1 },
    { id: "cat_face", nameHi: "फेस केयर", nameEn: "Face Care", icon: "✨", sortOrder: 2 },
    { id: "cat_skin", nameHi: "स्किन केयर", nameEn: "Skin Care", icon: "💆", sortOrder: 3 },
    { id: "cat_bridal", nameHi: "ब्राइडल", nameEn: "Bridal", icon: "👰", sortOrder: 4 },
    { id: "cat_mehendi", nameHi: "मेहंदी", nameEn: "Mehendi", icon: "🌸", sortOrder: 5 },
    { id: "cat_nail", nameHi: "नेल केयर", nameEn: "Nail Care", icon: "💅", sortOrder: 6 },
    { id: "cat_makeup", nameHi: "मेकअप", nameEn: "Makeup", icon: "💄", sortOrder: 7 },
    { id: "cat_body", nameHi: "बॉडी केयर", nameEn: "Body Care", icon: "🧖", sortOrder: 8 },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: {},
      create: cat,
    });
  }

  console.log(`  ✅ ${categories.length} categories created\n`);

  // ==================== 3. ADMIN USER ====================
  console.log("👤 Creating admin user...");

  const adminUser = await prisma.user.upsert({
    where: { mobile: "9999999999" },
    update: {},
    create: {
      id: "user_admin_001",
      mobile: "9999999999",
      name: "पूजा शर्मा",
      email: "admin@nikhartaroop.in",
      role: UserRole.ADMIN,
      branchId: branchDelhi.id,
      isActive: true,
      loyaltyPoints: 0,
    },
  });

  console.log(`  ✅ Admin: ${adminUser.name} (${adminUser.mobile})\n`);

  // ==================== 4. DEMO CUSTOMERS ====================
  console.log("👥 Creating demo customers...");

  const customers = [
    { id: "user_priya", mobile: "9123456789", name: "प्रिया गुप्ता", role: UserRole.USER },
    { id: "user_sunita", mobile: "9234567890", name: "सुनीता वर्मा", role: UserRole.USER },
    { id: "user_kavita", mobile: "9345678901", name: "कविता सिंह", role: UserRole.USER },
    { id: "user_rekha", mobile: "9456789012", name: "रेखा देवी", role: UserRole.USER },
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

  console.log(`  ✅ ${customers.length} demo customers created\n`);

  // ==================== 5. STAFF ====================
  console.log("💇 Creating staff...");

  const staffMembers = [
    {
      id: "staff_pooja",
      userId: "user_admin_001",
      branchId: branchDelhi.id,
      specialization: JSON.stringify(["facial", "bridal_makeup", "hair_color"]),
      experienceYears: 8,
      bioHi: "8 साल का अनुभव — ब्राइडल मेकअप में विशेषज्ञ",
      bioEn: "8 years experience — Bridal Makeup specialist",
      rating: 4.9,
      isAvailable: true,
      workDays: JSON.stringify({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false }),
      workStart: "09:00",
      workEnd: "19:00",
    },
    {
      id: "staff_neha",
      userId: "user_priya",
      branchId: branchDelhi.id,
      specialization: JSON.stringify(["hair_cutting", "hair_styling", "threading"]),
      experienceYears: 5,
      bioHi: "हेयर स्टाइलिंग और थ्रेडिंग में माहिर",
      bioEn: "Expert in Hair Styling and Threading",
      rating: 4.7,
      isAvailable: true,
      workDays: JSON.stringify({ mon: true, tue: true, wed: false, thu: true, fri: true, sat: true, sun: true }),
      workStart: "09:00",
      workEnd: "18:00",
    },
    {
      id: "staff_anita",
      userId: "user_sunita",
      branchId: branchDelhi.id,
      specialization: JSON.stringify(["mehendi", "nail_art", "facial"]),
      experienceYears: 6,
      bioHi: "मेहंदी और नेल आर्ट की विशेषज्ञ",
      bioEn: "Mehendi and Nail Art specialist",
      rating: 4.8,
      isAvailable: true,
      workDays: JSON.stringify({ mon: true, tue: true, wed: true, thu: true, fri: true, sat: true, sun: false }),
      workStart: "10:00",
      workEnd: "19:00",
    },
  ];

  for (const s of staffMembers) {
    await prisma.staff.upsert({
      where: { id: s.id },
      update: {},
      create: s,
    });
  }

  console.log(`  ✅ ${staffMembers.length} staff members created\n`);

  // ==================== 6. SERVICES ====================
  console.log("💅 Creating services...");

  const services = [
    // Hair Care
    { id: "svc_haircut", nameHi: "हेयर कटिंग", nameEn: "Hair Cutting", descriptionHi: "ट्रेंडी से लेकर क्लासिक — आपकी पसंद का स्टाइल", price: 200, durationMinutes: 30, categoryId: "cat_hair", branchId: branchDelhi.id },
    { id: "svc_haircolor", nameHi: "हेयर कलरिंग", nameEn: "Hair Coloring", descriptionHi: "ग्लोबल या रूट्स — प्रोफेशनल हेयर कलर", price: 1500, durationMinutes: 90, categoryId: "cat_hair", branchId: branchDelhi.id },
    { id: "svc_hairspa", nameHi: "हेयर स्पा", nameEn: "Hair Spa", descriptionHi: "डीप कंडीशनिंग और स्कैल्प ट्रीटमेंट", price: 800, durationMinutes: 60, categoryId: "cat_hair", branchId: branchDelhi.id },
    // Face Care
    { id: "svc_facial", nameHi: "फेशियल", nameEn: "Facial", descriptionHi: "ग्लोइंग स्किन के लिए प्रोफेशनल फेशियल ट्रीटमेंट", price: 500, durationMinutes: 60, categoryId: "cat_face", branchId: branchDelhi.id },
    { id: "svc_threading", nameHi: "थ्रेडिंग", nameEn: "Threading", descriptionHi: "आईब्रो और फेस थ्रेडिंग", price: 50, durationMinutes: 15, categoryId: "cat_face", branchId: branchDelhi.id },
    { id: "svc_cleanup", nameHi: "फेस क्लीनअप", nameEn: "Face Cleanup", descriptionHi: "डीप क्लीनज़िंग और स्क्रबिंग", price: 300, durationMinutes: 45, categoryId: "cat_face", branchId: branchDelhi.id },
    // Skin Care
    { id: "svc_bleach", nameHi: "ब्लीच", nameEn: "Bleach", descriptionHi: "फेस और बॉडी ब्लीचिंग", price: 250, durationMinutes: 30, categoryId: "cat_skin", branchId: branchDelhi.id },
    { id: "svc_waxing", nameHi: "वैक्सिंग", nameEn: "Waxing", descriptionHi: "फुल बॉडी या पार्शियल वैक्सिंग", price: 600, durationMinutes: 60, categoryId: "cat_skin", branchId: branchDelhi.id },
    // Bridal
    { id: "svc_bridal", nameHi: "ब्राइडल मेकअप", nameEn: "Bridal Makeup", descriptionHi: "आपके खास दिन के लिए परफेक्ट लुक — HD और एयरब्रश", price: 8000, durationMinutes: 180, categoryId: "cat_bridal", branchId: branchDelhi.id },
    { id: "svc_engagement", nameHi: "एंगेजमेंट मेकअप", nameEn: "Engagement Makeup", descriptionHi: "एंगेजमेंट के लिए एलिगेंट लुक", price: 4000, durationMinutes: 120, categoryId: "cat_bridal", branchId: branchDelhi.id },
    // Mehendi
    { id: "svc_mehendi_full", nameHi: "ब्राइडल मेहंदी", nameEn: "Bridal Mehendi", descriptionHi: "दोनों हाथों पर ब्राइडल मेहंदी — विस्तृत डिज़ाइन", price: 3000, durationMinutes: 180, categoryId: "cat_mehendi", branchId: branchDelhi.id },
    { id: "svc_mehendi_party", nameHi: "पार्टी मेहंदी", nameEn: "Party Mehendi", descriptionHi: "एक हाथ पर सुंदर मेहंदी डिज़ाइन", price: 500, durationMinutes: 45, categoryId: "cat_mehendi", branchId: branchDelhi.id },
    // Nail Care
    { id: "svc_manicure", nameHi: "मैनीक्योर", nameEn: "Manicure", descriptionHi: "जेल या रेगुलर मैनीक्योर", price: 400, durationMinutes: 45, categoryId: "cat_nail", branchId: branchDelhi.id },
    { id: "svc_pedicure", nameHi: "पेडीक्योर", nameEn: "Pedicure", descriptionHi: "जेल या रेगुलर पेडीक्योर", price: 500, durationMinutes: 60, categoryId: "cat_nail", branchId: branchDelhi.id },
    // Makeup
    { id: "svc_party_makeup", nameHi: "पार्टी मेकअप", nameEn: "Party Makeup", descriptionHi: "पार्टी और इवेंट के लिए ग्लैमरस लुक", price: 1500, durationMinutes: 60, categoryId: "cat_makeup", branchId: branchDelhi.id },
    // Body Care
    { id: "svc_body_spa", nameHi: "बॉडी स्पा", nameEn: "Body Spa", descriptionHi: "रिलैक्सिंग बॉडी मसाज और स्पा ट्रीटमेंट", price: 2000, durationMinutes: 90, categoryId: "cat_body", branchId: branchDelhi.id },
  ];

  for (const svc of services) {
    await prisma.service.upsert({
      where: { id: svc.id },
      update: {},
      create: svc,
    });
  }

  console.log(`  ✅ ${services.length} services created\n`);

  // ==================== 7. OFFERS ====================
  console.log("🏷️ Creating offers...");

  const offers = [
    {
      id: "offer_first",
      code: "NR20FIRST",
      titleHi: "पहली बुकिंग पर 20% छूट",
      titleEn: "20% off on first booking",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minOrder: 200,
      maxDiscount: 500,
      validFrom: new Date("2026-01-01"),
      validUntil: new Date("2026-12-31"),
      usageLimit: 1000,
      isActive: true,
    },
    {
      id: "offer_diwali",
      code: "DIWALI20",
      titleHi: "दिवाली स्पेशल — 20% छूट",
      titleEn: "Diwali Special — 20% off",
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minOrder: 500,
      maxDiscount: 1000,
      validFrom: new Date("2026-10-01"),
      validUntil: new Date("2026-11-15"),
      usageLimit: 500,
      isActive: true,
    },
    {
      id: "offer_flat200",
      code: "FLAT200",
      titleHi: "ब्राइडल पैकेज पर ₹200 की छूट",
      titleEn: "₹200 off on Bridal packages",
      discountType: DiscountType.FLAT_AMOUNT,
      discountValue: 200,
      minOrder: 2000,
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

  console.log(`  ✅ ${offers.length} offers created\n`);

  // ==================== 8. DEMO BOOKINGS ====================
  console.log("📅 Creating demo bookings...");

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const demoBookings = [
    {
      id: "booking_demo_001",
      bookingDisplayId: "BK-2026-00001",
      userId: "user_kavita",
      serviceId: "svc_bridal",
      staffId: "staff_pooja",
      branchId: branchDelhi.id,
      bookingDate: tomorrow,
      slotStart: "10:00",
      slotEnd: "13:00",
      status: BookingStatus.CONFIRMED,
      totalAmount: 8000,
      advanceAmount: 1600,
    },
    {
      id: "booking_demo_002",
      bookingDisplayId: "BK-2026-00002",
      userId: "user_sunita",
      serviceId: "svc_facial",
      staffId: "staff_pooja",
      branchId: branchDelhi.id,
      bookingDate: tomorrow,
      slotStart: "14:00",
      slotEnd: "15:00",
      status: BookingStatus.CONFIRMED,
      totalAmount: 500,
      advanceAmount: 50,
    },
    {
      id: "booking_demo_003",
      bookingDisplayId: "BK-2026-00003",
      userId: "user_rekha",
      serviceId: "svc_haircut",
      staffId: "staff_neha",
      branchId: branchDelhi.id,
      bookingDate: today,
      slotStart: "11:00",
      slotEnd: "11:30",
      status: BookingStatus.COMPLETED,
      totalAmount: 200,
    },
    {
      id: "booking_demo_004",
      bookingDisplayId: "BK-2026-00004",
      userId: "user_priya",
      serviceId: "svc_mehendi_party",
      staffId: "staff_anita",
      branchId: branchDelhi.id,
      bookingDate: tomorrow,
      slotStart: "15:00",
      slotEnd: "15:45",
      status: BookingStatus.PENDING,
      totalAmount: 500,
    },
  ];

  for (const b of demoBookings) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }

  console.log(`  ✅ ${demoBookings.length} demo bookings created\n`);

  // ==================== 9. DEMO REVIEWS ====================
  console.log("⭐ Creating demo reviews...");

  const reviews = [
    {
      id: "review_demo_001",
      userId: "user_rekha",
      bookingId: "booking_demo_003",
      staffId: "staff_neha",
      serviceId: "svc_haircut",
      rating: 5,
      commentHi: "बहुत अच्छी हेयर कटिंग की! पूजा जी ने बहुत प्यार से काम किया।",
      isApproved: true,
    },
    {
      id: "review_demo_002",
      userId: "user_sunita",
      bookingId: "booking_demo_002",
      staffId: "staff_pooja",
      serviceId: "svc_facial",
      rating: 4,
      commentHi: "फेशियल अच्छा था, स्किन ग्लो कर रही है। थोड़ा और टाइम दे सकती थीं।",
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

  console.log(`  ✅ ${reviews.length} demo reviews created\n`);

  // ==================== 10. DEMO NOTIFICATIONS ====================
  console.log("🔔 Creating demo notifications...");

  const notifications = [
    {
      id: "notif_demo_001",
      userId: "user_kavita",
      channel: NotificationChannel.WHATSAPP,
      title: "बुकिंग पुष्टि",
      message: "नमस्ते कविता! आपकी ब्राइडल मेकअप बुकिंग confirmed है।",
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
    {
      id: "notif_demo_002",
      userId: "user_sunita",
      channel: NotificationChannel.WHATSAPP,
      title: "बुकिंग पुष्टि",
      message: "नमस्ते सुनीता! आपकी फेशियल बुकिंग confirmed है।",
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
    {
      id: "notif_demo_003",
      userId: "user_priya",
      channel: NotificationChannel.SMS,
      title: "OTP",
      message: "123456 — यह आपका Nikharta Roop verification code है।",
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

  console.log(`  ✅ ${notifications.length} demo notifications created\n`);

  // ==================== SUMMARY ====================
  console.log("═══════════════════════════════════════════════");
  console.log("🎉 Nikharta Roop — Database Seeded Successfully!");
  console.log("═══════════════════════════════════════════════");
  console.log("📍 Branches:      2 (Delhi, Lucknow)");
  console.log("📂 Categories:    8");
  console.log("💅 Services:     16");
  console.log("👤 Admin:         पूजा शर्मा (9999999999)");
  console.log("👥 Customers:     4 (demo)");
  console.log("💇 Staff:         3");
  console.log("📅 Bookings:      4 (demo)");
  console.log("⭐ Reviews:       2 (demo)");
  console.log("🏷️ Offers:        3");
  console.log("🔔 Notifications: 3 (demo)");
  console.log("═══════════════════════════════════════════════");
  console.log("\n📋 ENUMS Active:");
  console.log("  UserRole:    GUEST | USER | STAFF | ADMIN");
  console.log("  BookingStatus: PENDING | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW");
  console.log("  DiscountType:  PERCENTAGE | FLAT_AMOUNT");
  console.log("  NotificationChannel: WHATSAPP | SMS | EMAIL | PUSH");
  console.log("  NotificationStatus:  PENDING | SENT | FAILED");
  console.log("═══════════════════════════════════════════════\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
