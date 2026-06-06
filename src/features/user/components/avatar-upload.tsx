/**
 * Purpose: Avatar upload and gallery selection.
 * Responsibility: Let users update their profile avatar through upload or existing gallery images.
 * Important Notes:
 *   - Selected file is stored in a ref because it is only needed by handlers.
 *   - Dialog UI is split into small local components to keep the workflow maintainable.
 */

"use client";

import Image from "next/image";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { Camera, Check, ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/use-translation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useAvatarGallery } from "@/features/user/hooks/use-avatar-gallery";
import { useUploadAvatar } from "@/features/user/hooks/use-upload-avatar";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarUploadProps {
  onProfileChange?: () => void;
}

type AvatarUploadState = {
  preview: string | null;
  dialogOpen: boolean;
  selectedGalleryUrl: string | null;
  activeTab: string;
  isDragOver: boolean;
};

type AvatarUploadAction =
  | { type: "openDialog" }
  | { type: "setDialogOpen"; value: boolean }
  | { type: "setPreview"; value: string | null }
  | { type: "setGalleryUrl"; value: string | null }
  | { type: "setActiveTab"; value: string }
  | { type: "setDragOver"; value: boolean }
  | { type: "resetDialog" };

function avatarUploadReducer(
  state: AvatarUploadState,
  action: AvatarUploadAction
): AvatarUploadState {
  switch (action.type) {
    case "openDialog":
      return { ...state, dialogOpen: true };
    case "setDialogOpen":
      return action.value ? { ...state, dialogOpen: true } : resetDialogState;
    case "setPreview":
      return { ...state, preview: action.value };
    case "setGalleryUrl":
      return { ...state, selectedGalleryUrl: action.value };
    case "setActiveTab":
      return { ...state, activeTab: action.value };
    case "setDragOver":
      return { ...state, isDragOver: action.value };
    case "resetDialog":
      return resetDialogState;
    default:
      return state;
  }
}

const resetDialogState: AvatarUploadState = {
  preview: null,
  dialogOpen: false,
  selectedGalleryUrl: null,
  activeTab: "upload",
  isDragOver: false,
};

