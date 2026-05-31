import { execSync } from 'child_process';

const BASE = 'http://localhost:3000';
let PASS = 0, FAIL = 0;
const ERRORS = [];

async function test(method, path, body, expectedStatus, desc, token) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);
    
    const res = await fetch(`${BASE}${path}`, opts);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    const ok = expected.includes(res.status);
    if (ok) {
      console.log(`  ✅ ${method} ${path} → ${res.status} (${desc})`);
      PASS++;
    } else {
      console.log(`  ❌ ${method} ${path} → ${res.status} (expected ${expected.join('/')}) (${desc})`);
      if (data) console.log(`     Error: ${data.error || data.message || 'unknown'}`);
      FAIL++;
      ERRORS.push(`${method} ${path} → got ${res.status}, expected ${expected.join('/')} (${desc})`);
    }
    return { status: res.status, data };
  } catch (e) {
    console.log(`  ❌ ${method} ${path} → CONNECTION ERROR (${desc}): ${e.message}`);
    FAIL++;
    ERRORS.push(`${method} ${path} → connection error (${desc})`);
    return { status: 0, data: null };
  }
}

function extract(data, ...path) {
  let v = data;
  for (const p of path) { if (v && typeof v === 'object') v = v[p]; else return ''; }
  return v || '';
}

console.log('============================================================');
console.log('  निखरता रूप — Complete API Endpoint Testing');
console.log('============================================================\n');

// ============ AUTH ============
console.log('━━━ 1. AUTH ━━━');

// Register admin user first
let r = await test('POST', '/api/auth/register-email', {
  name: 'Admin Ishwar', email: 'admin@nikhartaroop.com', password: 'Admin@123', mobile: '9876543210'
}, 201, 'Register admin');
const ADMIN_ID = extract(r.data, 'data', 'user', 'id');

// Update admin role in DB
try {
  execSync(`npx prisma db execute --schema prisma/schema.prisma --stdin`, {
    input: `UPDATE users SET role = 'ADMIN' WHERE id = '${ADMIN_ID}';`,
    cwd: '/home/z/my-project', stdio: 'pipe'
  });
  console.log('  ℹ️  Admin role updated in DB');
} catch (e) { console.log('  ⚠️ DB role update failed:', e.message?.substring(0,100)); }

// Login as admin
r = await test('POST', '/api/auth/login-email', {
  email: 'admin@nikhartaroop.com', password: 'Admin@123'
}, 200, 'Login as admin');

const ADMIN_TOKEN = extract(r.data, 'data', 'tokens', 'accessToken');
const ADMIN_REFRESH = extract(r.data, 'data', 'tokens', 'refreshToken');
console.log(`  ℹ️  Admin Token: ${ADMIN_TOKEN?.substring(0,30)}...`);

// Register user
r = await test('POST', '/api/auth/register-email', {
  name: 'Priya Sharma', email: 'priya@example.com', password: 'Priya@123', mobile: '9876500001'
}, 201, 'Register user');

const USER_TOKEN = extract(r.data, 'data', 'tokens', 'accessToken');
const USER_ID = extract(r.data, 'data', 'user', 'id');

// Other auth
await test('POST', '/api/auth/send-otp', { mobile: '9876543211' }, 200, 'Send OTP');
await test('POST', '/api/auth/refresh', { refreshToken: ADMIN_REFRESH }, 200, 'Refresh token');
await test('GET', '/api/auth/me', null, 200, 'Get own profile', ADMIN_TOKEN);
await test('POST', '/api/auth/logout', null, 200, 'Logout', ADMIN_TOKEN);

// Re-login
r = await test('POST', '/api/auth/login-email', {
  email: 'admin@nikhartaroop.com', password: 'Admin@123'
}, 200, 'Re-login admin');
const ADMIN_TOKEN2 = extract(r.data, 'data', 'tokens', 'accessToken');

// ============ BRANCHES ============
console.log('\n━━━ 2. BRANCHES & HOLIDAYS ━━━');

r = await test('POST', '/api/branches', {
  nameHi: 'राजौरी गार्डन शाखा', nameEn: 'Rajouri Garden Branch', city: 'Delhi',
  address: 'A-123, Rajouri Garden, New Delhi', phone: '9876543201',
  openTime: '09:00', closeTime: '20:00'
}, 201, 'Create branch', ADMIN_TOKEN2);

