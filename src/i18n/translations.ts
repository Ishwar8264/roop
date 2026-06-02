/**
 * Purpose: Translation dictionaries for English and Hindi
 * Responsibility: Provide all UI strings in both languages
 * Important Notes:
 *   - Every key MUST exist in both "en" and "hi" objects
 *   - Use dot notation keys for nested access (e.g., "nav.home")
 *   - English is the source of truth — Hindi follows
 *   - Keep translations organized by feature/section
 */

export const translations = {
  en: {
    // App
    appName: "Nikharta Roop",
    appNameHi: "निखरता रूप",
    appTagline: "Your beauty, our responsibility",
    appDescription: "India's most trusted beauty parlour. Book now — Facial, Bridal Makeup, Hair Cutting and more.",

    // Navigation
    nav: {
      home: "Home",
      services: "Services",
      bookings: "Bookings",
      offers: "Offers",
      profile: "Profile",
      blog: "Blog",
    },

    // User Menu
    userMenu: {
      profile: "Profile",
      myBookings: "My Bookings",
      loyaltyPoints: "Loyalty Points",
      settings: "Settings",
      logout: "Logout",
      user: "User",
    },

    // Auth
    auth: {
      login: "Login",
      register: "Register",
      loginTitle: "Login",
      loginSubtitle: "Access your account",
      registerTitle: "Create Account",
      registerSubtitle: "Join Nikharta Roop",
      mobileOtp: "Mobile OTP",
      email: "Email",
      mobileNumber: "Mobile Number",
      name: "Name",
      enterMobile: "Enter 10-digit mobile number",
      enterName: "Enter your name",
      enterOtp: "Enter OTP",
      sendOtp: "Send OTP",
      verifyOtp: "Verify",
      verifyAndRegister: "Verify & Register",
      changeNumber: "Change Number",
      changeDetails: "Change Details",
      yourDetails: "Your Details",
      enterEmail: "Enter email",
      enterPassword: "Enter password",
      password: "Password",
      loginButton: "Login",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      devOtp: "Development OTP",
      orLoginWith: "Or login with",
      mobileNotRegistered: "Mobile number not registered",
      registerFirst: "Register first",
      mobileAlreadyRegistered: "Mobile number already registered",
      registerSuccess: "Registration successful!",
    },

    // Landing Page
    landing: {
      trusted: "India's Trusted Beauty Parlour",
      bookNow: "Book Now",
      viewServices: "View Services",
      loginBtn: "Login",
      ourServices: "Our Services",
      everyShade: "Every Shade of Your Beauty",
      professionalBeauticians: "Professional Beauticians — Home-like Experience",
      whyChooseUs: "Why Choose Us?",
      easyFastReliable: "Easy, Fast & Reliable",
      onlineBooking: "Online Booking",
      onlineBookingDesc: "Book from anywhere, anytime",
      otpLogin: "OTP Login",
      otpLoginDesc: "No password — just mobile number",
      reviewsRatings: "Reviews & Ratings",
      reviewsRatingsDesc: "Read real customer reviews",
      offersDiscounts: "Offers & Discounts",
      offersDiscountsDesc: "Special discounts on festivals",
      specialOffer: "Special Offer — Just for You!",
      firstBookingDiscount: "20% off on your first booking! Code:",
      rating: "4.8 Rating",
      happyCustomers: "5,000+ Happy Customers",
      bookings: "10,000+ Bookings",
      copyright: "© 2026 Nikharta Roop. All rights reserved.",
    },

    // Service categories (landing page)
    services: {
      hairCutting: "Hair Cutting",
      hairCuttingDesc: "Trendy to Classic — Your Style, Your Choice",
      facial: "Facial",
      facialDesc: "Professional Facial Treatment for Glowing Skin",
      bridalMakeup: "Bridal Makeup",
      bridalMakeupDesc: "Perfect Look for Your Special Day",
      mehendi: "Mehendi",
      mehendiDesc: "Beautiful Designs — For Weddings & Festivals",
      hairCare: "Hair Care",
      faceCare: "Face Care",
      skinCare: "Skin Care",
      bridal: "Bridal",
      nailCare: "Nail Care",
      bodyCare: "Body Care",
      makeup: "Makeup",
    },

    // Dashboard
    dashboard: {
      title: "Dashboard",
      welcome: "Hello",
      whatCanWeDo: "What can we do for you today?",
      viewServices: "View Services",
      myBookings: "My Bookings",
      offers: "Offers",
      profile: "Profile",
      loyaltyPoints: "Loyalty Points",
    },

    // Coming Soon
    comingSoon: {
      title: "Coming Soon",
      subtitle: "We're working on something amazing! This page will be available soon.",
      goBack: "Go to Dashboard",
    },

    // Common
    common: {
      loading: "Loading...",
      error: "Something went wrong",
      success: "Success!",
      cancel: "Cancel",
      confirm: "Confirm",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      noResults: "No results found",
      viewAll: "View All",
      from: "from",
      pleaseEnter: "Please enter",
      somethingWrong: "Something went wrong",
    },

    // Theme
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },

    // Language
    language: {
      english: "English",
      hindi: "हिन्दी",
      switchLang: "Switch Language",
    },
  },

  hi: {
    // App
    appName: "निखरता रूप",
    appNameHi: "निखरता रूप",
    appTagline: "आपकी खूबसूरती हमारी ज़िम्मेदारी",
    appDescription: "भारत का सबसे भरोसेमंद ब्यूटी पार्लर। अभी बुक करें — फेशियल, ब्राइडल मेकअप, हेयर कटिंग और भी बहुत कुछ।",

    // Navigation
    nav: {
      home: "होम",
      services: "सेवाएं",
      bookings: "बुकिंग",
      offers: "ऑफ़र",
      profile: "प्रोफ़ाइल",
      blog: "ब्लॉग",
    },

    // User Menu
    userMenu: {
      profile: "प्रोफ़ाइल",
      myBookings: "मेरी बुकिंग",
      loyaltyPoints: "लॉयल्टी पॉइंट",
      settings: "सेटिंग्स",
      logout: "लॉगआउट",
      user: "उपयोगकर्ता",
    },

    // Auth
    auth: {
      login: "लॉगिन करें",
      register: "रजिस्टर करें",
      loginTitle: "लॉगिन करें",
      loginSubtitle: "अपना अकाउंट एक्सेस करें",
      registerTitle: "अकाउंट बनाएं",
      registerSubtitle: "निखरता रूप से जुड़ें",
      mobileOtp: "मोबाइल OTP",
      email: "ईमेल",
      mobileNumber: "मोबाइल नंबर",
      name: "नाम",
      enterMobile: "10 अंक का मोबाइल नंबर",
      enterName: "अपना नाम डालें",
      enterOtp: "OTP डालें",
      sendOtp: "OTP भेजें",
      verifyOtp: "वेरिफाई करें",
      verifyAndRegister: "वेरिफाई और रजिस्टर करें",
      changeNumber: "नंबर बदलें",
      changeDetails: "विवरण बदलें",
      yourDetails: "आपका विवरण",
      enterEmail: "ईमेल डालें",
      enterPassword: "पासवर्ड डालें",
      password: "पासवर्ड",
      loginButton: "लॉगिन करें",
      noAccount: "अकाउंट नहीं है?",
      hasAccount: "पहले से अकाउंट है?",
      devOtp: "डेवलपमेंट OTP",
      orLoginWith: "या इससे लॉगिन करें",
      mobileNotRegistered: "मोबाइल नंबर रजिस्टर नहीं है",
      registerFirst: "पहले रजिस्टर करें",
      mobileAlreadyRegistered: "मोबाइल नंबर पहले से रजिस्टर है",
      registerSuccess: "रजिस्ट्रेशन सफल!",
    },

    // Landing Page
    landing: {
      trusted: "भारत का भरोसेमंद ब्यूटी पार्लर",
      bookNow: "अभी बुक करें",
      viewServices: "सेवाएं देखें",
      loginBtn: "लॉगिन करें",
      ourServices: "हमारी सेवाएं",
      everyShade: "आपकी खूबसूरती का हर रंग",
      professionalBeauticians: "प्रोफेशनल ब्यूटीशियन — घर जैसा अनुभव",
      whyChooseUs: "क्यों चुनें हमें?",
      easyFastReliable: "आसान, तेज़ और भरोसेमंद",
      onlineBooking: "ऑनलाइन बुकिंग",
      onlineBookingDesc: "कहीं से भी, कभी भी बुक करें",
      otpLogin: "OTP लॉगिन",
      otpLoginDesc: "पासवर्ड नहीं — बस मोबाइल नंबर",
      reviewsRatings: "रिव्यू और रेटिंग",
      reviewsRatingsDesc: "असली कस्टमर रिव्यू पढ़ें",
      offersDiscounts: "ऑफ़र और छूट",
      offersDiscountsDesc: "त्योहारों पर खास डिस्काउंट",
      specialOffer: "खास ऑफ़र — सिर्फ आपके लिए!",
      firstBookingDiscount: "पहली बुकिंग पर 20% छूट! कोड:",
      rating: "4.8 रेटिंग",
      happyCustomers: "5,000+ खुश कस्टमर",
      bookings: "10,000+ बुकिंग",
      copyright: "© 2026 Nikharta Roop. सर्वाधिकार सुरक्षित।",
    },

    // Service categories
    services: {
      hairCutting: "हेयर कटिंग",
      hairCuttingDesc: "ट्रेंडी से लेकर क्लासिक — आपकी पसंद का स्टाइल",
      facial: "फेशियल",
      facialDesc: "ग्लोइंग स्किन के लिए प्रोफेशनल फेशियल ट्रीटमेंट",
      bridalMakeup: "ब्राइडल मेकअप",
      bridalMakeupDesc: "आपके खास दिन के लिए परफेक्ट लुक",
      mehendi: "मेहंदी",
      mehendiDesc: "सुंदर डिज़ाइन — शादी और त्योहार के लिए",
      hairCare: "हेयर केयर",
      faceCare: "फेस केयर",
      skinCare: "स्किन केयर",
      bridal: "ब्राइडल",
      nailCare: "नेल केयर",
      bodyCare: "बॉडी केयर",
      makeup: "मेकअप",
    },

    // Dashboard
    dashboard: {
      title: "डैशबोर्ड",
      welcome: "नमस्ते",
      whatCanWeDo: "आज आपके लिए क्या कर सकते हैं?",
      viewServices: "सेवाएं देखें",
      myBookings: "मेरी बुकिंग",
      offers: "ऑफ़र",
      profile: "प्रोफ़ाइल",
      loyaltyPoints: "लॉयल्टी पॉइंट",
    },

    // Coming Soon
    comingSoon: {
      title: "जल्द आ रहा है",
      subtitle: "हम कुछ शानदार पर काम कर रहे हैं! यह पेज जल्द ही उपलब्ध होगा।",
      goBack: "डैशबोर्ड पर जाएं",
    },

    // Common
    common: {
      loading: "लोड हो रहा है...",
      error: "कुछ गलत हो गया",
      success: "सफल!",
      cancel: "रद्द करें",
      confirm: "पुष्टि करें",
      save: "सहेजें",
      delete: "हटाएं",
      edit: "संपादित करें",
      search: "खोजें",
      noResults: "कोई परिणाम नहीं मिला",
      viewAll: "सभी देखें",
      from: "से",
      pleaseEnter: "कृपया डालें",
      somethingWrong: "कुछ गलत हो गया",
    },

    // Theme
    theme: {
      light: "लाइट",
      dark: "डार्क",
      system: "सिस्टम",
    },

    // Language
    language: {
      english: "English",
      hindi: "हिन्दी",
      switchLang: "भाषा बदलें",
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
export type NestedTranslationKey = string;