export function AvatarUpload({ onProfileChange }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);
  const user = useAuthStore((state) => state.user);
  const { upload, isUploading } = useUploadAvatar();
  const { t } = useTranslation();
  const [state, dispatch] = useReducer(avatarUploadReducer, resetDialogState);
  const {
    data: galleryData,
    isLoading: isGalleryLoading,
    refetch: refetchGallery,
  } = useAvatarGallery();

  useEffect(() => {
    return () => {
      if (state.preview) URL.revokeObjectURL(state.preview);
    };
  }, [state.preview]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((namePart) => namePart[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const currentAvatar = state.preview || user?.avatarUrl;

  const clearSelectedFile = useCallback(() => {
    selectedFileRef.current = null;
    dispatch({ type: "setPreview", value: null });
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) {
        toast.error(t("profile.avatarHint"));
        return;
      }

      selectedFileRef.current = file;
      dispatch({ type: "setPreview", value: URL.createObjectURL(file) });
    },
    [t]
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFileRef.current) return;

    const result = await upload(selectedFileRef.current);
    if (result) {
      selectedFileRef.current = null;
      dispatch({ type: "resetDialog" });
      onProfileChange?.();
    }
  }, [upload, onProfileChange]);

  const handleGallerySelect = useCallback(async () => {
    if (!state.selectedGalleryUrl) return;

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ avatarUrl: state.selectedGalleryUrl }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to update avatar");

      const { setUser } = useAuthStore.getState();
      setUser({ avatarUrl: state.selectedGalleryUrl } as Partial<
        import("@/types").UserProfile
      >);
      toast.success(t("profile.avatarUpdated"));
      dispatch({ type: "resetDialog" });
      onProfileChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.somethingWrong"));
    }
  }, [state.selectedGalleryUrl, t, onProfileChange]);

  const handleTabChange = useCallback(
    (value: string) => {
      dispatch({ type: "setActiveTab", value });
      if (value === "gallery") {
        refetchGallery();
      }
    },
    [refetchGallery]
  );

  return (
    <>
      <AvatarOpenButton
        currentAvatar={currentAvatar}
        initials={initials}
        isUploading={isUploading}
        userName={user?.name}
        onOpen={() => dispatch({ type: "openDialog" })}
      />

      <Dialog
        open={state.dialogOpen}
        onOpenChange={(open) => {
          if (!open) selectedFileRef.current = null;
          dispatch({ type: "setDialogOpen", value: open });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {t("profile.avatarUpload")}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={state.activeTab} onValueChange={handleTabChange}>
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

            <UploadTab
              inputRef={inputRef}
              preview={state.preview}
              isDragOver={state.isDragOver}
              isUploading={isUploading}
              onFileSelect={handleFileSelect}
              onUpload={handleUpload}
              onClear={clearSelectedFile}
              setDragOver={(value) =>
                dispatch({ type: "setDragOver", value })
              }
            />
            <GalleryTab
              images={galleryData?.images ?? []}
              isLoading={isGalleryLoading}
              currentAvatarUrl={user?.avatarUrl}
              selectedGalleryUrl={state.selectedGalleryUrl}
              onSelect={(url) =>
                dispatch({ type: "setGalleryUrl", value: url })
              }
              onConfirm={handleGallerySelect}
            />
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AvatarOpenButton({
  currentAvatar,
  initials,
  isUploading,
  userName,
  onOpen,
}: {
  currentAvatar?: string | null;
  initials: string;
  isUploading: boolean;
  userName?: string | null;
  onOpen: () => void;
}) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="relative group cursor-pointer bg-transparent border-0 p-0"
      onClick={onOpen}
      aria-label={t("profile.avatarUpload")}
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
            alt={userName || "User avatar"}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 text-rose-600 dark:text-rose-300 text-2xl font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
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
      <p className="text-[10px] text-muted-foreground text-center mt-1.5">
        {t("profile.avatarHint")}
      </p>
    </button>
  );
}

function UploadTab({
  inputRef,
  preview,
  isDragOver,
  isUploading,
  onFileSelect,
  onUpload,
  onClear,
  setDragOver,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  preview: string | null;
  isDragOver: boolean;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
  onClear: () => void;
  setDragOver: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <TabsContent value="upload" className="mt-4">
      <button
        type="button"
        className={cn(
          "relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer w-full bg-transparent",
          isDragOver
            ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
            : "border-muted-foreground/25 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/10"
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const file = event.dataTransfer.files[0];
          if (file) onFileSelect(file);
        }}
        onClick={() => inputRef.current?.click()}
        aria-label={t("profile.avatarUpload")}
      >
        {preview ? <AvatarPreview preview={preview} /> : <UploadPrompt />}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFileSelect(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
          disabled={isUploading}
          aria-label={t("profile.avatarUpload")}
        />
      </button>
      {preview && (
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="ghost" size="sm" onClick={onClear} disabled={isUploading}>
            <X className="h-4 w-4 mr-1" />
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            className="bg-rose-500 hover:bg-rose-600 text-white"
            onClick={onUpload}
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
  );
}

function AvatarPreview({ preview }: { preview: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="h-24 w-24 border-4 border-rose-200 dark:border-rose-800">
        <AvatarImage src={preview} alt="Preview" className="object-cover" />
        <AvatarFallback className="bg-rose-100 dark:bg-rose-900/30 text-rose-500">
          <ImageIcon className="h-8 w-8" />
        </AvatarFallback>
      </Avatar>
      <p className="text-xs text-muted-foreground">Click or drag to change</p>
    </div>
  );
}

function UploadPrompt() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
        <Upload className="h-6 w-6 text-rose-500" />
      </div>
      <div>
        <p className="text-sm font-medium">Drag & drop or click to upload</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("profile.avatarHint")}
        </p>
      </div>
    </div>
  );
}

function GalleryTab({
  images,
  isLoading,
  currentAvatarUrl,
  selectedGalleryUrl,
  onSelect,
  onConfirm,
}: {
  images: { publicId: string; url: string }[];
  isLoading: boolean;
  currentAvatarUrl?: string | null;
  selectedGalleryUrl: string | null;
  onSelect: (url: string | null) => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  return (
    <TabsContent value="gallery" className="mt-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
          <span className="ml-2 text-sm text-muted-foreground">
            {t("common.loading")}
          </span>
        </div>
      ) : images.length === 0 ? (
        <EmptyGallery />
      ) : (
        <GalleryGrid
          images={images}
          currentAvatarUrl={currentAvatarUrl}
          selectedGalleryUrl={selectedGalleryUrl}
          onSelect={onSelect}
        />
      )}
      {selectedGalleryUrl && (
        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
            <X className="h-4 w-4 mr-1" />
            {t("common.cancel")}
          </Button>
          <Button
            size="sm"
            className="bg-rose-500 hover:bg-rose-600 text-white"
            onClick={onConfirm}
          >
            <Check className="h-4 w-4 mr-1" />
            {t("common.confirm")}
          </Button>
        </div>
      )}
    </TabsContent>
  );
}

function EmptyGallery() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">No previous photos found</p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Upload a photo to get started
      </p>
    </div>
  );
}

function GalleryGrid({
  images,
  currentAvatarUrl,
  selectedGalleryUrl,
  onSelect,
}: {
  images: { publicId: string; url: string }[];
  currentAvatarUrl?: string | null;
  selectedGalleryUrl: string | null;
  onSelect: (url: string | null) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
      {images.map((image) => {
        const isSelected = selectedGalleryUrl === image.url;
        const isCurrentAvatar = currentAvatarUrl === image.url;

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
            onClick={() => onSelect(isSelected ? null : image.url)}
          >
            <Image
              src={image.url}
              alt="Avatar option"
              fill
              sizes="96px"
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
  );
}
