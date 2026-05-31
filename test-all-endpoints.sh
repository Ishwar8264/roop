#!/bin/bash
# ============================================================
# Nikharta Roop — Complete API Endpoint Test Script
# Tests all 97 endpoint-methods across 28 feature areas
# ============================================================

BASE="http://localhost:3000"
PASS=0
FAIL=0
ERRORS=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

test_endpoint() {
  local method=$1
  local path=$2
  local body=$3
  local expected_status=$4
  local description=$5
  local auth_token=$6

  local cmd="curl -s -o /tmp/test_resp.json -w '%{http_code}' -X $method"
  cmd="$cmd -H 'Content-Type: application/json'"
  
  if [ -n "$auth_token" ]; then
    cmd="$cmd -H 'Authorization: Bearer $auth_token'"
  fi
  
  if [ -n "$body" ]; then
    cmd="$cmd -d '$body'"
  fi
  
  cmd="$cmd $BASE$path"

  local status_code=$(eval $cmd 2>/dev/null)
  local resp=$(cat /tmp/test_resp.json 2>/dev/null)
  
  # Check if response is valid JSON
  local is_json="yes"
  echo "$resp" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null || is_json="no"

  if [ "$status_code" = "$expected_status" ] && [ "$is_json" = "yes" ]; then
    echo -e "  ${GREEN}✅ $method $path → $status_code${NC} ($description)"
    PASS=$((PASS+1))
    echo "$resp" > /tmp/last_resp.json
  else
    echo -e "  ${RED}❌ $method $path → $status_code (expected $expected_status)${NC} ($description)"
    if [ "$is_json" = "no" ]; then
      echo -e "     ${RED}Invalid JSON response${NC}"
    fi
    FAIL=$((FAIL+1))
    ERRORS="${ERRORS}\n  ❌ $method $path → got $status_code, expected $expected_status ($description)"
    echo "$resp" > /tmp/last_resp.json
  fi
}

extract_field() {
  local field=$1
  local file=${2:-/tmp/last_resp.json}
  python3 -c "import sys,json; d=json.load(open('$file')); print(d.get('data',{}).get('$field','') if isinstance(d.get('data'),dict) else '')" 2>/dev/null
}

echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  निखरता रूप — Complete API Endpoint Testing${NC}"
echo -e "${CYAN}============================================================${NC}"
echo ""

# ==================== 1. AUTH — Register Email ====================
echo -e "${YELLOW}━━━ 1. AUTH — Email Registration & Login ━━━${NC}"

test_endpoint POST "/api/auth/register-email" \
  '{"name":"Admin Ishwar","email":"admin@nikhartaroop.com","password":"Admin@123","mobile":"9876543210"}' \
  201 "Register admin user"

# Extract tokens
ADMIN_TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)
ADMIN_REFRESH=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('tokens',{}).get('refreshToken',''))" 2>/dev/null)
ADMIN_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('user',{}).get('id',''))" 2>/dev/null)

# Update admin role directly in DB
npx prisma db execute --stdin <<EOF 2>/dev/null
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@nikhartaroop.com';
EOF

# Re-login to get admin token
test_endpoint POST "/api/auth/login-email" \
  '{"email":"admin@nikhartaroop.com","password":"Admin@123"}' \
  200 "Login as admin"

ADMIN_TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)
ADMIN_REFRESH=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('tokens',{}).get('refreshToken',''))" 2>/dev/null)
ADMIN_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('user',{}).get('id',''))" 2>/dev/null)

echo "  ℹ️  Admin Token: ${ADMIN_TOKEN:0:30}..."
echo "  ℹ️  Admin ID: $ADMIN_ID"

# Register a regular user
test_endpoint POST "/api/auth/register-email" \
  '{"name":"Priya Sharma","email":"priya@example.com","password":"Priya@123","mobile":"9876500001"}' \
  201 "Register regular user"

USER_TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)
USER_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('user',{}).get('id',''))" 2>/dev/null)

# ==================== 2. AUTH — Other endpoints ====================
echo -e "${YELLOW}━━━ 2. AUTH — OTP, Google, Session ━━━${NC}"

test_endpoint POST "/api/auth/send-otp" \
  '{"mobile":"9876543211"}' \
  200 "Send OTP"

test_endpoint POST "/api/auth/refresh" \
  "{\"refreshToken\":\"$ADMIN_REFRESH\"}" \
  200 "Refresh token"

test_endpoint GET "/api/auth/me" "" 200 "Get own profile" "$ADMIN_TOKEN"

test_endpoint POST "/api/auth/logout" "" 200 "Logout" "$ADMIN_TOKEN"

# Re-login after logout
test_endpoint POST "/api/auth/login-email" \
  '{"email":"admin@nikhartaroop.com","password":"Admin@123"}' \
  200 "Re-login admin"

ADMIN_TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)

# ==================== 3. BRANCHES & HOLIDAYS ====================
echo -e "${YELLOW}━━━ 3. BRANCHES & HOLIDAYS ━━━${NC}"