const BRANCH_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/branches', null, 200, 'List branches');
await test('GET', `/api/branches/${BRANCH_ID}`, null, 200, 'Get branch detail');
await test('PATCH', `/api/branches/${BRANCH_ID}`, { phone: '9876543202' }, 200, 'Update branch', ADMIN_TOKEN2);
await test('GET', `/api/branches/${BRANCH_ID}/holidays`, null, 200, 'List holidays');

r = await test('POST', `/api/branches/${BRANCH_ID}/holidays`, {
  date: '2025-03-14', reasonHi: 'होली', reasonEn: 'Holi'
}, 201, 'Add holiday', ADMIN_TOKEN2);

const HOLIDAY_ID = extract(r.data, 'data', 'id');

// ============ USERS ============
console.log('\n━━━ 3. USERS ━━━');

await test('GET', '/api/users/me', null, 200, 'Get own profile', USER_TOKEN);
await test('PATCH', '/api/users/me', { name: 'Priya Kumari' }, 200, 'Update profile', USER_TOKEN);
await test('PATCH', '/api/users/me/password', {
  currentPassword: 'Priya@123', newPassword: 'Priya@456'
}, 200, 'Change password', USER_TOKEN);
await test('GET', `/api/users/${USER_ID}`, null, 200, 'Get user by ID (admin)', ADMIN_TOKEN2);
await test('PATCH', `/api/users/${USER_ID}`, { role: 'STAFF', branchId: BRANCH_ID }, 200, 'Update user role', ADMIN_TOKEN2);

// ============ SERVICE CATEGORIES ============
console.log('\n━━━ 4. SERVICE CATEGORIES ━━━');

r = await test('POST', '/api/service-categories', {
  nameHi: 'हेयर केयर', nameEn: 'Hair Care', slug: 'hair-care', icon: '✂️'
}, 201, 'Create category', ADMIN_TOKEN2);
const HAIR_CAT_ID = extract(r.data, 'data', 'id');

r = await test('POST', '/api/service-categories', {
  nameHi: 'स्किन केयर', nameEn: 'Skin Care', slug: 'skin-care', icon: '🧴'
}, 201, 'Create skin care category', ADMIN_TOKEN2);
const SKIN_CAT_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/service-categories', null, 200, 'List categories');
await test('GET', `/api/service-categories/${SKIN_CAT_ID}`, null, 200, 'Get category detail');
await test('PATCH', `/api/service-categories/${SKIN_CAT_ID}`, { icon: '💆' }, 200, 'Update category', ADMIN_TOKEN2);
await test('DELETE', `/api/service-categories/${HAIR_CAT_ID}`, null, 200, 'Soft-delete category', ADMIN_TOKEN2);

// ============ SERVICES ============
console.log('\n━━━ 5. SERVICES + VARIANTS + ADDONS ━━━');

r = await test('POST', '/api/services', {
  nameHi: 'फेशियल', nameEn: 'Facial', slug: 'facial',
  descriptionHi: 'चेहरे की सफाई', descriptionEn: 'Face cleanup',
  price: '500.00', durationMinutes: 45, branchId: BRANCH_ID, categoryId: SKIN_CAT_ID
}, 201, 'Create service', ADMIN_TOKEN2);
const SVC_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/services', null, 200, 'List services');
await test('GET', `/api/services/${SVC_ID}`, null, 200, 'Get service detail');
await test('PATCH', `/api/services/${SVC_ID}`, { price: '550.00' }, 200, 'Update service', ADMIN_TOKEN2);

// Variants
r = await test('POST', `/api/services/${SVC_ID}/variants`, {
  nameHi: 'गोल्ड फेशियल', nameEn: 'Gold Facial', price: '800.00', durationMinutes: 60
}, 201, 'Add variant', ADMIN_TOKEN2);
const VAR_ID = extract(r.data, 'data', 'id');

await test('GET', `/api/services/${SVC_ID}/variants`, null, 200, 'List variants');
await test('PATCH', `/api/services/${SVC_ID}/variants/${VAR_ID}`, { price: '850.00' }, 200, 'Update variant', ADMIN_TOKEN2);
await test('DELETE', `/api/services/${SVC_ID}/variants/${VAR_ID}`, null, 200, 'Delete variant', ADMIN_TOKEN2);

// AddOns
r = await test('POST', `/api/services/${SVC_ID}/addons`, {
  nameHi: 'आई मास्क', nameEn: 'Eye Mask', price: '100.00', durationMinutes: 15
}, 201, 'Add add-on', ADMIN_TOKEN2);
const ADDON_ID = extract(r.data, 'data', 'id');

