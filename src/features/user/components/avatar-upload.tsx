/**
 * Purpose: Avatar upload with Dialog containing Upload and Gallery tabs
 * Responsibility: Display current avatar or initials, open dialog for upload/gallery selection
 * Important Notes:
 *   - Clicking avatar opens a Dialog with 2 tabs: Upload and Gallery
 *   - Upload tab: File input with drag & drop area, preview, and upload button
 *   - Gallery tab: Grid of images from Cloudinary, click to select, confirm button
 *   - Current avatar highlighted in gallery
 *   - Uses shadcn/ui Dialog, Tabs components
 *   - Uses existing useUploadAvatar hook for uploading
 */

"use client";

import { useRef, useState, useCallback } from "react";
import {
  Camera,
  Loader2,
  Upload,
  ImageIcon,
  Check,
  X,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useUploadAvatar } from "@/features/user/hooks/use-upload-avatar";
import { useAvatarGallery } from "@/features/user/hooks/use-avatar-gallery";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState<string | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("upload");
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    data: galleryData,
    isLoading: isGalleryLoading,
    refetch: refetchGallery,
  } = useAvatarGallery();

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
    (file: File) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        toast.error(t("profile.avatarHint"));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(t("profile.avatarHint"));
        return;
      }

      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    },
    [t]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    const result = await upload(selectedFile);
    if (result) {
      setSelectedFile(null);
      setPreview(null);
      setDialogOpen(false);
    }
  }, [selectedFile, upload]);

  const handleGallerySelect = useCallback(async () => {
    if (!selectedGalleryUrl) return;

    // Update the store with the selected gallery URL
    const { setUser } = useAuthStore.getState();
    setUser({ avatarUrl: selectedGalleryUrl } as Partial<
      import("@/types").UserProfile
    >);
    toast.success(t("profile.avatarUpdated"));
    setSelectedGalleryUrl(null);
    setDialogOpen(false);
  }, [selectedGalleryUrl, t]);

  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      if (value === "gallery") {
        refetchGallery();
      }
    },
    [refetchGallery]
  );

  const handleDialogClose = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        setSelectedFile(null);
        setPreview(null);
        setSelectedGalleryUrl(null);
        setActiveTab("upload");
      }
    },
    []
  );

  const galleryImages = galleryData?.images ?? [];

  return (
    <>
      {/* Avatar — click to open dialog */}
      <div
        className="relative group cursor-pointer"
        onClick={() => setDialogOpen(true)}
      >
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

        {/* Hint text */}
        <p className="text-[10px] text-muted-foreground text-center mt-1.5">
          {t("profile.avatarHint")}
        </p>
      </div>

      {/* Avatar Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t("profile.avatarUpload")}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="upload" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="gallery" className="gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Gallery
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="mt-4">
              <div
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
                  isDragOver
                    ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                    : "border-muted-foreground/25 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/10"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                {preview ? (
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="h-24 w-24 border-4 border-rose-200 dark:border-rose-800">
                      <AvatarImage
                        src={preview}
                        alt="Preview"
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-rose-100 dark:bg-rose-900/30 text-rose-500">
                        <ImageIcon className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">
                      Click or drag to change
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
                      <Upload className="h-6 w-6 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Drag & drop or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("profile.avatarHint")}
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleInputChange}
                  disabled={isUploading}
                  aria-label={t("profile.avatarUpload")}
                />
              </div>

              {preview && (
                <div className="flex gap-2 mt-4 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(null);
                    }}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                    onClick={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Upload className="h-4 w-4 mr-1" />
                    )}
                    Upload
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="mt-4">
              {isGalleryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    {t("common.loading")}
                  </span>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No previous photos found
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Upload a photo to get started
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
                  {galleryImages.map((image) => {
                    const isSelected =
                      selectedGalleryUrl === image.url;
                    const isCurrentAvatar =
                      user?.avatarUrl === image.url;

                    return (
                      <button
                        key={image.publicId}
                        type="button"
                        className={cn(
                          "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                          isSelected
                            ? "border-rose-500 ring-2 ring-rose-500/30"
                            : isCurrentAvatar
                              ? "border-green-400 dark:border-green-700"
                              : "border-transparent hover:border-rose-300 dark:hover:border-rose-700"
                        )}
                        onClick={() =>
                          setSelectedGalleryUrl(
                            isSelected ? null : image.url
                          )
                        }
                      >
                        <img
                          src={image.url}
                          alt="Avatar option"
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-rose-500/30 flex items-center justify-center">
                            <Check className="h-6 w-6 text-white" />
                          </div>
                        )}
                        {isCurrentAvatar && !isSelected && (
                          <div className="absolute top-1 right-1">
                            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="h-2.5 w-2.5 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedGalleryUrl && (
                <div className="flex gap-2 mt-4 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGalleryUrl(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t("common.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-500 hover:bg-rose-600 text-white"
                    onClick={handleGallerySelect}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {t("common.confirm")}
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