test_endpoint POST "/api/branches" \
  "{\"nameHi\":\"राजौरी गार्डन शाखा\",\"nameEn\":\"Rajouri Garden Branch\",\"city\":\"Delhi\",\"address\":\"A-123, Rajouri Garden, New Delhi\",\"phone\":\"9876543201\",\"openTime\":\"09:00\",\"closeTime\":\"20:00\"}" \
  201 "Create branch" "$ADMIN_TOKEN"

BRANCH_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)
echo "  ℹ️  Branch ID: $BRANCH_ID"

test_endpoint GET "/api/branches" "" 200 "List branches"
test_endpoint GET "/api/branches/$BRANCH_ID" "" 200 "Get branch detail"
test_endpoint PATCH "/api/branches/$BRANCH_ID" \
  "{\"phone\":\"9876543202\"}" \
  200 "Update branch" "$ADMIN_TOKEN"
test_endpoint GET "/api/branches/$BRANCH_ID/holidays" "" 200 "List holidays"
test_endpoint POST "/api/branches/$BRANCH_ID/holidays" \
  "{\"date\":\"2025-03-14\",\"reasonHi\":\"होली\",\"reasonEn\":\"Holi\"}" \
  201 "Add holiday" "$ADMIN_TOKEN"

HOLIDAY_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# ==================== 4. USERS ====================
echo -e "${YELLOW}━━━ 4. USERS / PROFILE ━━━${NC}"

test_endpoint GET "/api/users/me" "" 200 "Get own profile" "$USER_TOKEN"
test_endpoint PATCH "/api/users/me" \
  '{"name":"Priya Kumari"}' \
  200 "Update own profile" "$USER_TOKEN"
test_endpoint PATCH "/api/users/me/password" \
  '{"currentPassword":"Priya@123","newPassword":"Priya@456"}' \
  200 "Change password" "$USER_TOKEN"
test_endpoint GET "/api/users/$USER_ID" "" 200 "Get user by ID (admin)" "$ADMIN_TOKEN"
test_endpoint PATCH "/api/users/$USER_ID" \
  '{"role":"STAFF","branchId":"'"$BRANCH_ID"'"}' \
  200 "Update user role (admin)" "$ADMIN_TOKEN"

# ==================== 5. SERVICE CATEGORIES ====================
echo -e "${YELLOW}━━━ 5. SERVICE CATEGORIES ━━━${NC}"

test_endpoint POST "/api/service-categories" \
  "{\"nameHi\":\"हेयर केयर\",\"nameEn\":\"Hair Care\",\"slug\":\"hair-care\",\"icon\":\"✂️\"}" \
  201 "Create service category" "$ADMIN_TOKEN"

CAT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/service-categories" "" 200 "List service categories"
test_endpoint GET "/api/service-categories/$CAT_ID" "" 200 "Get category detail"
test_endpoint PATCH "/api/service-categories/$CAT_ID" \
  '{"icon":"💇"}' \
  200 "Update category" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/service-categories/$CAT_ID" "" 200 "Soft-delete category" "$ADMIN_TOKEN"

# Recreate since we deleted it
test_endpoint POST "/api/service-categories" \
  "{\"nameHi\":\"हेयर केयर\",\"nameEn\":\"Hair Care\",\"slug\":\"hair-care-2\",\"icon\":\"✂️\"}" \
  201 "Re-create service category" "$ADMIN_TOKEN"
CAT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# Create more categories for services
test_endpoint POST "/api/service-categories" \
  "{\"nameHi\":\"स्किन केयर\",\"nameEn\":\"Skin Care\",\"slug\":\"skin-care\",\"icon\":\"🧴\"}" \
  201 "Create skin care category" "$ADMIN_TOKEN"
SKIN_CAT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# ==================== 6. SERVICES + VARIANTS + ADDONS ====================
echo -e "${YELLOW}━━━ 6. SERVICES + VARIANTS + ADDONS ━━━${NC}"

test_endpoint POST "/api/services" \
  "{\"nameHi\":\"फेशियल\",\"nameEn\":\"Facial\",\"slug\":\"facial\",\"descriptionHi\":\"चेहरे की सफाई और ग्लो\",\"descriptionEn\":\"Face cleanup and glow\",\"price\":\"500.00\",\"durationMinutes\":45,\"branchId\":\"$BRANCH_ID\",\"categoryId\":\"$SKIN_CAT_ID\"}" \
  201 "Create service" "$ADMIN_TOKEN"

SVC_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/services" "" 200 "List services"
test_endpoint GET "/api/services/$SVC_ID" "" 200 "Get service detail"
test_endpoint PATCH "/api/services/$SVC_ID" \
  '{"price":"550.00"}' \
  200 "Update service" "$ADMIN_TOKEN"

# Variants
test_endpoint POST "/api/services/$SVC_ID/variants" \
  "{\"nameHi\":\"गोल्ड फेशियल\",\"nameEn\":\"Gold Facial\",\"price\":\"800.00\",\"durationMinutes\":60}" \
  201 "Add variant" "$ADMIN_TOKEN"

VAR_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/services/$SVC_ID/variants" "" 200 "List variants"
test_endpoint PATCH "/api/services/$SVC_ID/variants/$VAR_ID" \
  '{"price":"850.00"}' \
  200 "Update variant" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/services/$SVC_ID/variants/$VAR_ID" "" 200 "Delete variant" "$ADMIN_TOKEN"

