/**
 * Purpose: Static configuration values for Nikharta Roop application
 * Responsibility: Central place for all constant values
 * Important Notes: Do NOT put runtime values or state here
 */

// ==================== App Info ====================

export const APP_NAME = "निखरता रूप";
export const APP_NAME_EN = "Nikharta Roop";
export const APP_DESCRIPTION = "भारत का सबसे भरोसेमंद ब्यूटी पार्लर";

// ==================== Theme Colors ====================

export const COLORS = {
  primary: "#C2185B",
  primaryDark: "#880E4F",
  primaryLight: "#F48FB1",
  rose50: "#FCE4EC",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  background: "#FAFAFA",
  cardBackground: "#FFFFFF",
  textPrimary: "#212121",
  textSecondary: "#757575",
} as const;

// ==================== Booking Config ====================

export const BOOKING_CONFIG = {
  slotIntervalMinutes: 30,
  bookingHorizonDays: 60,
  minimumAdvanceHours: 2,
  cancelWindowHours: 2,
  pendingExpiryMinutes: 15,
  maxSlotsPerDay: 22,
} as const;

// ==================== Auth Config ====================

export const AUTH_CONFIG = {
  otpLength: 6,
  otpExpiryMinutes: 5,
  otpMaxAttempts: 3,
  otpLockoutMinutes: 15,
  otpResendCooldownSeconds: 30,
  tokenExpiryDays: 7,
} as const;

// ==================== Pagination ====================

export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

// ==================== User Roles ====================

export const ROLES = {
  GUEST: "GUEST",
  USER: "USER",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
} as const;

// ==================== Booking Statuses ====================

export const BOOKING_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

// ==================== Discount Types ====================

export const DISCOUNT_TYPES = {
  PERCENTAGE: "PERCENTAGE",
  FLAT_AMOUNT: "FLAT_AMOUNT",
} as const;

// ==================== Notification Channels ====================

export const NOTIFICATION_CHANNELS = {
  WHATSAPP: "WHATSAPP",
  SMS: "SMS",
  EMAIL: "EMAIL",
  PUSH: "PUSH",
} as const;

// ==================== Service Categories ====================

export const SERVICE_CATEGORIES = [
  { id: "hair_care", nameHi: "हेयर केयर", nameEn: "Hair Care" },
  { id: "face_care", nameHi: "फेस केयर", nameEn: "Face Care" },
  { id: "skin_care", nameHi: "स्किन केयर", nameEn: "Skin Care" },
  { id: "bridal", nameHi: "ब्राइडल", nameEn: "Bridal" },
  { id: "nail_care", nameHi: "नेल केयर", nameEn: "Nail Care" },
  { id: "body_care", nameHi: "बॉडी केयर", nameEn: "Body Care" },
  { id: "makeup", nameHi: "मेकअप", nameEn: "Makeup" },
  { id: "mehendi", nameHi: "मेहंदी", nameEn: "Mehendi" },
] as const;

// ==================== Currency ====================

export const CURRENCY = {
  symbol: "₹",
  code: "INR",
  locale: "hi-IN",
} as const;

// ==================== Hindi UI Strings ====================

export const HINDI_STRINGS = {
  bookNow: "अभी बुक करें",
  login: "लॉगिन करें",
  sendOtp: "OTP भेजें",
  verifyOtp: "OTP सत्यापित करें",
  cancel: "रद्द करें",
  confirm: "पुष्टि करें",
  save: "सहेजें",
  delete: "हटाएं",
  edit: "संपादित करें",
  search: "खोजें",
  noResults: "कोई परिणाम नहीं मिला",
  loading: "लोड हो रहा है...",
  error: "कुछ गलत हो गया",
  success: "सफल!",
  viewAll: "सभी देखें",
  services: "सेवाएं",
  bookings: "बुकिंग",
  profile: "प्रोफ़ाइल",
  offers: "ऑफ़र",
  reviews: "समीक्षाएं",
  branches: "शाखाएं",
  home: "होम",
  myAppointments: "मेरी अपॉइंटमेंट",
  contactUs: "हमसे संपर्क करें",
} as const;
