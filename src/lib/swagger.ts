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
      "## Authentication\n" +
      "सभी protected endpoints को `Authorization: Bearer <access_token>` header चाहिए।\n" +
      "OTP-based login — कोई पासवर्ड नहीं!\n\n" +
      "## Rate Limits\n" +
      "- OTP send: 1/min, 5/hour per mobile\n" +
      "- OTP verify: 3 attempts per OTP\n" +
      "- Token refresh: 10/min per user",
    version: "1.0.0",
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
      name: "Auth",
      description: "प्रमाणीकरण — OTP Login, Token Management",
    },
  ],
  paths: {
    "/api/auth/send-otp": {
      post: {
        tags: ["Auth"],
        summary: "OTP भेजें",
        description:
          "दिए गए मोबाइल नंबर पर 6-digit OTP भेजता है।\n\n" +
          "- Rate limit: 1 OTP/min, 5/hour\n" +
          "- OTP 5 minutes में expire होता है\n" +
          "- अगर user exist नहीं करता, तो नया account create होता है (REGISTER purpose)\n" +
          "- अगर user exist करता है, तो LOGIN purpose OTP भेजा जाता है",
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
                example: {
                  success: true,
                  data: {
                    mobile: "9876543210",
                    expiresIn: 300,
                    messageId: "stub_1780052830359_9876543210",
                  },
                  message: "OTP sent successfully.",
                },
              },
            },
          },
          "400": {
            description: "Invalid mobile number",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "VALIDATION_ERROR",
                  message: "मोबाइल नंबर 10 अंकों का होना चाहिए",
                  statusCode: 400,
                },
              },
            },
          },
          "429": {
            description: "Rate limit exceeded — बहुत जल्दी OTP request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "RATE_LIMIT_EXCEEDED",
                  message: "OTP request limit reached. Please try again later.",
                  statusCode: 429,
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "OTP Verify करें",
        description:
          "OTP verify करके access token और refresh token देता है।\n\n" +
          "- Max 3 verify attempts per OTP\n" +
          "- Access token: 15 minutes valid\n" +
          "- Refresh token: 7 days valid\n" +
          "- नए user को USER role assign होती है",
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
                schema: { $ref: "#/components/schemas/VerifyOtpResponse" },
                example: {
                  success: true,
                  data: {
                    user: {
                      id: "cm3xyz123",
                      mobile: "9876543210",
                      name: "राहुल शर्मा",
                      role: "USER",
                    },
                    accessToken: "eyJhbGciOiJIUzI1NiJ9...",
                    refreshToken: "eyJhbGciOiJIUzI1NiJ9...",
                    expiresIn: 900,
                  },
                  message: "OTP verified successfully.",
                },
              },
            },
          },
          "401": {
            description: "Invalid or expired OTP",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "INVALID_OTP",
                  message: "Invalid OTP. 2 attempts remaining.",
                  statusCode: 401,
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Token Refresh करें",
        description:
          "Refresh token से नया access token लें।\n\n" +
          "- Refresh token 7 days valid\n" +
          "- New access token 15 minutes valid\n" +
          "- अगर refresh token expired, तो दोबारा login करें",
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
                example: {
                  success: true,
                  data: {
                    accessToken: "eyJhbGciOiJIUzI1NiJ9...",
                    expiresIn: 900,
                  },
                  message: "Token refreshed successfully.",
                },
              },
            },
          },
          "401": {
            description: "Invalid or expired refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "INVALID_REFRESH_TOKEN",
                  message: "Refresh token expired. Please login again.",
                  statusCode: 401,
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "अपनी Profile देखें",
        description:
          "Current logged-in user की profile information।\n\n" +
          "- Authorization header में Bearer token चाहिए\n" +
          "- User की basic info + role return होती है",
        operationId: "getMe",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "User profile data",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MeResponse" },
                example: {
                  success: true,
                  data: {
                    id: "cm3xyz123",
                    mobile: "9876543210",
                    name: "राहुल शर्मा",
                    role: "USER",
                    email: "rahul@example.com",
                    avatarUrl: null,
                    loyaltyPoints: 120,
                    isActive: true,
                  },
                  message: "User profile fetched.",
                },
              },
            },
          },
          "401": {
            description: "Missing or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
                example: {
                  success: false,
                  error: "AUTH_MISSING_TOKEN",
                  message: "Missing authorization token. Please login.",
                  statusCode: 401,
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout करें",
        description:
          "Current session को invalidate करता है।\n\n" +
          "- Server-side session delete होती है\n" +
          "- Client-side token भी delete करें\n" +
          "- अगर token invalid है, तो भी success response देता है (idempotent)",
        operationId: "logout",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Logged out successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LogoutResponse" },
                example: {
                  success: true,
                  data: null,
                  message: "Logged out successfully.",
                },
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
          mobile: {
            type: "string",
            pattern: "^[6-9]\\d{9}$",
            description: "Indian 10-digit mobile number",
            example: "9876543210",
          },
          otp: {
            type: "string",
            pattern: "^\\d{6}$",
            description: "6-digit OTP received via SMS/WhatsApp",
            example: "123456",
          },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: {
            type: "string",
            description: "JWT refresh token (7 days valid)",
            example: "eyJhbGciOiJIUzI1NiJ9...",
          },
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
              expiresIn: { type: "integer", description: "OTP expiry in seconds", example: 300 },
              messageId: { type: "string", description: "Message delivery ID", example: "stub_123_9876543210" },
            },
          },
          message: { type: "string", example: "OTP sent successfully." },
        },
      },
      VerifyOtpResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/UserBasic" },
              accessToken: { type: "string", description: "JWT access token (15 min)", example: "eyJhbGci..." },
              refreshToken: { type: "string", description: "JWT refresh token (7 days)", example: "eyJhbGci..." },
              expiresIn: { type: "integer", description: "Access token expiry in seconds", example: 900 },
            },
          },
          message: { type: "string", example: "OTP verified successfully." },
        },
      },
      RefreshTokenResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string", example: "eyJhbGci..." },
              expiresIn: { type: "integer", example: 900 },
            },
          },
          message: { type: "string", example: "Token refreshed successfully." },
        },
      },
      MeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/UserProfile" },
          message: { type: "string", example: "User profile fetched." },
        },
      },
      LogoutResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object", nullable: true },
          message: { type: "string", example: "Logged out successfully." },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string", description: "Error code", example: "VALIDATION_ERROR" },
          message: { type: "string", description: "Human-readable error (Hindi/English)", example: "मोबाइल नंबर 10 अंकों का होना चाहिए" },
          statusCode: { type: "integer", example: 400 },
        },
      },
      // ===== Shared Schemas =====
      UserBasic: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3xyz123" },
          mobile: { type: "string", example: "9876543210" },
          name: { type: "string", nullable: true, example: "राहुल शर्मा" },
          role: { type: "string", enum: ["GUEST", "USER", "STAFF", "ADMIN"], example: "USER" },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string", example: "cm3xyz123" },
          mobile: { type: "string", example: "9876543210" },
          name: { type: "string", nullable: true, example: "राहुल शर्मा" },
          email: { type: "string", nullable: true, example: "rahul@example.com" },
          role: { type: "string", enum: ["GUEST", "USER", "STAFF", "ADMIN"], example: "USER" },
          avatarUrl: { type: "string", nullable: true },
          loyaltyPoints: { type: "integer", example: 120 },
          isActive: { type: "boolean", example: true },
        },
      },
    },
  },
} as const;

export type OpenApiSpec = typeof openApiSpec;