# AddOns
test_endpoint POST "/api/services/$SVC_ID/addons" \
  "{\"nameHi\":\"आई मास्क\",\"nameEn\":\"Eye Mask\",\"price\":\"100.00\",\"durationMinutes\":15}" \
  201 "Add add-on" "$ADMIN_TOKEN"

ADDON_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/services/$SVC_ID/addons" "" 200 "List add-ons"
test_endpoint PATCH "/api/services/$SVC_ID/addons/$ADDON_ID" \
  '{"price":"120.00"}' \
  200 "Update add-on" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/services/$SVC_ID/addons/$ADDON_ID" "" 200 "Delete add-on" "$ADMIN_TOKEN"

# Service reviews endpoint
test_endpoint GET "/api/services/$SVC_ID/reviews" "" 200 "List service reviews"

# Soft delete service
test_endpoint DELETE "/api/services/$SVC_ID" "" 200 "Soft-delete service" "$ADMIN_TOKEN"

# Create a new active service for booking tests
test_endpoint POST "/api/services" \
  "{\"nameHi\":\"ब्राइडल मेकअप\",\"nameEn\":\"Bridal Makeup\",\"slug\":\"bridal-makeup\",\"descriptionHi\":\"शादी के लिए मेकअप\",\"descriptionEn\":\"Bridal makeup service\",\"price\":\"5000.00\",\"durationMinutes\":120,\"branchId\":\"$BRANCH_ID\",\"categoryId\":\"$SKIN_CAT_ID\"}" \
  201 "Create service for bookings" "$ADMIN_TOKEN"

SVC_ID2=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# ==================== 7. STAFF ====================
echo -e "${YELLOW}━━━ 7. STAFF + SERVICES + LEAVES + PORTFOLIO ━━━${NC}"

# First, create a staff user
test_endpoint POST "/api/auth/register-email" \
  '{"name":"Sunita Devi","email":"sunita@nikhartaroop.com","password":"Sunita@123"}' \
  201 "Register staff user"

STAFF_USER_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('user',{}).get('id',''))" 2>/dev/null)

# Update to STAFF role
npx prisma db execute --stdin <<EOF 2>/dev/null
UPDATE users SET role = 'STAFF', "branchId" = '$BRANCH_ID' WHERE id = '$STAFF_USER_ID';
EOF

test_endpoint POST "/api/staff" \
  "{\"userId\":\"$STAFF_USER_ID\",\"branchId\":\"$BRANCH_ID\",\"specialization\":\"facial,bridal_makeup\",\"experienceYears\":8,\"bioHi\":\"8 साल का अनुभव\",\"bioEn\":\"8 years experience\",\"workStart\":\"09:00\",\"workEnd\":\"19:00\",\"commissionRate\":\"15.00\"}" \
  201 "Create staff profile" "$ADMIN_TOKEN"

STAFF_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/staff" "" 200 "List staff"
test_endpoint GET "/api/staff/$STAFF_ID" "" 200 "Get staff detail"
test_endpoint PATCH "/api/staff/$STAFF_ID" \
  '{"experienceYears":9}' \
  200 "Update staff" "$ADMIN_TOKEN"

# Staff services
test_endpoint POST "/api/staff/$STAFF_ID/services" \
  "{\"serviceIds\":[\"$SVC_ID2\"]}" \
  200 "Link services to staff" "$ADMIN_TOKEN"

test_endpoint GET "/api/staff/$STAFF_ID/services" "" 200 "List staff services"
test_endpoint DELETE "/api/staff/$STAFF_ID/services?serviceId=$SVC_ID2" "" 200 "Unlink service" "$ADMIN_TOKEN"

# Re-link for later tests
test_endpoint POST "/api/staff/$STAFF_ID/services" \
  "{\"serviceIds\":[\"$SVC_ID2\"]}" \
  200 "Re-link service" "$ADMIN_TOKEN"

# Staff leaves
test_endpoint POST "/api/staff/$STAFF_ID/leaves" \
  '{"date":"2025-08-15","reason":"Independence Day"}' \
  201 "Add staff leave" "$ADMIN_TOKEN"

LEAVE_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/staff/$STAFF_ID/leaves" "" 200 "List staff leaves"
test_endpoint DELETE "/api/staff/$STAFF_ID/leaves/$LEAVE_ID" "" 200 "Remove leave" "$ADMIN_TOKEN"

# Staff portfolio
test_endpoint POST "/api/staff/$STAFF_ID/portfolio" \
  "{\"titleHi\":\"ब्राइडल मेकअप\",\"titleEn\":\"Bridal Makeup\",\"imageUrl\":\"https://cdn.example.com/portfolio1.jpg\"}" \
  201 "Add portfolio item" "$ADMIN_TOKEN"

test_endpoint GET "/api/staff/$STAFF_ID/portfolio" "" 200 "List portfolio"
test_endpoint DELETE "/api/staff/$STAFF_ID/portfolio?portfolioId=test" "" 200 "Delete portfolio item" "$ADMIN_TOKEN"

# Soft delete staff
test_endpoint DELETE "/api/staff/$STAFF_ID" "" 200 "Soft-delete staff" "$ADMIN_TOKEN"