await test('GET', `/api/services/${SVC_ID}/addons`, null, 200, 'List add-ons');
await test('PATCH', `/api/services/${SVC_ID}/addons/${ADDON_ID}`, { price: '120.00' }, 200, 'Update add-on', ADMIN_TOKEN2);
await test('DELETE', `/api/services/${SVC_ID}/addons/${ADDON_ID}`, null, 200, 'Delete add-on', ADMIN_TOKEN2);

await test('GET', `/api/services/${SVC_ID}/reviews`, null, 200, 'List service reviews');

// Create another service for booking tests
r = await test('POST', '/api/services', {
  nameHi: 'ब्राइडल मेकअप', nameEn: 'Bridal Makeup', slug: 'bridal-makeup',
  descriptionHi: 'शादी के लिए मेकअप', descriptionEn: 'Bridal makeup',
  price: '5000.00', durationMinutes: 120, branchId: BRANCH_ID, categoryId: SKIN_CAT_ID
}, 201, 'Create service for bookings', ADMIN_TOKEN2);
const SVC_ID2 = extract(r.data, 'data', 'id');

// ============ STAFF ============
console.log('\n━━━ 6. STAFF + SERVICES + LEAVES + PORTFOLIO ━━━');

// Register staff user
r = await test('POST', '/api/auth/register-email', {
  name: 'Sunita Devi', email: 'sunita@nikhartaroop.com', password: 'Sunita@123'
}, 201, 'Register staff user');
const STAFF_USER_ID = extract(r.data, 'data', 'user', 'id');

// Update role to STAFF in DB
try {
  execSync(`npx prisma db execute --schema prisma/schema.prisma --stdin`, {
    input: `UPDATE users SET role = 'STAFF', "branchId" = '${BRANCH_ID}' WHERE id = '${STAFF_USER_ID}';`,
    cwd: '/home/z/my-project', stdio: 'pipe'
  });
} catch (e) { console.log('  ⚠️ DB update for staff role failed:', e.message); }

r = await test('POST', '/api/staff', {
  userId: STAFF_USER_ID, branchId: BRANCH_ID, specialization: 'facial,bridal_makeup',
  experienceYears: 8, bioHi: '8 साल का अनुभव', bioEn: '8 years experience',
  workStart: '09:00', workEnd: '19:00', commissionRate: '15.00'
}, 201, 'Create staff profile', ADMIN_TOKEN2);
const STAFF_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/staff', null, 200, 'List staff');
await test('GET', `/api/staff/${STAFF_ID}`, null, 200, 'Get staff detail');
await test('PATCH', `/api/staff/${STAFF_ID}`, { experienceYears: 9 }, 200, 'Update staff', ADMIN_TOKEN2);

// Staff services
await test('POST', `/api/staff/${STAFF_ID}/services`, { serviceIds: [SVC_ID2] }, 200, 'Link services to staff', ADMIN_TOKEN2);
await test('GET', `/api/staff/${STAFF_ID}/services`, null, 200, 'List staff services');
await test('DELETE', `/api/staff/${STAFF_ID}/services?serviceId=${SVC_ID2}`, null, 200, 'Unlink service', ADMIN_TOKEN2);
await test('POST', `/api/staff/${STAFF_ID}/services`, { serviceIds: [SVC_ID2] }, 200, 'Re-link service', ADMIN_TOKEN2);

// Staff leaves
r = await test('POST', `/api/staff/${STAFF_ID}/leaves`, {
  date: '2025-08-15', reason: 'Independence Day'
}, 201, 'Add leave', ADMIN_TOKEN2);
const LEAVE_ID = extract(r.data, 'data', 'id');

await test('GET', `/api/staff/${STAFF_ID}/leaves`, null, 200, 'List staff leaves');
await test('DELETE', `/api/staff/${STAFF_ID}/leaves/${LEAVE_ID}`, null, 200, 'Remove leave', ADMIN_TOKEN2);

// Staff portfolio
r = await test('POST', `/api/staff/${STAFF_ID}/portfolio`, {
  titleHi: 'ब्राइडल मेकअप', titleEn: 'Bridal Makeup',
  imageUrl: 'https://cdn.example.com/portfolio1.jpg'
}, 201, 'Add portfolio item', ADMIN_TOKEN2);
const PORT_ID = extract(r.data, 'data', 'id');

await test('GET', `/api/staff/${STAFF_ID}/portfolio`, null, 200, 'List portfolio');
await test('DELETE', `/api/staff/${STAFF_ID}/portfolio?portfolioId=${PORT_ID}`, null, 200, 'Delete portfolio', ADMIN_TOKEN2);

