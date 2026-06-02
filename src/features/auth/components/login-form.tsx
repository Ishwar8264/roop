/**
 * Purpose: Login form with OTP (mobile) and Email+Password tabs
 * Responsibility: Handle user login via OTP or email/password
 * Important Notes:
 *   - Generic component — receives `onSuccess` callback, no router coupling
 *   - Dev OTP shown in yellow banner during development
 *   - OTP flow: send-otp → verify-otp
 *   - Email flow: login-email
 *   - No auth store import — parent handles post-login via onSuccess
 *   - Uses i18n for all UI strings
 */

"use client";

import { useState } from "react";
import { Phone, Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiClient } from "@/services/api-client";
import { useTranslation } from "@/i18n/use-translation";
import type { ApiResponse, SendOtpResponse, OTPVerifyResponse, LoginEmailResponse, UserProfile } from "@/types";

// ==================== Types ====================

interface LoginSuccessData {
  user: UserProfile;
  token: string;
  isNewUser?: boolean;
}

interface LoginFormProps {
  onSuccess?: (data: LoginSuccessData) => void;
  onSwitchToRegister?: () => void;
}

// ==================== Component ====================

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"otp" | "email">("otp");

  // OTP state
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ==================== OTP Handlers ====================

  async function handleSendOtp() {
    setError(null);
    if (!mobile || mobile.length < 10) {
      setError(t("common.pleaseEnter") + " " + t("auth.mobileNumber").toLowerCase());
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<SendOtpResponse>>(
        "/auth/send-otp",
        { mobile, purpose: "LOGIN" }
      );

      if (res.success) {
        setOtpSent(true);
        if (res.data?.devOtp) {
          setDevOtp(res.data.devOtp);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.somethingWrong");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    setError(null);
    if (!otp || otp.length < 4) {
      setError(t("common.pleaseEnter") + " OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<OTPVerifyResponse>>(
        "/auth/verify-otp",
        { mobile, otp, purpose: "LOGIN" }
      );

      if (res.success && res.data) {
        onSuccess?.({
          user: res.data.user,
          token: res.data.tokens.accessToken,
          isNewUser: res.data.isNewUser,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.somethingWrong");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ==================== Email Handlers ====================

  async function handleEmailLogin() {
    setError(null);
    if (!email || !password) {
      setError(t("common.pleaseEnter") + " " + t("auth.email").toLowerCase() + " & " + t("auth.password").toLowerCase());
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<LoginEmailResponse>>(
        "/auth/login-email",
        { email, password }
      );

      if (res.success && res.data) {
        onSuccess?.({
          user: res.data.user,
          token: res.data.tokens.accessToken,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.somethingWrong");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // ==================== Render ====================

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border/50">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl font-bold">
          {t("auth.loginTitle")}
        </CardTitle>
        <CardDescription>
          {t("auth.loginSubtitle")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dev OTP Banner */}
        {devOtp && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center dark:bg-yellow-900/20 dark:border-yellow-800">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t("auth.devOtp")}: <span className="font-bold">{devOtp}</span>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            type="button"
            onClick={() => { setTab("otp"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === "otp"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Phone className="h-4 w-4" />
            {t("auth.mobileOtp")}
          </button>
          <button
            type="button"
            onClick={() => { setTab("email"); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
              tab === "email"
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            }`}
          >
            <Mail className="h-4 w-4" />
            {t("auth.email")}
          </button>
        </div>

        {/* ===== OTP Tab ===== */}
        {tab === "otp" && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.mobileNumber")}</label>
              <Input
                type="tel"
                placeholder={t("auth.enterMobile")}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={otpSent}
                className="h-11"
              />
            </div>

            {otpSent && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">OTP</label>
                <Input
                  type="text"
                  placeholder={t("auth.enterOtp")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="h-11 text-center text-lg tracking-widest"
                  autoFocus
                />
              </div>
            )}

            {!otpSent ? (
              <Button
                className="w-full h-11"
                onClick={handleSendOtp}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                {t("auth.sendOtp")}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  className="w-full h-11"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {t("auth.verifyOtp")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => { setOtpSent(false); setOtp(""); setDevOtp(null); }}
                >
                  {t("auth.changeNumber")}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ===== Email Tab ===== */}
        {tab === "email" && (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.email")}</label>
              <Input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{t("auth.password")}</label>
              <Input
                type="password"
                placeholder={t("auth.enterPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              />
            </div>
            <Button
              className="w-full h-11"
              onClick={handleEmailLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {t("auth.loginButton")}
            </Button>
          </div>
        )}

        {/* Switch to Register */}
        <div className="text-center pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            {t("auth.noAccount")}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={onSwitchToRegister}
            >
              {t("auth.register")}
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
