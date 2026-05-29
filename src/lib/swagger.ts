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
    version: "1.1.0",
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
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
