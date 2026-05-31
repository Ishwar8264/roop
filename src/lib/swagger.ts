/**
 * Nikharta Roop (निखरता रूप) — OpenAPI 3.0.3 Specification
 * Purpose: Complete API documentation for all endpoints
 * Responsibility: Define all routes, schemas, request/response models
 * Important Notes:
 *   - Served at GET /api/api-spec as JSON
 *   - Rendered at /api-docs via Swagger UI
 *   - Hindi-first descriptions for Indian developer audience
 *   - Add new endpoints here as APIs are built
 */

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "निखरता रूप — Nikharta Roop API",
    description:
      "भारत का भरोसेमंद ब्यूटी पार्लर बुकिंग प्लेटफ़ॉर्म।\n\n" +
      "## Authentication (3 Methods)\n" +
      "1. **Mobile OTP** — मोबाइल नंबर पर OTP भेजकर login\n" +
      "2. **Email + Password** — email और password से register/login\n" +
      "3. **Google OAuth** — Google account से one-click login\n\n" +
      "सभी protected endpoints को `Authorization: Bearer <access_token>` header चाहिए।\n\n" +
      "## Rate Limits\n" +
      "- OTP send: 1/min, 5/hour per mobile\n" +
      "- OTP verify: 3 attempts per OTP\n" +
      "- Token refresh: 10/min per user",
    version: "1.2.0",
    contact: {
      name: "Nikharta Roop Support",
      email: "support@nikhartaroop.com",
    },
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Development Server",
    },
  ],
  tags: [
    {
      name: "Auth — Mobile OTP",
      description: "प्रमाणीकरण — मोबाइल OTP से Login",
    },
    {
      name: "Auth — Email",
      description: "प्रमाणीकरण — Email + Password से Register/Login",
    },
    {
      name: "Auth — Google",
      description: "प्रमाणीकरण — Google OAuth से Login",
    },
    {
      name: "Auth — Session",
      description: "Token Management — Refresh, Profile, Logout",
    },
    {
      name: "Packages — पैकेज",
      description:
        "सेवा पैकेज — कई सेवाओं को बंडल में छूट पर ऑफर करें।\n\n" +
        "ब्राइडल पैकेज, फेस्टिवल डील, वीकली स्पेशल आदि बनाएं और प्रबंधित करें।\n" +
        "सभी मौद्रिक मान Decimal स्ट्रिंग में (例: \"1500.00\")।",
    },
    {
      name: "Consultations — परामर्श",
      description:
        "प्री-बुकिंग परामर्श — सेवा से पहले मुफ्त consultation।\n\n" +
        "ग्राहक शाखा और तारीख चुनकर consultation request कर सकते हैं।\n" +
        "Staff/Admin consultation complete कर सकते हैं और notes जोड़ सकते हैं।\n" +
        "User या Admin किसी भी consultation को cancel कर सकते हैं।",
    },
    {
      name: "Notifications — सूचनाएं",
      description:
        "सूचना प्रबंधन — बुकिंग, भुगतान, ऑफर आदि की सूचनाएं।\n\n" +
        "ग्राहक अपनी सूचनाएं देख सकते हैं, पढ़ी हुई मार्क कर सकते हैं।\n" +
        "Admin नई सूचनाएं भेज सकता है (WhatsApp, SMS, Email, Push)।\n" +
        "PENDING = अनपढ़, SENT = पढ़ी हुई, FAILED = भेजने में त्रुटि।",
    },
  ],
  paths: {
    // ========== MOBILE OTP ==========
    "/api/auth/send-otp": {
      post: {
        tags: ["Auth — Mobile OTP"],
        summary: "OTP भेजें",
        description:
          "दिए गए मोबाइल नंबर पर 6-digit OTP भेजता है।\n\n" +
          "- Rate limit: 1 OTP/min, 5/hour\n" +
          "- OTP 5 minutes में expire होता है\n" +
          "- अगर user exist नहीं करता, verify-otp पर auto-register होगा",
        operationId: "sendOtp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendOtpRequest" },
              example: { mobile: "9876543210" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP सफलतापूर्वक भेजा गया",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SendOtpResponse" },
              },
            },
          },
          "400": {
            description: "Invalid mobile number",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "429": {
            description: "Rate limit exceeded",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth — Mobile OTP"],
        summary: "OTP Verify करें",
        description:
          "OTP verify करके access token और refresh token देता है।\n\n" +
          "- Max 3 verify attempts per OTP\n" +
          "- Access token: 15 min, Refresh token: 7 days\n" +
          "- नए user को USER role assign होती है (auto-register)",
        operationId: "verifyOtp",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpRequest" },
              example: { mobile: "9876543210", otp: "123456" },
            },
          },
        },
        responses: {
          "200": {
            description: "OTP verified — tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": {
            description: "Invalid or expired OTP",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    // ========== EMAIL AUTH ==========
    "/api/auth/register-email": {
      post: {
        tags: ["Auth — Email"],
        summary: "Email से Register करें",
        description:
          "Email + Password से नया account बनाएं।\n\n" +
          "- Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit\n" +
          "- Mobile number optional hai (बाद में add कर सकते हैं)\n" +
          "- Email verification pending रहेगा (future feature)",
        operationId: "registerEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterEmailRequest" },
              example: {
                name: "राहुल शर्मा",
                email: "rahul@example.com",
                password: "Rahul@123",
                mobile: "9876543210",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Registration successful — tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "409": {
            description: "Email or mobile already registered",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/auth/login-email": {
      post: {
        tags: ["Auth — Email"],
        summary: "Email से Login करें",
        description:
          "Email + Password से login करें।\n\n" +
          "- Registered email और सही password चाहिए\n" +
          "- Account suspended हो तो login नहीं होगा",
        operationId: "loginEmail",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginEmailRequest" },
              example: { email: "rahul@example.com", password: "Rahul@123" },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful — tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          "401": {
            description: "Invalid credentials or account suspended",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    // ========== GOOGLE AUTH ==========
    "/api/auth/google": {
      post: {
        tags: ["Auth — Google"],
        summary: "Google से Login/Register करें",
        description:
          "Google ID token से one-click login या auto-register।\n\n" +
          "- Frontend Google Sign-In SDK से idToken लेकर भेजें\n" +
          "- अगर user नया है, तो auto-register होगा\n" +
          "- अगर same email से पहले account है, तो Google link होगा\n" +
          "- GOOGLE_CLIENT_ID env variable ज़रूरी है",
        operationId: "googleAuth",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GoogleAuthRequest" },
              example: { idToken: "eyJhbGciOiJSUzI1NiIs..." },
            },
          },
        },
        responses: {
          "200": {
            description: "Google login successful — tokens issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoogleAuthResponse" },
              },
            },
          },
          "401": {
            description: "Invalid Google token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    // ========== SESSION MANAGEMENT ==========
    "/api/auth/refresh": {
      post: {
        tags: ["Auth — Session"],
        summary: "Token Refresh करें",
        description: "Refresh token से नया access token लें।",
        operationId: "refreshToken",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" },
              example: { refreshToken: "eyJhbGciOiJIUzI1NiJ9..." },
            },
          },
        },
        responses: {
          "200": {
            description: "New access token issued",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshTokenResponse" },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth — Session"],
        summary: "अपनी Profile देखें",
        description: "Current logged-in user की profile information।",
        operationId: "getMe",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth — Session"],
        summary: "Logout करें",
        description: "Current session को invalidate करता है। Idempotent — invalid token पर भी success।",
        operationId: "logout",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogoutResponse" },
              },
            },
          },
        },
      },
    },

    // ========== PACKAGES ==========
    "/api/packages": {
      get: {
        tags: ["Packages — पैकेज"],
        summary: "पैकेजों की सूची देखें",
        description:
          "सभी active पैकेज देखें। Pagination और branch फ़िल्टर सपोर्ट।\n\n" +
          "- Public endpoint — कोई auth नहीं चाहिए\n" +
          "- सिर्फ isActive=true पैकेज दिखते हैं\n" +
          "- हर पैकेज में linked services count आता है",
        operationId: "listPackages",
        parameters: [
          {
            name: "branchId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Branch ID से फ़िल्टर करें",
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "पेज नंबर",
          },
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
            description: "प्रति पेज आइटम",
          },
        ],
        responses: {
          "200": {
            description: "पैकेज सूची सफलतापूर्वक मिली",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PackageListResponse" },
              },
            },
          },
          "400": {
            description: "Invalid query parameters",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      post: {
        tags: ["Packages — पैकेज"],
        summary: "नया पैकेज बनाएं",
        description:
          "नया सेवा पैकेज बनाएं (Admin only)।\n\n" +
          "- slug unique होना चाहिए\n" +
          "- branchId valid होनी चाहिए\n" +
          "- price और originalPrice Decimal strings हैं (例: \"1500.00\")\n" +
          "- validFrom/validUntil optional ISO datetime हैं",
        operationId: "createPackage",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreatePackageRequest" },
              example: {
                nameHi: "ब्राइडल पैकेज",
                nameEn: "Bridal Package",
                slug: "bridal-package",
                descriptionHi: "शादी के लिए पूरा ब्यूटी पैकेज — मेकअप, हेयर, मेहंदी, फेशियल",
                descriptionEn: "Complete bridal beauty package — Makeup, Hair, Mehendi, Facial",
                price: "15000.00",
                originalPrice: "18000.00",
                durationMinutes: 360,
                branchId: "cm3xyz123",
                validFrom: "2025-01-01T00:00:00Z",
                validUntil: "2025-12-31T23:59:59Z",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "पैकेज सफलतापूर्वक बनाया गया",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PackageDetailResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "403": {
            description: "Admin access required",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "409": {
            description: "Slug already exists",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/packages/{id}": {
      get: {
        tags: ["Packages — पैकेज"],
        summary: "पैकेज का विवरण देखें",
        description:
          "पैकेज की पूरी जानकारी — linked services सहित।\n\n" +
          "- Public endpoint — कोई auth नहीं चाहिए\n" +
          "- हर linked service का nameHi, nameEn, price, durationMinutes आता है",
        operationId: "getPackage",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Package ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "पैकेज विवरण",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PackageDetailResponse" },
              },
            },
          },
          "404": {
            description: "Package not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      patch: {
        tags: ["Packages — पैकेज"],
        summary: "पैकेज अपडेट करें",
        description:
          "पैकेज की जानकारी अपडेट करें (Admin only)।\n\n" +
          "- सभी fields optional हैं (partial update)\n" +
          "- slug बदलने पर uniqueness check होता है",
        operationId: "updatePackage",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Package ID (CUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePackageRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "पैकेज अपडेट हो गया",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PackageDetailResponse" },
              },
            },
          },
          "403": {
            description: "Admin access required",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Package not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "409": {
            description: "Slug conflict",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      delete: {
        tags: ["Packages — पैकेज"],
        summary: "पैकेज हटाएं (Soft Delete)",
        description:
          "पैकेज को soft delete करें — isActive=false सेट होता है (Admin only)।\n\n" +
          "- डेटा DB में रहता है, सिर्फ hidden हो जाता है\n" +
          "- Public listing में नहीं दिखेगा\n" +
          "- Admin फिर से activate कर सकता है",
        operationId: "deletePackage",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Package ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "पैकेज सफलतापूर्वक हटाया गया",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PackageDeleteResponse" },
              },
            },
          },
          "403": {
            description: "Admin access required",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Package not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    // ========== CONSULTATIONS ==========
    "/api/consultations": {
      get: {
        tags: ["Consultations — परामर्श"],
        summary: "परामर्शों की सूची देखें",
        description:
          "परामर्शों की सूची देखें। Pagination और फ़िल्टर सपोर्ट।\n\n" +
          "- Auth required — सभी authenticated users\n" +
          "- USER: सिर्फ अपने consultations दिखते हैं\n" +
          "- ADMIN/STAFF: सभी consultations दिखते हैं (filters सपोर्ट)",
        operationId: "listConsultations",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "branchId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "शाखा ID से फ़िल्टर करें",
          },
          {
            name: "staffId",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Staff ID से फ़िल्टर करें",
          },
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["PENDING", "COMPLETED", "CANCELLED"] },
            description: "स्थिति से फ़िल्टर करें",
          },
          {
            name: "date",
            in: "query",
            required: false,
            schema: { type: "string", format: "date" },
            description: "तारीख से फ़िल्टर करें (YYYY-MM-DD)",
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "पेज नंबर",
          },
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
            description: "प्रति पेज आइटम",
          },
        ],
        responses: {
          "200": {
            description: "परामर्श सूची सफलतापूर्वक मिली",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConsultationListResponse" },
              },
            },
          },
          "400": {
            description: "Invalid query parameters",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      post: {
        tags: ["Consultations — परामर्श"],
        summary: "नया परामर्श अनुरोध करें",
        description:
          "प्री-बुकिंग परामर्श का अनुरोध करें (कोई भी authenticated user)।\n\n" +
          "- branchId valid होनी चाहिए\n" +
          "- staffId optional है (अगर दिया, valid होना चाहिए)\n" +
          "- Consultation PENDING status में बनता है",
        operationId: "createConsultation",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateConsultationRequest" },
              example: {
                branchId: "cm3xyz123",
                date: "2025-03-15",
                time: "11:00",
                staffId: "cm3staff456",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "परामर्श सफलतापूर्वक अनुरोध किया गया",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConsultationDetailResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Branch or staff not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/consultations/{id}": {
      get: {
        tags: ["Consultations — परामर्श"],
        summary: "परामर्श का विवरण देखें",
        description:
          "परामर्श की पूरी जानकारी — user, staff, booking info सहित।\n\n" +
          "- USER: सिर्फ अपना consultation देख सकते हैं\n" +
          "- ADMIN/STAFF: कोई भी consultation देख सकते हैं",
        operationId: "getConsultation",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Consultation ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "परामर्श विवरण",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConsultationDetailResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "403": {
            description: "Cannot view other user's consultation",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Consultation not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/consultations/{id}/complete": {
      patch: {
        tags: ["Consultations — परामर्श"],
        summary: "परामर्श पूर्ण करें",
        description:
          "परामर्श को COMPLETED मार्क करें (Admin/Staff only)।\n\n" +
          "- Staff consultation notes जोड़ सकते हैं\n" +
          "- सिर्फ PENDING consultations complete हो सकते हैं",
        operationId: "completeConsultation",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Consultation ID (CUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CompleteConsultationRequest" },
              example: {
                notes: "Customer wants bridal makeup consultation — recommended gold facial package",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "परामर्श सफलतापूर्वक पूर्ण हुआ",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConsultationDetailResponse" },
              },
            },
          },
          "403": {
            description: "Staff or Admin access required",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Consultation not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "409": {
            description: "Consultation already completed or cancelled",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/consultations/{id}/cancel": {
      patch: {
        tags: ["Consultations — परामर्श"],
        summary: "परामर्श रद्द करें",
        description:
          "परामर्श को CANCELLED मार्क करें।\n\n" +
          "- User अपना consultation cancel कर सकता है\n" +
          "- Admin कोई भी consultation cancel कर सकता है\n" +
          "- सिर्फ PENDING consultations cancel हो सकते हैं",
        operationId: "cancelConsultation",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Consultation ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "परामर्श सफलतापूर्वक रद्द हुआ",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConsultationDetailResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "403": {
            description: "Cannot cancel other user's consultation",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Consultation not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "409": {
            description: "Consultation already completed or cancelled",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    // ========== NOTIFICATIONS ==========
    "/api/notifications": {
      get: {
        tags: ["Notifications — सूचनाएं"],
        summary: "सूचनाओं की सूची देखें",
        description:
          "अपनी सूचनाएं देखें। Pagination और फ़िल्टर सपोर्ट।\n\n" +
          "- Auth required — अपनी सूचनाएं ही दिखती हैं\n" +
          "- Unread count भी response में आता है\n" +
          "- PENDING = अनपढ़, SENT = पढ़ी हुई",
        operationId: "listNotifications",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["PENDING", "SENT", "FAILED"] },
            description: "स्थिति से फ़िल्टर करें",
          },
          {
            name: "channel",
            in: "query",
            required: false,
            schema: { type: "string", enum: ["WHATSAPP", "SMS", "EMAIL", "PUSH"] },
            description: "चैनल से फ़िल्टर करें",
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", default: 1, minimum: 1 },
            description: "पेज नंबर",
          },
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", default: 20, minimum: 1, maximum: 100 },
            description: "प्रति पेज आइटम",
          },
        ],
        responses: {
          "200": {
            description: "सूचना सूची सफलतापूर्वक मिली",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotificationListResponse" },
              },
            },
          },
          "400": {
            description: "Invalid query parameters",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      post: {
        tags: ["Notifications — सूचनाएं"],
        summary: "सूचना भेजें",
        description:
          "नई सूचना बनाएं/भेजें (Admin only)।\n\n" +
          "- userId valid होना चाहिए\n" +
          "- channel: WHATSAPP | SMS | EMAIL | PUSH\n" +
          "- सूचना PENDING status में बनती है",
        operationId: "sendNotification",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SendNotificationRequest" },
              example: {
                userId: "cm3user123",
                channel: "WHATSAPP",
                title: "बुकिंग कन्फर्म",
                message: "आपकी ब्राइडल पैकेज बुकिंग कन्फर्म हो गई है!",
                trigger: "BOOKING_CONFIRMED",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "सूचना सफलतापूर्वक बनाई गई",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotificationDetailResponse" },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "403": {
            description: "Admin access required",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Target user not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/notifications/{id}/read": {
      patch: {
        tags: ["Notifications — सूचनाएं"],
        summary: "सूचना पढ़ी हुई मार्क करें",
        description:
          "एक सूचना को पढ़ी हुई मार्क करें।\n\n" +
          "- सिर्फ अपनी सूचनाएं पढ़ी हुई मार्क कर सकते हैं\n" +
          "- PENDING → SENT में बदलता है, sentAt सेट होता है\n" +
          "- Idempotent — पहले से SENT पर कोई change नहीं",
        operationId: "markNotificationRead",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Notification ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "सूचना पढ़ी हुई मार्क हुई",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NotificationDetailResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "403": {
            description: "Cannot mark other user's notification",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Notification not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/notifications/mark-all-read": {
      post: {
        tags: ["Notifications — सूचनाएं"],
        summary: "सभी सूचनाएं पढ़ी हुई मार्क करें",
        description:
          "अपनी सभी अनपढ़ (PENDING) सूचनाएं पढ़ी हुई मार्क करें।\n\n" +
          "- सभी PENDING सूचनाएं SENT में बदल जाएंगी",
        operationId: "markAllNotificationsRead",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "सभी सूचनाएं पढ़ी हुई मार्क हुईं",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MarkAllReadResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
    "/api/notifications/unread-count": {
      get: {
        tags: ["Notifications — सूचनाएं"],
        summary: "अनपढ़ सूचनाओं की संख्या",
        description:
          "अपनी अनपढ़ (PENDING) सूचनाओं की संख्या प्राप्त करें।\n\n" +
          "- बैज दिखाने के लिए उपयोगी",
        operationId: "getUnreadNotificationCount",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "अनपढ़ संख्या",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UnreadCountResponse" },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },

    "/api/packages/{id}/services": {
      get: {
        tags: ["Packages — पैकेज"],
        summary: "पैकेज की सेवाएं देखें",
        description:
          "पैकेज में शामिल सभी सेवाएं देखें।\n\n" +
          "- Public endpoint — कोई auth नहीं चाहिए\n" +
          "- Services sortOrder के अनुसार आती हैं",
        operationId: "listPackageServices",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Package ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "पैकेज सेवाओं की सूची",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PackageServicesListResponse" },
              },
            },
          },
          "404": {
            description: "Package not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      post: {
        tags: ["Packages — पैकेज"],
        summary: "सेवाएं पैकेज में जोड़ें",
        description:
          "एक साथ कई सेवाएं पैकेज से लिंक करें (Admin only)।\n\n" +
          "- Duplicate service IDs skip हो जाते हैं (error नहीं)\n" +
          "- sortOrder auto-increment होता है\n" +
          "- सभी serviceIds valid होने चाहिए",
        operationId: "linkPackageServices",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Package ID (CUID)",
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LinkServicesRequest" },
              example: {
                serviceIds: ["cm3svc001", "cm3svc002", "cm3svc003"],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "सेवाएं सफलतापूर्वक लिंक हुईं",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LinkServicesResponse" },
              },
            },
          },
          "403": {
            description: "Admin access required",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Package or service not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
      delete: {
        tags: ["Packages — पैकेज"],
        summary: "सेवा पैकेज से हटाएं",
        description:
          "पैकेज से एक सेवा अनलिंक करें (Admin only)।\n\n" +
          "- serviceId query parameter में दें\n" +
          "- Junction record delete होता है (सेवा itself नहीं)",
        operationId: "unlinkPackageService",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            description: "Package ID (CUID)",
          },
          {
            name: "serviceId",
            in: "query",
            required: true,
            schema: { type: "string" },
            description: " unlink करने के लिए Service ID (CUID)",
          },
        ],
        responses: {
          "200": {
            description: "सेवा सफलतापूर्वक अनलिंक हुई",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PackageDeleteResponse" },
              },
            },
          },
          "400": {
            description: "Missing serviceId",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "403": {
            description: "Admin access required",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
          "404": {
            description: "Package or link not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Authorization: Bearer <access_token>",
      },
    },
    schemas: {
      // ===== Request Schemas =====
      SendOtpRequest: {
        type: "object",
        required: ["mobile"],
        properties: {
          mobile: {
            type: "string",
            pattern: "^[6-9]\\d{9}$",
            description: "Indian 10-digit mobile number",
            example: "9876543210",
          },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["mobile", "otp"],
        properties: {
          mobile: { type: "string", pattern: "^[6-9]\\d{9}$", example: "9876543210" },
          otp: { type: "string", pattern: "^\\d{6}$", example: "123456" },
        },
      },
      RegisterEmailRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", description: "Full name", example: "राहुल शर्मा" },
          email: { type: "string", format: "email", description: "Valid email address", example: "rahul@example.com" },
          password: {
            type: "string",
            description: "Min 8 chars, 1 uppercase, 1 lowercase, 1 digit",
            example: "Rahul@123",
          },
          mobile: { type: "string", pattern: "^[6-9]\\d{9}$", description: "Optional Indian mobile", example: "9876543210" },
        },
      },
      LoginEmailRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "rahul@example.com" },
          password: { type: "string", example: "Rahul@123" },
        },
      },
      GoogleAuthRequest: {
        type: "object",
        required: ["idToken"],
        properties: {
          idToken: {
            type: "string",
            description: "Google ID token from frontend Google Sign-In SDK",
            example: "eyJhbGciOiJSUzI1NiIs...",
          },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiJ9..." },
        },
      },

      // ===== Response Schemas =====
      SendOtpResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              mobile: { type: "string", example: "9876543210" },
              expiresIn: { type: "integer", example: 300 },
              messageId: { type: "string", example: "stub_123_9876543210" },
            },
          },
          message: { type: "string", example: "OTP sent successfully." },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/UserBasic" },
              tokens: {
                type: "object",
                properties: {
                  accessToken: { type: "string", description: "JWT access token (15 min)" },
                  refreshToken: { type: "string", description: "JWT refresh token (7 days)" },
                },
              },
              isNewUser: { type: "boolean", description: "Whether a new account was created" },
            },
          },
          message: { type: "string" },
        },
      },
      GoogleAuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/UserBasic" },
              tokens: {
                type: "object",
                properties: {
                  accessToken: { type: "string" },
                  refreshToken: { type: "string" },
                },
              },
              isNewUser: { type: "boolean" },
            },
          },
          message: { type: "string" },
        },
      },
      RefreshTokenResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string" },
              expiresIn: { type: "integer", example: 900 },
            },
          },
          message: { type: "string" },
        },
      },
      MeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/UserProfile" },
          message: { type: "string" },
        },
      },
      LogoutResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", nullable: true },
          message: { type: "string" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", description: "Error code", example: "AUTH_INVALID_CREDENTIALS" },
          message: { type: "string", description: "Human-readable error" },
          statusCode: { type: "integer", example: 401 },
        },
      },

      // ===== Shared Schemas =====
      UserBasic: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3xyz123" },
          mobile: { type: "string", nullable: true, example: "9876543210" },
          name: { type: "string", nullable: true, example: "राहुल शर्मा" },
          email: { type: "string", nullable: true, example: "rahul@example.com" },
          role: { type: "string", enum: ["GUEST", "USER", "STAFF", "ADMIN"], example: "USER" },
          authProvider: { type: "string", enum: ["MOBILE", "EMAIL", "GOOGLE"], example: "EMAIL" },
          avatarUrl: { type: "string", nullable: true },
          loyaltyPoints: { type: "integer", example: 0 },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3xyz123" },
          mobile: { type: "string", nullable: true, example: "9876543210" },
          name: { type: "string", nullable: true, example: "राहुल शर्मा" },
          email: { type: "string", nullable: true, example: "rahul@example.com" },
          role: { type: "string", enum: ["GUEST", "USER", "STAFF", "ADMIN"], example: "USER" },
          authProvider: { type: "string", enum: ["MOBILE", "EMAIL", "GOOGLE"], example: "EMAIL" },
          avatarUrl: { type: "string", nullable: true },
          loyaltyPoints: { type: "integer", example: 0 },
          isActive: { type: "boolean", example: true },
        },
      },

      // ===== Package Request Schemas =====
      CreatePackageRequest: {
        type: "object",
        required: ["nameHi", "nameEn", "slug", "descriptionHi", "price", "originalPrice", "durationMinutes", "branchId"],
        properties: {
          nameHi: { type: "string", description: "पैकेज का नाम (हिंदी)", example: "ब्राइडल पैकेज" },
          nameEn: { type: "string", description: "Package name (English)", example: "Bridal Package" },
          slug: { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$", description: "URL-safe unique slug", example: "bridal-package" },
          descriptionHi: { type: "string", description: "पैकेज विवरण (हिंदी)", example: "शादी के लिए पूरा ब्यूटी पैकेज" },
          descriptionEn: { type: "string", description: "Package description (English, optional)", example: "Complete bridal beauty package" },
          price: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$", description: "पैकेज मूल्य (Decimal string)", example: "15000.00" },
          originalPrice: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$", description: "व्यक्तिगत सेवाओं का कुल मूल्य (बचत दिखाने के लिए)", example: "18000.00" },
          durationMinutes: { type: "integer", minimum: 1, description: "कुल समय (मिनट में)", example: 360 },
          imageUrl: { type: "string", format: "uri", description: "पैकेज फोटो URL (optional)", example: "https://cdn.example.com/bridal.jpg" },
          branchId: { type: "string", description: "शाखा ID (CUID)", example: "cm3xyz123" },
          validFrom: { type: "string", format: "date-time", description: "उपलब्धता शुरू (optional, ISO datetime)", example: "2025-01-01T00:00:00Z" },
          validUntil: { type: "string", format: "date-time", description: "उपलब्धता अंत (optional, ISO datetime)", example: "2025-12-31T23:59:59Z" },
        },
      },
      UpdatePackageRequest: {
        type: "object",
        description: "सभी fields optional हैं — केवल दिए गए fields अपडेट होंगे",
        properties: {
          nameHi: { type: "string", description: "पैकेज का नाम (हिंदी)" },
          nameEn: { type: "string", description: "Package name (English)" },
          slug: { type: "string", description: "URL-safe unique slug (बदलने पर uniqueness check)" },
          descriptionHi: { type: "string", description: "पैकेज विवरण (हिंदी)" },
          descriptionEn: { type: "string", description: "Package description (English)" },
          price: { type: "string", description: "पैकेज मूल्य (Decimal string)" },
          originalPrice: { type: "string", description: "व्यक्तिगत सेवाओं का कुल मूल्य" },
          durationMinutes: { type: "integer", minimum: 1, description: "कुल समय (मिनट)" },
          imageUrl: { type: "string", format: "uri", description: "पैकेज फोटो URL" },
          branchId: { type: "string", description: "शाखा ID" },
          validFrom: { type: "string", format: "date-time", description: "उपलब्धता शुरू" },
          validUntil: { type: "string", format: "date-time", description: "उपलब्धता अंत" },
        },
      },
      LinkServicesRequest: {
        type: "object",
        required: ["serviceIds"],
        properties: {
          serviceIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            description: "लिंक करने के लिए Service IDs (kam se kam 1)",
            example: ["cm3svc001", "cm3svc002", "cm3svc003"],
          },
        },
      },

      // ===== Package Response Schemas =====
      PackageBasic: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3pkg123" },
          nameHi: { type: "string", example: "ब्राइडल पैकेज" },
          nameEn: { type: "string", example: "Bridal Package" },
          slug: { type: "string", example: "bridal-package" },
          descriptionHi: { type: "string", example: "शादी के लिए पूरा ब्यूटी पैकेज" },
          descriptionEn: { type: "string", nullable: true, example: "Complete bridal beauty package" },
          price: { type: "string", description: "Decimal string", example: "15000.00" },
          originalPrice: { type: "string", description: "Decimal string", example: "18000.00" },
          durationMinutes: { type: "integer", example: 360 },
          imageUrl: { type: "string", nullable: true },
          isActive: { type: "boolean", example: true },
          branchId: { type: "string", example: "cm3xyz123" },
          validFrom: { type: "string", format: "date-time", nullable: true },
          validUntil: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          servicesCount: { type: "integer", description: "लिंक की गई सेवाओं की संख्या", example: 4 },
        },
      },
      PackageServiceItem: {
        type: "object",
        properties: {
          id: { type: "string", description: "PackageService junction ID" },
          packageId: { type: "string" },
          serviceId: { type: "string" },
          sortOrder: { type: "integer", example: 0 },
          service: {
            type: "object",
            properties: {
              id: { type: "string" },
              nameHi: { type: "string", example: "फेशियल" },
              nameEn: { type: "string", example: "Facial" },
              price: { type: "string", description: "Decimal string", example: "500.00" },
              durationMinutes: { type: "integer", example: 45 },
            },
          },
        },
      },
      PackageDetail: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3pkg123" },
          nameHi: { type: "string", example: "ब्राइडल पैकेज" },
          nameEn: { type: "string", example: "Bridal Package" },
          slug: { type: "string", example: "bridal-package" },
          descriptionHi: { type: "string", example: "शादी के लिए पूरा ब्यूटी पैकेज" },
          descriptionEn: { type: "string", nullable: true },
          price: { type: "string", description: "Decimal string", example: "15000.00" },
          originalPrice: { type: "string", description: "Decimal string", example: "18000.00" },
          durationMinutes: { type: "integer", example: 360 },
          imageUrl: { type: "string", nullable: true },
          isActive: { type: "boolean", example: true },
          branchId: { type: "string", example: "cm3xyz123" },
          validFrom: { type: "string", format: "date-time", nullable: true },
          validUntil: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          packageServices: {
            type: "array",
            items: { $ref: "#/components/schemas/PackageServiceItem" },
          },
        },
      },
      PackageListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              packages: {
                type: "array",
                items: { $ref: "#/components/schemas/PackageBasic" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  pageSize: { type: "integer", example: 20 },
                  total: { type: "integer", example: 15 },
                  totalPages: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
      },
      PackageDetailResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/PackageDetail" },
          message: { type: "string" },
        },
      },
      PackageDeleteResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", nullable: true },
          message: { type: "string", example: "Package deleted successfully" },
        },
      },
      PackageServicesListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              services: {
                type: "array",
                items: { $ref: "#/components/schemas/PackageServiceItem" },
              },
            },
          },
        },
      },
      LinkServicesResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              linkedCount: { type: "integer", description: "नई लिंक की गई सेवाओं की संख्या", example: 3 },
              skippedCount: { type: "integer", description: "पहले से लिंक की गई सेवाएं (skip की गईं)", example: 1 },
            },
          },
          message: { type: "string" },
        },
      },

      // ===== Consultation Request Schemas =====
      CreateConsultationRequest: {
        type: "object",
        required: ["branchId", "date", "time"],
        properties: {
          branchId: { type: "string", description: "शाखा ID (CUID)", example: "cm3xyz123" },
          date: { type: "string", format: "date", description: "परामर्श तारीख (YYYY-MM-DD)", example: "2025-03-15" },
          time: { type: "string", pattern: "^\\d{2}:\\d{2}$", description: "परामर्श समय (HH:MM)", example: "11:00" },
          staffId: { type: "string", description: "Staff ID (CUID, optional) — preferred beautician", example: "cm3staff456" },
        },
      },
      CompleteConsultationRequest: {
        type: "object",
        properties: {
          notes: { type: "string", maxLength: 5000, description: "Staff के consultation notes (optional)", example: "Customer wants bridal makeup — recommended gold facial package" },
        },
      },

      // ===== Consultation Response Schemas =====
      ConsultationBasic: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3con123" },
          userId: { type: "string", example: "cm3xyz123" },
          bookingId: { type: "string", nullable: true, example: "cm3bk456" },
          staffId: { type: "string", nullable: true, example: "cm3staff789" },
          branchId: { type: "string", example: "cm3br001" },
          date: { type: "string", format: "date", example: "2025-03-15" },
          time: { type: "string", example: "11:00:00" },
          status: { type: "string", enum: ["PENDING", "COMPLETED", "CANCELLED"], example: "PENDING" },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string", nullable: true, example: "राहुल शर्मा" },
              mobile: { type: "string", nullable: true, example: "9876543210" },
              email: { type: "string", nullable: true, example: "rahul@example.com" },
              avatarUrl: { type: "string", nullable: true },
            },
          },
          staff: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              specialization: { type: "array", items: { type: "string" }, example: ["facial", "bridal_makeup"] },
              bioHi: { type: "string", nullable: true },
              bioEn: { type: "string", nullable: true },
              photoUrl: { type: "string", nullable: true },
              rating: { type: "number", example: 4.5 },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string", nullable: true },
                  avatarUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
      },
      ConsultationDetail: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3con123" },
          userId: { type: "string", example: "cm3xyz123" },
          bookingId: { type: "string", nullable: true, example: "cm3bk456" },
          staffId: { type: "string", nullable: true, example: "cm3staff789" },
          branchId: { type: "string", example: "cm3br001" },
          date: { type: "string", format: "date", example: "2025-03-15" },
          time: { type: "string", example: "11:00:00" },
          status: { type: "string", enum: ["PENDING", "COMPLETED", "CANCELLED"], example: "PENDING" },
          notes: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string", nullable: true, example: "राहुल शर्मा" },
              mobile: { type: "string", nullable: true, example: "9876543210" },
              email: { type: "string", nullable: true, example: "rahul@example.com" },
              avatarUrl: { type: "string", nullable: true },
            },
          },
          booking: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              bookingDisplayId: { type: "string", example: "BK-2025-00042" },
              status: { type: "string", enum: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"] },
              bookingDate: { type: "string", format: "date" },
              slotStart: { type: "string" },
              slotEnd: { type: "string" },
              totalAmount: { type: "string", description: "Decimal string", example: "1500.00" },
              service: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  nameHi: { type: "string" },
                  nameEn: { type: "string" },
                },
              },
            },
          },
          staff: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              specialization: { type: "array", items: { type: "string" }, example: ["facial", "bridal_makeup"] },
              bioHi: { type: "string", nullable: true },
              bioEn: { type: "string", nullable: true },
              photoUrl: { type: "string", nullable: true },
              rating: { type: "number", example: 4.5 },
              isAvailable: { type: "boolean", example: true },
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string", nullable: true },
                  avatarUrl: { type: "string", nullable: true },
                },
              },
            },
          },
        },
      },
      ConsultationListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              consultations: {
                type: "array",
                items: { $ref: "#/components/schemas/ConsultationBasic" },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  pageSize: { type: "integer", example: 20 },
                  total: { type: "integer", example: 15 },
                  totalPages: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
      },
      ConsultationDetailResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/ConsultationDetail" },
          message: { type: "string" },
        },
      },
      // ========== NOTIFICATION SCHEMAS ==========
      Notification: {
        type: "object",
        description: "सूचना — बुकिंग, भुगतान, ऑफर आदि की सूचना",
        properties: {
          id: { type: "string", description: "Notification ID (CUID)" },
          userId: { type: "string", description: "प्राप्तकर्ता user ID" },
          trigger: { type: "string", nullable: true, enum: ["BOOKING_CONFIRMED", "BOOKING_REMINDER", "BOOKING_CANCELLED", "PAYMENT_RECEIVED", "OFFER_APPLIED", "LOYALTY_EARNED", "LOYALTY_REDEEMED"], description: "क्या ट्रिगर कर रहा है" },
          channel: { type: "string", enum: ["WHATSAPP", "SMS", "EMAIL", "PUSH"], description: "डिलीवरी चैनल" },
          title: { type: "string", description: "सूचना शीर्षक" },
          message: { type: "string", description: "पूरा संदेश" },
          status: { type: "string", enum: ["PENDING", "SENT", "FAILED"], description: "PENDING = अनपढ़, SENT = पढ़ी हुई, FAILED = त्रुटि" },
          sentAt: { type: "string", format: "date-time", nullable: true, description: "कब पढ़ा गया" },
          metadata: { type: "object", nullable: true, description: "अतिरिक्त जानकारी" },
          createdAt: { type: "string", format: "date-time", description: "बनाने का समय" },
        },
      },
      SendNotificationRequest: {
        type: "object",
        description: "सूचना भेजने का अनुरोध (Admin only)",
        required: ["userId", "channel", "title", "message"],
        properties: {
          userId: { type: "string", description: "प्राप्तकर्ता user ID" },
          channel: { type: "string", enum: ["WHATSAPP", "SMS", "EMAIL", "PUSH"], description: "डिलीवरी चैनल" },
          title: { type: "string", description: "सूचना शीर्षक (max 200 chars)" },
          message: { type: "string", description: "पूरा संदेश (max 5000 chars)" },
          trigger: { type: "string", enum: ["BOOKING_CONFIRMED", "BOOKING_REMINDER", "BOOKING_CANCELLED", "PAYMENT_RECEIVED", "OFFER_APPLIED", "LOYALTY_EARNED", "LOYALTY_REDEEMED"], description: "ट्रिगर (optional)" },
        },
      },
      NotificationListResponse: {
        type: "object",
        description: "सूचनाओं की सूची — pagination, unreadCount सहित",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              notifications: { type: "array", items: { $ref: "#/components/schemas/Notification" } },
              unreadCount: { type: "integer", description: "अनपढ़ सूचनाओं की संख्या" },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  pageSize: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
        },
      },
      NotificationDetailResponse: {
        type: "object",
        description: "एकल सूचना विवरण",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/Notification" },
          message: { type: "string" },
        },
      },
      MarkAllReadResponse: {
        type: "object",
        description: "सभी अनपढ़ सूचनाएं पढ़ी हुई मार्क करने का response",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              updatedCount: { type: "integer", description: "कितनी सूचनाएं पढ़ी हुई मार्क हुईं" },
            },
          },
          message: { type: "string" },
        },
      },
      UnreadCountResponse: {
        type: "object",
        description: "अनपढ़ सूचनाओं की संख्या — बैज दिखाने के लिए",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              unreadCount: { type: "integer", description: "अनपढ़ (PENDING) सूचनाओं की संख्या" },
            },
          },
        },
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