# ==================== 8. PACKAGES ====================
echo -e "${YELLOW}━━━ 8. PACKAGES ━━━${NC}"

test_endpoint POST "/api/packages" \
  "{\"nameHi\":\"ब्राइडल पैकेज\",\"nameEn\":\"Bridal Package\",\"slug\":\"bridal-package\",\"descriptionHi\":\"शादी के लिए पूरा ब्यूटी पैकेज\",\"descriptionEn\":\"Complete bridal beauty package\",\"price\":\"15000.00\",\"originalPrice\":\"18000.00\",\"durationMinutes\":360,\"branchId\":\"$BRANCH_ID\"}" \
  201 "Create package" "$ADMIN_TOKEN"

PKG_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/packages" "" 200 "List packages"
test_endpoint GET "/api/packages/$PKG_ID" "" 200 "Get package detail"
test_endpoint PATCH "/api/packages/$PKG_ID" \
  '{"price":"14000.00"}' \
  200 "Update package" "$ADMIN_TOKEN"

# Package services
test_endpoint POST "/api/packages/$PKG_ID/services" \
  "{\"serviceIds\":[\"$SVC_ID2\"]}" \
  200 "Link services to package" "$ADMIN_TOKEN"

test_endpoint GET "/api/packages/$PKG_ID/services" "" 200 "List package services"
test_endpoint DELETE "/api/packages/$PKG_ID/services?serviceId=$SVC_ID2" "" 200 "Unlink service" "$ADMIN_TOKEN"

test_endpoint DELETE "/api/packages/$PKG_ID" "" 200 "Soft-delete package" "$ADMIN_TOKEN"

# ==================== 9. BOOKINGS ====================
echo -e "${YELLOW}━━━ 9. BOOKINGS ━━━${NC}"

# Need to re-login user (password was changed)
test_endpoint POST "/api/auth/login-email" \
  '{"email":"priya@example.com","password":"Priya@456"}' \
  200 "Re-login user"

USER_TOKEN=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)

test_endpoint POST "/api/bookings" \
  "{\"serviceId\":\"$SVC_ID2\",\"staffId\":\"$STAFF_ID\",\"branchId\":\"$BRANCH_ID\",\"bookingDate\":\"2025-07-15\",\"slotStart\":\"10:00\",\"totalAmount\":\"5000.00\"}" \
  201 "Create booking" "$USER_TOKEN"

BOOKING_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/bookings" "" 200 "List bookings" "$USER_TOKEN"
test_endpoint GET "/api/bookings/$BOOKING_ID" "" 200 "Get booking detail" "$USER_TOKEN"
test_endpoint PATCH "/api/bookings/$BOOKING_ID/confirm" "" 200 "Confirm booking" "$ADMIN_TOKEN"
test_endpoint PATCH "/api/bookings/$BOOKING_ID/start" "" 200 "Start booking" "$ADMIN_TOKEN"
test_endpoint PATCH "/api/bookings/$BOOKING_ID/complete" "" 200 "Complete booking" "$ADMIN_TOKEN"

# Create another booking for cancel test
test_endpoint POST "/api/bookings" \
  "{\"serviceId\":\"$SVC_ID2\",\"branchId\":\"$BRANCH_ID\",\"bookingDate\":\"2025-07-20\",\"slotStart\":\"11:00\",\"totalAmount\":\"5000.00\"}" \
  201 "Create booking for cancel" "$USER_TOKEN"

BOOKING2_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint PATCH "/api/bookings/$BOOKING2_ID/cancel" \
  '{"cancellationReason":"Schedule conflict"}' \
  200 "Cancel booking" "$USER_TOKEN"

# Create another booking for no-show test
test_endpoint POST "/api/bookings" \
  "{\"serviceId\":\"$SVC_ID2\",\"branchId\":\"$BRANCH_ID\",\"bookingDate\":\"2025-07-25\",\"slotStart\":\"14:00\",\"totalAmount\":\"5000.00\"}" \
  201 "Create booking for no-show" "$USER_TOKEN"

BOOKING3_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint PATCH "/api/bookings/$BOOKING3_ID/confirm" "" 200 "Confirm booking" "$ADMIN_TOKEN"
test_endpoint PATCH "/api/bookings/$BOOKING3_ID/no-show" "" 200 "Mark no-show" "$ADMIN_TOKEN"

# ==================== 10. PAYMENTS ====================
echo -e "${YELLOW}━━━ 10. PAYMENTS ━━━${NC}"

test_endpoint POST "/api/payments/create-order" \
  "{\"bookingId\":\"$BOOKING_ID\",\"provider\":\"CASH\",\"amount\":\"5000.00\"}" \
  201 "Create payment order" "$USER_TOKEN"

PAYMENT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/payments" "" 200 "List payments" "$ADMIN_TOKEN"
test_endpoint GET "/api/payments/$PAYMENT_ID" "" 200 "Get payment detail" "$ADMIN_TOKEN"
test_endpoint POST "/api/payments/verify" \
  "{\"paymentId\":\"$PAYMENT_ID\",\"providerRefId\":\"CASH_TEST_001\"}" \
  200 "Verify payment" "$USER_TOKEN"