// ============ PACKAGES ============
console.log('\n━━━ 7. PACKAGES ━━━');

r = await test('POST', '/api/packages', {
  nameHi: 'ब्राइडल पैकेज', nameEn: 'Bridal Package', slug: 'bridal-package',
  descriptionHi: 'शादी के लिए पूरा ब्यूटी पैकेज', descriptionEn: 'Complete bridal beauty package',
  price: '15000.00', originalPrice: '18000.00', durationMinutes: 360, branchId: BRANCH_ID
}, 201, 'Create package', ADMIN_TOKEN2);
const PKG_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/packages', null, 200, 'List packages');
await test('GET', `/api/packages/${PKG_ID}`, null, 200, 'Get package detail');
await test('PATCH', `/api/packages/${PKG_ID}`, { price: '14000.00' }, 200, 'Update package', ADMIN_TOKEN2);
await test('POST', `/api/packages/${PKG_ID}/services`, { serviceIds: [SVC_ID2] }, 200, 'Link services', ADMIN_TOKEN2);
await test('GET', `/api/packages/${PKG_ID}/services`, null, 200, 'List package services');
await test('DELETE', `/api/packages/${PKG_ID}/services?serviceId=${SVC_ID2}`, null, 200, 'Unlink service', ADMIN_TOKEN2);
await test('DELETE', `/api/packages/${PKG_ID}`, null, 200, 'Soft-delete package', ADMIN_TOKEN2);

// ============ BOOKINGS ============
console.log('\n━━━ 8. BOOKINGS ━━━');

// Re-login user (password was changed)
r = await test('POST', '/api/auth/login-email', {
  email: 'priya@example.com', password: 'Priya@456'
}, 200, 'Re-login user');
const USER_TOKEN2 = extract(r.data, 'data', 'tokens', 'accessToken');

r = await test('POST', '/api/bookings', {
  serviceId: SVC_ID2, staffId: STAFF_ID, branchId: BRANCH_ID,
  bookingDate: '2025-07-15', slotStart: '10:00'
}, 201, 'Create booking', USER_TOKEN2);
const BOOKING_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/bookings', null, 200, 'List bookings', USER_TOKEN2);
await test('GET', `/api/bookings/${BOOKING_ID}`, null, 200, 'Get booking detail', USER_TOKEN2);
await test('PATCH', `/api/bookings/${BOOKING_ID}/confirm`, {}, 200, 'Confirm booking', ADMIN_TOKEN2);
await test('PATCH', `/api/bookings/${BOOKING_ID}/start`, {}, 200, 'Start booking', ADMIN_TOKEN2);
await test('PATCH', `/api/bookings/${BOOKING_ID}/complete`, {}, 200, 'Complete booking', ADMIN_TOKEN2);

// Cancel test
r = await test('POST', '/api/bookings', {
  serviceId: SVC_ID2, branchId: BRANCH_ID,
  bookingDate: '2025-07-20', slotStart: '11:00'
}, 201, 'Create booking for cancel', USER_TOKEN2);
const BOOKING2_ID = extract(r.data, 'data', 'id');
await test('PATCH', `/api/bookings/${BOOKING2_ID}/cancel`, { reason: 'Conflict' }, 200, 'Cancel booking', USER_TOKEN2);

// No-show test
r = await test('POST', '/api/bookings', {
  serviceId: SVC_ID2, branchId: BRANCH_ID,
  bookingDate: '2025-07-25', slotStart: '14:00'
}, 201, 'Create booking for no-show', USER_TOKEN2);
const BOOKING3_ID = extract(r.data, 'data', 'id');
await test('PATCH', `/api/bookings/${BOOKING3_ID}/confirm`, {}, 200, 'Confirm booking', ADMIN_TOKEN2);
await test('PATCH', `/api/bookings/${BOOKING3_ID}/no-show`, {}, 200, 'Mark no-show', ADMIN_TOKEN2);

// ============ PAYMENTS ============
console.log('\n━━━ 9. PAYMENTS ━━━');

// Check payment create-order schema
r = await test('POST', '/api/payments/create-order', {
  bookingId: BOOKING_ID, provider: 'CASH', amount: '5000.00'
}, [200, 201], 'Create payment order', USER_TOKEN2);
const PAYMENT_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/payments', null, 200, 'List payments', ADMIN_TOKEN2);
await test('GET', `/api/payments/${PAYMENT_ID}`, null, 200, 'Get payment detail', ADMIN_TOKEN2);
await test('POST', '/api/payments/verify', {
  paymentId: PAYMENT_ID, providerRefId: 'CASH_TEST_001'
}, [200, 400], 'Verify payment', USER_TOKEN2);

