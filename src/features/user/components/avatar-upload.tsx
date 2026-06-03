/**
 * Purpose: Click-to-upload avatar with camera overlay icon
 * Responsibility: Display current avatar or initials, handle file selection and upload
 * Important Notes:
 *   - Shows current avatar from useAuthStore or initials fallback
 *   - Hidden file input with accept="image/jpeg,image/png,image/webp"
 *   - Client-side validation (5MB, MIME type)
 *   - Shows preview immediately using URL.createObjectURL
 *   - Loading spinner while uploading
 *   - Rose pink gradient border on hover
 */

"use client";

import { useRef, useState, useCallback } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { useUploadAvatar } from "@/features/user/hooks/use-upload-avatar";
import { useTranslation } from "@/i18n/use-translation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const user = useAuthStore((s) => s.user);
  const { upload, isUploading } = useUploadAvatar();
  const { t } = useTranslation();
  const [preview, setPreview] = useState<string | null>(null);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const currentAvatar = preview || user?.avatarUrl;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Client-side validation
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error(t("profile.avatarHint"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("profile.avatarHint"));
        return;
      }

      // Show preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload to server
      const result = await upload(file);
      if (!result) {
        // Revert preview on failure
        setPreview(null);
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [upload, t]
  );

  return (
    <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
      <div
        className={cn(
          "relative rounded-full p-[3px] transition-all duration-300",
          "bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600",
          "group-hover:from-rose-300 group-hover:via-pink-400 group-hover:to-rose-500",
          "group-hover:shadow-lg group-hover:shadow-rose-500/30"
        )}
      >
        <Avatar className="h-24 w-24 border-4 border-background">
          <AvatarImage
            src={currentAvatar || undefined}
            alt={user?.name || "User avatar"}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600 dark:text-rose-300 text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Camera overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-full flex items-center justify-center",
          "bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          isUploading && "opacity-100"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Camera className="h-6 w-6 text-white" />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
        aria-label={t("profile.avatarUpload")}
      />

      {/* Hint text */}
      <p className="text-[10px] text-muted-foreground text-center mt-1.5">
        {t("profile.avatarHint")}
      </p>
    </div>
  );
}