# ==================== 11. REFUNDS ====================
echo -e "${YELLOW}━━━ 11. REFUNDS ━━━${NC}"

test_endpoint POST "/api/refunds" \
  "{\"paymentId\":\"$PAYMENT_ID\",\"amount\":\"2500.00\",\"reason\":\"Partial service not rendered\"}" \
  201 "Create refund" "$ADMIN_TOKEN"

REFUND_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint PATCH "/api/refunds/$REFUND_ID" \
  '{"action":"approve"}' \
  200 "Process refund" "$ADMIN_TOKEN"

# ==================== 12. REVIEWS ====================
echo -e "${YELLOW}━━━ 12. REVIEWS ━━━${NC}"

test_endpoint POST "/api/reviews" \
  "{\"bookingId\":\"$BOOKING_ID\",\"serviceId\":\"$SVC_ID2\",\"staffId\":\"$STAFF_ID\",\"rating\":5,\"commentHi\":\"बहुत अच्छा सर्विस!\"}" \
  201 "Create review" "$USER_TOKEN"

REVIEW_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/reviews" "" 200 "List reviews"
test_endpoint GET "/api/reviews/$REVIEW_ID" "" 200 "Get review detail"
test_endpoint PATCH "/api/reviews/$REVIEW_ID" \
  '{"isApproved":true}' \
  200 "Approve review" "$ADMIN_TOKEN"

# ==================== 13. OFFERS & PROMOS ====================
echo -e "${YELLOW}━━━ 13. OFFERS & PROMOS ━━━${NC}"

test_endpoint POST "/api/offers" \
  "{\"code\":\"DIWALI20\",\"titleHi\":\"दिवाली ऑफर\",\"titleEn\":\"Diwali Offer\",\"discountType\":\"PERCENTAGE\",\"discountValue\":\"20.00\",\"validFrom\":\"2025-01-01T00:00:00Z\",\"validUntil\":\"2025-12-31T23:59:59Z\",\"minOrder\":\"500.00\",\"maxDiscount\":\"1000.00\"}" \
  201 "Create offer" "$ADMIN_TOKEN"

OFFER_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/offers" "" 200 "List offers"
test_endpoint GET "/api/offers/$OFFER_ID" "" 200 "Get offer detail"
test_endpoint PATCH "/api/offers/$OFFER_ID" \
  '{"discountValue":"25.00"}' \
  200 "Update offer" "$ADMIN_TOKEN"

# Offer services
test_endpoint POST "/api/offers/$OFFER_ID/services" \
  "{\"serviceIds\":[\"$SVC_ID2\"]}" \
  200 "Link services to offer" "$ADMIN_TOKEN"

test_endpoint GET "/api/offers/$OFFER_ID/services" "" 200 "List offer services"
test_endpoint DELETE "/api/offers/$OFFER_ID/services?serviceId=$SVC_ID2" "" 200 "Unlink service" "$ADMIN_TOKEN"

# Validate promo
test_endpoint POST "/api/offers/validate" \
  '{"code":"DIWALI20","amount":"5000.00"}' \
  200 "Validate promo code"

test_endpoint DELETE "/api/offers/$OFFER_ID" "" 200 "Soft-delete offer" "$ADMIN_TOKEN"

# ==================== 14. LOYALTY POINTS ====================
echo -e "${YELLOW}━━━ 14. LOYALTY POINTS ━━━${NC}"

test_endpoint GET "/api/loyalty/balance" "" 200 "Get loyalty balance" "$USER_TOKEN"
test_endpoint GET "/api/loyalty/history" "" 200 "Get loyalty history" "$USER_TOKEN"
test_endpoint POST "/api/loyalty/redeem" \
  '{"points":10}' \
  200 "Redeem loyalty points" "$USER_TOKEN"
test_endpoint POST "/api/loyalty/expire" \
  "{\"userId\":\"$USER_ID\",\"points\":5}" \
  200 "Expire loyalty points" "$ADMIN_TOKEN"

# ==================== 15. ADDRESSES ====================
echo -e "${YELLOW}━━━ 15. ADDRESSES ━━━${NC}"

test_endpoint POST "/api/addresses" \
  '{"label":"Home","address":"123, Model Town","city":"Delhi","pincode":"110027","landmark":"Near Metro Station","isDefault":true}' \
  201 "Create address" "$USER_TOKEN"

ADDR_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/addresses" "" 200 "List addresses" "$USER_TOKEN"
test_endpoint GET "/api/addresses/$ADDR_ID" "" 200 "Get address detail" "$USER_TOKEN"
test_endpoint PATCH "/api/addresses/$ADDR_ID" \
  '{"city":"New Delhi"}' \
  200 "Update address" "$USER_TOKEN"
test_endpoint PATCH "/api/addresses/$ADDR_ID/default" "" 200 "Set default address" "$USER_TOKEN"
test_endpoint DELETE "/api/addresses/$ADDR_ID" "" 200 "Delete address" "$USER_TOKEN"

# ==================== 16. CONSULTATIONS ====================
echo -e "${YELLOW}━━━ 16. CONSULTATIONS ━━━${NC}"