// ============ REFUNDS ============
console.log('\n━━━ 10. REFUNDS ━━━');

r = await test('POST', '/api/refunds', {
  paymentId: PAYMENT_ID, amount: '2500.00', reason: 'Partial refund'
}, [200, 201], 'Create refund', ADMIN_TOKEN2);
const REFUND_ID = extract(r.data, 'data', 'id');

await test('PATCH', `/api/refunds/${REFUND_ID}`, { action: 'approve' }, 200, 'Process refund', ADMIN_TOKEN2);

// ============ REVIEWS ============
console.log('\n━━━ 11. REVIEWS ━━━');

r = await test('POST', '/api/reviews', {
  bookingId: BOOKING_ID, serviceId: SVC_ID2, staffId: STAFF_ID,
  rating: 5, commentHi: 'बहुत अच्छा!'
}, [200, 201], 'Create review', USER_TOKEN2);
const REVIEW_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/reviews', null, 200, 'List reviews');
await test('GET', `/api/reviews/${REVIEW_ID}`, null, 200, 'Get review detail');
await test('PATCH', `/api/reviews/${REVIEW_ID}`, { isApproved: true }, 200, 'Approve review', ADMIN_TOKEN2);

// ============ OFFERS ============
console.log('\n━━━ 12. OFFERS & PROMOS ━━━');

r = await test('POST', '/api/offers', {
  code: 'DIWALI20', titleHi: 'दिवाली ऑफर', titleEn: 'Diwali Offer',
  discountType: 'PERCENTAGE', discountValue: '20.00',
  validFrom: '2025-01-01T00:00:00Z', validUntil: '2025-12-31T23:59:59Z',
  minOrder: '500.00', maxDiscount: '1000.00'
}, 201, 'Create offer', ADMIN_TOKEN2);
const OFFER_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/offers', null, 200, 'List offers');
await test('GET', `/api/offers/${OFFER_ID}`, null, 200, 'Get offer detail');
await test('PATCH', `/api/offers/${OFFER_ID}`, { discountValue: '25.00' }, 200, 'Update offer', ADMIN_TOKEN2);
await test('POST', `/api/offers/${OFFER_ID}/services`, { serviceIds: [SVC_ID2] }, 200, 'Link services', ADMIN_TOKEN2);
await test('GET', `/api/offers/${OFFER_ID}/services`, null, 200, 'List offer services');
await test('DELETE', `/api/offers/${OFFER_ID}/services?serviceId=${SVC_ID2}`, null, 200, 'Unlink service', ADMIN_TOKEN2);
await test('POST', '/api/offers/validate', { code: 'DIWALI20', amount: '5000.00' }, 200, 'Validate promo');
await test('DELETE', `/api/offers/${OFFER_ID}`, null, 200, 'Soft-delete offer', ADMIN_TOKEN2);

// ============ LOYALTY ============
console.log('\n━━━ 13. LOYALTY ━━━');

await test('GET', '/api/loyalty/balance', null, 200, 'Get balance', USER_TOKEN2);
await test('GET', '/api/loyalty/history', null, 200, 'Get history', USER_TOKEN2);
await test('POST', '/api/loyalty/redeem', { points: 10 }, [200, 400], 'Redeem points', USER_TOKEN2);
await test('POST', '/api/loyalty/expire', { userId: USER_ID, points: 5 }, 200, 'Expire points', ADMIN_TOKEN2);

// ============ ADDRESSES ============
console.log('\n━━━ 14. ADDRESSES ━━━');

r = await test('POST', '/api/addresses', {
  label: 'Home', address: '123, Model Town', city: 'Delhi', pincode: '110027',
  landmark: 'Near Metro', isDefault: true
}, 201, 'Create address', USER_TOKEN2);
const ADDR_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/addresses', null, 200, 'List addresses', USER_TOKEN2);
await test('GET', `/api/addresses/${ADDR_ID}`, null, 200, 'Get address', USER_TOKEN2);
await test('PATCH', `/api/addresses/${ADDR_ID}`, { city: 'New Delhi' }, 200, 'Update address', USER_TOKEN2);
await test('PATCH', `/api/addresses/${ADDR_ID}/default`, null, 200, 'Set default', USER_TOKEN2);
await test('DELETE', `/api/addresses/${ADDR_ID}`, null, 200, 'Delete address', USER_TOKEN2);

