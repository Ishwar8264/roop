/**
 * Purpose: Registration form with Email + Password
 * Responsibility: Handle new user registration
 * Important Notes:
 *   - Generic component — receives `onSuccess` callback, no router coupling
 *   - Email + password + name fields
 *   - Calls /api/auth/register-email endpoint
 *   - No auth store import — parent handles post-register via onSuccess
 */

"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiClient } from "@/services/api-client";
import type { ApiResponse, RegisterEmailResponse, UserProfile } from "@/types";

// ==================== Types ====================

interface RegisterSuccessData {
  user: UserProfile;
  token: string;
}

interface RegisterFormProps {
  onSuccess?: (data: RegisterSuccessData) => void;
  onSwitchToLogin?: () => void;
}

// ==================== Component ====================

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);

    if (!email || !password) {
      setError("कृपया ईमेल और पासवर्ड डालें");
      return;
    }

    if (password.length < 8) {
      setError("पासवर्ड कम से कम 8 अक्षर का होना चाहिए");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<RegisterEmailResponse>>(
        "/auth/register-email",
        {
          email,
          password,
          name: name || undefined,
          mobile: mobile || undefined,
        }
      );

      if (res.success && res.data) {
        onSuccess?.({
          user: res.data.user,
          token: res.data.tokens.accessToken,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "रजिस्ट्रेशन में त्रुटि";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">
          रजिस्टर करें
        </CardTitle>
        <CardDescription>
          नया अकाउंट बनाएं
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1.5 block">नाम (वैकल्पिक)</label>
          <Input
            type="text"
            placeholder="आपका नाम"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">मोबाइल नंबर (वैकल्पिक)</label>
          <Input
            type="tel"
            placeholder="10 अंक का मोबाइल नंबर"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
            className="h-11"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">ईमेल *</label>
          <Input
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">पासवर्ड *</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="कम से कम 8 अक्षर"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10"
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          className="w-full h-11"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ArrowRight className="h-4 w-4 mr-2" />
          )}
          अकाउंट बनाएं
        </Button>

        {/* Switch to Login */}
        <div className="text-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            पहले से अकाउंट है?{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={onSwitchToLogin}
            >
              लॉगिन करें
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