test_endpoint POST "/api/consultations" \
  "{\"branchId\":\"$BRANCH_ID\",\"date\":\"2025-07-10\",\"time\":\"11:00\",\"staffId\":\"$STAFF_ID\"}" \
  201 "Create consultation" "$USER_TOKEN"

CONSULT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/consultations" "" 200 "List consultations" "$USER_TOKEN"
test_endpoint GET "/api/consultations/$CONSULT_ID" "" 200 "Get consultation detail" "$USER_TOKEN"
test_endpoint PATCH "/api/consultations/$CONSULT_ID/complete" \
  '{"notes":"Recommended bridal package"}' \
  200 "Complete consultation" "$ADMIN_TOKEN"

# Create another for cancel test
test_endpoint POST "/api/consultations" \
  "{\"branchId\":\"$BRANCH_ID\",\"date\":\"2025-07-20\",\"time\":\"15:00\"}" \
  201 "Create consultation for cancel" "$USER_TOKEN"

CONSULT2_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint PATCH "/api/consultations/$CONSULT2_ID/cancel" "" 200 "Cancel consultation" "$USER_TOKEN"

# ==================== 17. PRODUCT CATEGORIES ====================
echo -e "${YELLOW}━━━ 17. PRODUCT CATEGORIES ━━━${NC}"

test_endpoint POST "/api/product-categories" \
  "{\"nameHi\":\"शैम्पू\",\"nameEn\":\"Shampoo\",\"slug\":\"shampoo\",\"icon\":\"🧴\"}" \
  201 "Create product category" "$ADMIN_TOKEN"

PROD_CAT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/product-categories" "" 200 "List product categories"
test_endpoint GET "/api/product-categories/$PROD_CAT_ID" "" 200 "Get product category detail"
test_endpoint PATCH "/api/product-categories/$PROD_CAT_ID" \
  '{"icon":"🧼"}' \
  200 "Update product category" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/product-categories/$PROD_CAT_ID" "" 200 "Soft-delete product category" "$ADMIN_TOKEN"

# Recreate
test_endpoint POST "/api/product-categories" \
  "{\"nameHi\":\"शैम्पू\",\"nameEn\":\"Shampoo\",\"slug\":\"shampoo-2\",\"icon\":\"🧴\"}" \
  201 "Re-create product category" "$ADMIN_TOKEN"

PROD_CAT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# ==================== 18. PRODUCTS ====================
echo -e "${YELLOW}━━━ 18. PRODUCTS ━━━${NC}"

test_endpoint POST "/api/products" \
  "{\"nameHi\":\"लोरियल शैम्पू\",\"nameEn\":\"LOreal Shampoo\",\"slug\":\"loreal-shampoo\",\"price\":\"450.00\",\"costPrice\":\"300.00\",\"categoryId\":\"$PROD_CAT_ID\"}" \
  201 "Create product" "$ADMIN_TOKEN"

PROD_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/products" "" 200 "List products"
test_endpoint GET "/api/products/$PROD_ID" "" 200 "Get product detail"
test_endpoint PATCH "/api/products/$PROD_ID" \
  '{"price":"475.00"}' \
  200 "Update product" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/products/$PROD_ID" "" 200 "Soft-delete product" "$ADMIN_TOKEN"

# Recreate for inventory
test_endpoint POST "/api/products" \
  "{\"nameHi\":\"लोरियल शैम्पू\",\"nameEn\":\"LOreal Shampoo\",\"slug\":\"loreal-shampoo-2\",\"price\":\"450.00\",\"costPrice\":\"300.00\",\"categoryId\":\"$PROD_CAT_ID\"}" \
  201 "Re-create product" "$ADMIN_TOKEN"

PROD_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

# ==================== 19. PRODUCT SALES ====================
echo -e "${YELLOW}━━━ 19. PRODUCT SALES ━━━${NC}"

test_endpoint POST "/api/product-sales" \
  "{\"customerId\":\"$USER_ID\",\"branchId\":\"$BRANCH_ID\",\"totalAmount\":\"900.00\",\"items\":[{\"productId\":\"$PROD_ID\",\"quantity\":2,\"unitPrice\":\"450.00\",\"totalPrice\":\"900.00\"}]}" \
  201 "Create product sale" "$USER_TOKEN"

SALE_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/product-sales" "" 200 "List product sales" "$ADMIN_TOKEN"
test_endpoint GET "/api/product-sales/$SALE_ID" "" 200 "Get sale detail" "$USER_TOKEN"
test_endpoint PATCH "/api/product-sales/$SALE_ID" \
  '{"status":"COMPLETED"}' \
  200 "Update sale status" "$ADMIN_TOKEN"

# ==================== 20. INVENTORY ====================
echo -e "${YELLOW}━━━ 20. INVENTORY ━━━${NC}"

test_endpoint GET "/api/inventory" "" 200 "List inventory" "$ADMIN_TOKEN"
test_endpoint GET "/api/inventory/low-stock" "" 200 "List low-stock items" "$ADMIN_TOKEN"

# Find inventory item for product
INV_ID=$(cd /home/z/my-project && npx prisma db execute --stdin 2>/dev/null <<EOF
SELECT id FROM inventory_items WHERE "productId" = '$PROD_ID' LIMIT 1;
EOF
)
# Try getting it via API
test_endpoint GET "/api/inventory" "" 200 "List inventory (get ID)" "$ADMIN_TOKEN"