// ============ CONSULTATIONS ============
console.log('\n━━━ 15. CONSULTATIONS ━━━');

r = await test('POST', '/api/consultations', {
  branchId: BRANCH_ID, date: '2025-07-10', time: '11:00', staffId: STAFF_ID
}, 201, 'Create consultation', USER_TOKEN2);
const CONSULT_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/consultations', null, 200, 'List consultations', USER_TOKEN2);
await test('GET', `/api/consultations/${CONSULT_ID}`, null, 200, 'Get consultation', USER_TOKEN2);
await test('PATCH', `/api/consultations/${CONSULT_ID}/complete`, { notes: 'Recommended bridal package' }, 200, 'Complete consultation', ADMIN_TOKEN2);

r = await test('POST', '/api/consultations', {
  branchId: BRANCH_ID, date: '2025-07-20', time: '15:00'
}, 201, 'Create consultation for cancel', USER_TOKEN2);
const CONSULT2_ID = extract(r.data, 'data', 'id');
await test('PATCH', `/api/consultations/${CONSULT2_ID}/cancel`, null, 200, 'Cancel consultation', USER_TOKEN2);

// ============ PRODUCT CATEGORIES ============
console.log('\n━━━ 16. PRODUCT CATEGORIES ━━━');

r = await test('POST', '/api/product-categories', {
  nameHi: 'शैम्पू', nameEn: 'Shampoo', slug: 'shampoo', icon: '🧴'
}, 201, 'Create product category', ADMIN_TOKEN2);
const PROD_CAT_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/product-categories', null, 200, 'List product categories');
await test('GET', `/api/product-categories/${PROD_CAT_ID}`, null, 200, 'Get product category');
await test('PATCH', `/api/product-categories/${PROD_CAT_ID}`, { icon: '🧼' }, 200, 'Update product category', ADMIN_TOKEN2);
await test('DELETE', `/api/product-categories/${PROD_CAT_ID}`, null, 200, 'Soft-delete', ADMIN_TOKEN2);

// Recreate
r = await test('POST', '/api/product-categories', {
  nameHi: 'शैम्पू', nameEn: 'Shampoo', slug: 'shampoo-2', icon: '🧴'
}, 201, 'Re-create product category', ADMIN_TOKEN2);
const PROD_CAT_ID2 = extract(r.data, 'data', 'id');

// ============ PRODUCTS ============
console.log('\n━━━ 17. PRODUCTS ━━━');

r = await test('POST', '/api/products', {
  nameHi: 'लोरियल शैम्पू', nameEn: 'LOreal Shampoo', slug: 'loreal-shampoo',
  price: '450.00', costPrice: '300.00', categoryId: PROD_CAT_ID2
}, 201, 'Create product', ADMIN_TOKEN2);
const PROD_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/products', null, 200, 'List products');
await test('GET', `/api/products/${PROD_ID}`, null, 200, 'Get product detail');
await test('PATCH', `/api/products/${PROD_ID}`, { price: '475.00' }, 200, 'Update product', ADMIN_TOKEN2);
await test('DELETE', `/api/products/${PROD_ID}`, null, 200, 'Soft-delete product', ADMIN_TOKEN2);

// Recreate for sales
r = await test('POST', '/api/products', {
  nameHi: 'लोरियल शैम्पू', nameEn: 'LOreal Shampoo', slug: 'loreal-shampoo-2',
  price: '450.00', costPrice: '300.00', categoryId: PROD_CAT_ID2
}, 201, 'Re-create product', ADMIN_TOKEN2);
const PROD_ID2 = extract(r.data, 'data', 'id');

// ============ PRODUCT SALES ============
console.log('\n━━━ 18. PRODUCT SALES ━━━');

r = await test('POST', '/api/product-sales', {
  customerId: USER_ID, branchId: BRANCH_ID, totalAmount: '900.00',
  items: [{ productId: PROD_ID2, quantity: 2, unitPrice: '450.00', totalPrice: '900.00' }]
}, [200, 201], 'Create product sale', ADMIN_TOKEN2);
const SALE_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/product-sales', null, 200, 'List product sales', ADMIN_TOKEN2);
await test('GET', `/api/product-sales/${SALE_ID}`, null, 200, 'Get sale detail', ADMIN_TOKEN2);
await test('PATCH', `/api/product-sales/${SALE_ID}`, { status: 'COMPLETED' }, 200, 'Update sale status', ADMIN_TOKEN2);

// ============ INVENTORY ============
console.log('\n━━━ 19. INVENTORY ━━━');

r = await test('GET', '/api/inventory', null, 200, 'List inventory', ADMIN_TOKEN2);
const INV_ITEMS = extract(r.data, 'data', 'items') || [];
const INV_ID = INV_ITEMS.length > 0 ? INV_ITEMS[0]?.id : '';

await test('GET', '/api/inventory/low-stock', null, 200, 'List low-stock items', ADMIN_TOKEN2);

if (INV_ID) {
  await test('GET', `/api/inventory/${INV_ID}`, null, 200, 'Get inventory item', ADMIN_TOKEN2);
  await test('PATCH', `/api/inventory/${INV_ID}`, { quantity: 50, lowStockThreshold: 10 }, 200, 'Update inventory', ADMIN_TOKEN2);
  await test('GET', `/api/inventory/${INV_ID}/transactions`, null, 200, 'List transactions', ADMIN_TOKEN2);
  await test('POST', `/api/inventory/${INV_ID}/transactions`, {
    type: 'PURCHASE', quantity: 100, reason: 'Monthly restock'
  }, 201, 'Add stock transaction', ADMIN_TOKEN2);
} else {
  console.log('  ⚠️ No inventory item found, skipping detail tests');
}

// ============ EXPENSES ============
console.log('\n━━━ 20. EXPENSES ━━━');

r = await test('POST', '/api/expenses', {
  branchId: BRANCH_ID, category: 'RENT', amount: '50000.00',
  description: 'January Rent', date: '2025-01-31'
}, 201, 'Create expense', ADMIN_TOKEN2);
const EXPENSE_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/expenses', null, 200, 'List expenses', ADMIN_TOKEN2);
await test('GET', `/api/expenses/${EXPENSE_ID}`, null, 200, 'Get expense detail', ADMIN_TOKEN2);
await test('PATCH', `/api/expenses/${EXPENSE_ID}`, { amount: '55000.00' }, 200, 'Update expense', ADMIN_TOKEN2);
await test('DELETE', `/api/expenses/${EXPENSE_ID}`, null, 200, 'Delete expense', ADMIN_TOKEN2);

// ============ REVENUE ============
console.log('\n━━━ 21. REVENUE ━━━');

await test('GET', '/api/revenue/summary', null, 200, 'Revenue summary', ADMIN_TOKEN2);
await test('GET', '/api/revenue/daily', null, 200, 'Daily revenue', ADMIN_TOKEN2);
await test('POST', '/api/revenue/generate', { branchId: BRANCH_ID, date: '2025-07-15', period: 'daily' }, [200, 201], 'Generate snapshot', ADMIN_TOKEN2);

// ============ STAFF COMMISSIONS ============
console.log('\n━━━ 22. STAFF COMMISSIONS ━━━');

// Create a commission record in DB
try {
  execSync(`npx prisma db execute --schema prisma/schema.prisma --stdin`, {
    input: `INSERT INTO staff_commissions (id, "staffId", "bookingId", amount, rate, status, "createdAt", "updatedAt") VALUES ('test_comm_001', '${STAFF_ID}', '${BOOKING_ID}', 750.00, 15.00, 'PENDING', datetime('now'), datetime('now'));`,
    cwd: '/home/z/my-project', stdio: 'pipe'
  });
} catch (e) { console.log('  ⚠️ Commission insert failed:', e.message?.substring(0,100)); }

r = await test('GET', '/api/commissions', null, 200, 'List commissions', ADMIN_TOKEN2);
const COMM_ITEMS = extract(r.data, 'data', 'commissions') || extract(r.data, 'data', 'items') || [];
const COMM_ID = COMM_ITEMS.length > 0 ? COMM_ITEMS[0]?.id : 'test_comm_001';

await test('GET', `/api/commissions/staff/${STAFF_ID}`, null, 200, 'List staff commissions', ADMIN_TOKEN2);

if (COMM_ID) {
  await test('GET', `/api/commissions/${COMM_ID}`, null, 200, 'Get commission detail', ADMIN_TOKEN2);
  await test('PATCH', `/api/commissions/${COMM_ID}/pay`, null, 200, 'Pay commission', ADMIN_TOKEN2);
}

// ============ NOTIFICATIONS ============
console.log('\n━━━ 23. NOTIFICATIONS ━━━');