# Get first inventory item ID
INV_ITEM_ID=$(python3 -c "
import json
d=json.load(open('/tmp/last_resp.json'))
items = d.get('data',{}).get('items',[])
if items:
    print(items[0].get('id',''))
else:
    print('')
" 2>/dev/null)

if [ -n "$INV_ITEM_ID" ]; then
  test_endpoint GET "/api/inventory/$INV_ITEM_ID" "" 200 "Get inventory item" "$ADMIN_TOKEN"
  test_endpoint PATCH "/api/inventory/$INV_ITEM_ID" \
    '{"quantity":50,"lowStockThreshold":10}' \
    200 "Update inventory item" "$ADMIN_TOKEN"
  test_endpoint GET "/api/inventory/$INV_ITEM_ID/transactions" "" 200 "List inventory transactions" "$ADMIN_TOKEN"
  test_endpoint POST "/api/inventory/$INV_ITEM_ID/transactions" \
    '{"type":"PURCHASE","quantity":100,"reason":"Monthly restock"}' \
    201 "Add stock transaction" "$ADMIN_TOKEN"
else
  echo "  ⚠️ No inventory item found, skipping detail tests"
fi

# ==================== 21. EXPENSES ====================
echo -e "${YELLOW}━━━ 21. EXPENSES ━━━${NC}"

test_endpoint POST "/api/expenses" \
  "{\"branchId\":\"$BRANCH_ID\",\"category\":\"RENT\",\"amount\":\"50000.00\",\"description\":\"January Rent\",\"date\":\"2025-01-31\"}" \
  201 "Create expense" "$ADMIN_TOKEN"

EXPENSE_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/expenses" "" 200 "List expenses" "$ADMIN_TOKEN"
test_endpoint GET "/api/expenses/$EXPENSE_ID" "" 200 "Get expense detail" "$ADMIN_TOKEN"
test_endpoint PATCH "/api/expenses/$EXPENSE_ID" \
  '{"amount":"55000.00"}' \
  200 "Update expense" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/expenses/$EXPENSE_ID" "" 200 "Delete expense" "$ADMIN_TOKEN"

# ==================== 22. REVENUE SNAPSHOTS ====================
echo -e "${YELLOW}━━━ 22. REVENUE SNAPSHOTS ━━━${NC}"

test_endpoint GET "/api/revenue/summary" "" 200 "Revenue summary" "$ADMIN_TOKEN"
test_endpoint GET "/api/revenue/daily" "" 200 "Daily revenue" "$ADMIN_TOKEN"
test_endpoint POST "/api/revenue/generate" \
  '{"branchId":"'"$BRANCH_ID"'","date":"2025-07-15","period":"daily"}' \
  201 "Generate revenue snapshot" "$ADMIN_TOKEN"

# ==================== 23. STAFF COMMISSIONS ====================
echo -e "${YELLOW}━━━ 23. STAFF COMMISSIONS ━━━${NC}"

test_endpoint GET "/api/commissions" "" 200 "List commissions" "$ADMIN_TOKEN"
test_endpoint GET "/api/commissions/staff/$STAFF_ID" "" 200 "List staff commissions" "$ADMIN_TOKEN"

# Get a commission ID
COMM_ID=$(python3 -c "
import json
d=json.load(open('/tmp/last_resp.json'))
items = d.get('data',{}).get('commissions',d.get('data',{}).get('items',[]))
if items:
    print(items[0].get('id',''))
else:
    print('')
" 2>/dev/null)

if [ -n "$COMM_ID" ]; then
  test_endpoint GET "/api/commissions/$COMM_ID" "" 200 "Get commission detail" "$ADMIN_TOKEN"
  test_endpoint PATCH "/api/commissions/$COMM_ID/pay" "" 200 "Pay commission" "$ADMIN_TOKEN"
else
  echo "  ⚠️ No commission found, trying to get list"
  # Commission may not exist yet; try creating one manually
  npx prisma db execute --stdin 2>/dev/null <<COMMEOF
INSERT INTO staff_commissions (id, "staffId", "bookingId", amount, rate, status, "createdAt", "updatedAt")
VALUES ('test_comm_001', '$STAFF_ID', '$BOOKING_ID', 750.00, 15.00, 'PENDING', datetime('now'), datetime('now'));
COMMEOF
  test_endpoint GET "/api/commissions" "" 200 "List commissions again" "$ADMIN_TOKEN"
  COMM_ID=$(python3 -c "
import json
d=json.load(open('/tmp/last_resp.json'))
items = d.get('data',{}).get('commissions',d.get('data',{}).get('items',[]))
if items:
    print(items[0].get('id',''))
else:
    print('')
" 2>/dev/null)
  if [ -n "$COMM_ID" ]; then
    test_endpoint GET "/api/commissions/$COMM_ID" "" 200 "Get commission detail" "$ADMIN_TOKEN"
    test_endpoint PATCH "/api/commissions/$COMM_ID/pay" "" 200 "Pay commission" "$ADMIN_TOKEN"
  fi
fi

# ==================== 24. NOTIFICATIONS ====================
echo -e "${YELLOW}━━━ 24. NOTIFICATIONS ━━━${NC}"

test_endpoint POST "/api/notifications" \
  "{\"userId\":\"$USER_ID\",\"channel\":\"WHATSAPP\",\"title\":\"बुकिंग कन्फर्म\",\"message\":\"आपकी बुकिंग कन्फर्म हो गई!\",\"trigger\":\"BOOKING_CONFIRMED\"}" \
  201 "Create notification" "$ADMIN_TOKEN"

NOTIF_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/notifications" "" 200 "List notifications" "$USER_TOKEN"
test_endpoint PATCH "/api/notifications/$NOTIF_ID/read" "" 200 "Mark notification read" "$USER_TOKEN"
test_endpoint POST "/api/notifications/mark-all-read" "" 200 "Mark all read" "$USER_TOKEN"
test_endpoint GET "/api/notifications/unread-count" "" 200 "Unread count" "$USER_TOKEN"

# ==================== 25. PORTFOLIO & MEDIA ====================
echo -e "${YELLOW}━━━ 25. PORTFOLIO & MEDIA ━━━${NC}"

test_endpoint GET "/api/portfolio" "" 200 "List portfolio items"
test_endpoint POST "/api/media" \
  "{\"ownerId\":\"$SVC_ID2\",\"ownerType\":\"SERVICE\",\"url\":\"https://cdn.example.com/service1.jpg\",\"altHi\":\"फेशियल सेवा\",\"altEn\":\"Facial Service\"}" \
  201 "Save media asset" "$ADMIN_TOKEN"

# ==================== 26. BLOG ====================
echo -e "${YELLOW}━━━ 26. BLOG ━━━${NC}"

# Blog categories
test_endpoint POST "/api/blog/categories" \
  "{\"nameHi\":\"स्किन केयर टिप्स\",\"nameEn\":\"Skin Care Tips\",\"slug\":\"skin-care-tips\"}" \
  201 "Create blog category" "$ADMIN_TOKEN"

BLOG_CAT_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/blog/categories" "" 200 "List blog categories"
test_endpoint PATCH "/api/blog/categories/$BLOG_CAT_ID" \
  '{"nameEn":"Skin Care Tips & Tricks"}' \
  200 "Update blog category" "$ADMIN_TOKEN"

# Blog posts
test_endpoint POST "/api/blog/posts" \
  "{\"categoryId\":\"$BLOG_CAT_ID\",\"titleHi\":\"10 ब्यूटी टिप्स\",\"titleEn\":\"10 Beauty Tips\",\"slug\":\"10-beauty-tips\",\"contentHi\":\"यहाँ 10 ब्यूटी टिप्स हैं...\",\"contentEn\":\"Here are 10 beauty tips...\",\"excerptHi\":\"ब्यूटी के लिए टिप्स\",\"excerptEn\":\"Tips for beauty\"}" \
  201 "Create blog post" "$ADMIN_TOKEN"

BLOG_POST_ID=$(python3 -c "import json; d=json.load(open('/tmp/last_resp.json')); print(d.get('data',{}).get('id',''))" 2>/dev/null)

test_endpoint GET "/api/blog/posts" "" 200 "List blog posts"
test_endpoint GET "/api/blog/posts/$BLOG_POST_ID" "" 200 "Get blog post detail" "$ADMIN_TOKEN"
test_endpoint PATCH "/api/blog/posts/$BLOG_POST_ID" \
  '{"titleEn":"10 Essential Beauty Tips"}' \
  200 "Update blog post" "$ADMIN_TOKEN"
test_endpoint PATCH "/api/blog/posts/$BLOG_POST_ID/publish" "" 200 "Publish blog post" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/blog/posts/$BLOG_POST_ID" "" 200 "Soft-delete blog post" "$ADMIN_TOKEN"
test_endpoint DELETE "/api/blog/categories/$BLOG_CAT_ID" "" 200 "Soft-delete blog category" "$ADMIN_TOKEN"

# ==================== 27. SLOT AVAILABILITY ====================
echo -e "${YELLOW}━━━ 27. SLOT AVAILABILITY ━━━${NC}"

test_endpoint GET "/api/slots/available?branchId=$BRANCH_ID&date=2025-07-15&serviceId=$SVC_ID2" "" 200 "Check available slots"

# ==================== 28. API SPEC ====================
echo -e "${YELLOW}━━━ 28. API SPEC ━━━${NC}"

test_endpoint GET "/api/api-spec" "" 200 "Get OpenAPI spec"

# ==================== SUMMARY ====================
echo ""
echo -e "${CYAN}============================================================${NC}"
echo -e "${CYAN}  TEST SUMMARY${NC}"
echo -e "${CYAN}============================================================${NC}"
echo -e "  ${GREEN}PASSED: $PASS${NC}"
echo -e "  ${RED}FAILED: $FAIL${NC}"
echo -e "  TOTAL:  $((PASS+FAIL))"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "${RED}FAILED ENDPOINTS:${NC}"
  echo -e "$ERRORS"
fi

echo ""
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL ENDPOINTS PASSED! No gaps found!${NC}"
else
  echo -e "${YELLOW}⚠️  $FAIL endpoint(s) need fixing. See errors above.${NC}"
fi