r = await test('POST', '/api/notifications', {
  userId: USER_ID, channel: 'WHATSAPP', title: 'बुकिंग कन्फर्म',
  message: 'आपकी बुकिंग कन्फर्म हो गई!', trigger: 'BOOKING_CONFIRMED'
}, 201, 'Create notification', ADMIN_TOKEN2);
const NOTIF_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/notifications', null, 200, 'List notifications', USER_TOKEN2);
await test('PATCH', `/api/notifications/${NOTIF_ID}/read`, null, 200, 'Mark read', USER_TOKEN2);
await test('POST', '/api/notifications/mark-all-read', null, 200, 'Mark all read', USER_TOKEN2);
await test('GET', '/api/notifications/unread-count', null, 200, 'Unread count', USER_TOKEN2);

// ============ PORTFOLIO & MEDIA ============
console.log('\n━━━ 24. PORTFOLIO & MEDIA ━━━');

await test('GET', '/api/portfolio', null, 200, 'List portfolio items');
await test('POST', '/api/media', {
  ownerId: SVC_ID2, ownerType: 'SERVICE',
  url: 'https://cdn.example.com/service1.jpg', altHi: 'फेशियल', altEn: 'Facial'
}, 201, 'Save media asset', ADMIN_TOKEN2);

// ============ BLOG ============
console.log('\n━━━ 25. BLOG ━━━');

r = await test('POST', '/api/blog/categories', {
  nameHi: 'स्किन केयर टिप्स', nameEn: 'Skin Care Tips', slug: 'skin-care-tips'
}, 201, 'Create blog category', ADMIN_TOKEN2);
const BLOG_CAT_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/blog/categories', null, 200, 'List blog categories');
await test('PATCH', `/api/blog/categories/${BLOG_CAT_ID}`, { nameEn: 'Skin Care Tips & Tricks' }, 200, 'Update blog category', ADMIN_TOKEN2);

r = await test('POST', '/api/blog/posts', {
  categoryId: BLOG_CAT_ID, titleHi: '10 ब्यूटी टिप्स', titleEn: '10 Beauty Tips',
  slug: '10-beauty-tips', contentHi: 'यहाँ 10 ब्यूटी टिप्स हैं...',
  contentEn: 'Here are 10 beauty tips...', excerptHi: 'ब्यूटी टिप्स', excerptEn: 'Beauty tips'
}, 201, 'Create blog post', ADMIN_TOKEN2);
const BLOG_POST_ID = extract(r.data, 'data', 'id');

await test('GET', '/api/blog/posts', null, 200, 'List blog posts');
await test('GET', `/api/blog/posts/${BLOG_POST_ID}`, null, 200, 'Get blog post', ADMIN_TOKEN2);
await test('PATCH', `/api/blog/posts/${BLOG_POST_ID}`, { titleEn: '10 Essential Beauty Tips' }, 200, 'Update blog post', ADMIN_TOKEN2);
await test('PATCH', `/api/blog/posts/${BLOG_POST_ID}/publish`, null, 200, 'Publish blog post', ADMIN_TOKEN2);
await test('DELETE', `/api/blog/posts/${BLOG_POST_ID}`, null, 200, 'Soft-delete blog post', ADMIN_TOKEN2);
await test('DELETE', `/api/blog/categories/${BLOG_CAT_ID}`, null, 200, 'Soft-delete blog category', ADMIN_TOKEN2);

// ============ SLOTS ============
console.log('\n━━━ 26. SLOTS ━━━');

await test('GET', `/api/slots/available?branchId=${BRANCH_ID}&date=2025-07-15&serviceId=${SVC_ID2}`, null, 200, 'Check available slots');

// ============ API SPEC ============
console.log('\n━━━ 27. API SPEC ━━━');

await test('GET', '/api/api-spec', null, 200, 'Get OpenAPI spec');

// ============ SUMMARY ============
console.log('\n============================================================');
console.log('  TEST SUMMARY');
console.log('============================================================');
console.log(`  ✅ PASSED: ${PASS}`);
console.log(`  ❌ FAILED: ${FAIL}`);
console.log(`  TOTAL:    ${PASS + FAIL}`);

if (ERRORS.length > 0) {
  console.log('\n❌ FAILED ENDPOINTS:');
  ERRORS.forEach(e => console.log(`  ${e}`));
}

console.log('');
if (FAIL === 0) {
  console.log('🎉 ALL ENDPOINTS PASSED! No gaps found!');
} else {
  console.log(`⚠️  ${FAIL} endpoint(s) need fixing.`);
}
