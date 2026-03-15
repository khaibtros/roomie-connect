// --------------------------------------------------------------------------
// AvatarUpload.tsx – Interactive avatar upload with crop / zoom / reposition
// --------------------------------------------------------------------------

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Camera, ZoomIn, ZoomOut, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getCroppedImg } from "@/utils/cropImage";
import { apiClient } from "@/lib/api";

// ── Upload constraints ───────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_FILE_SIZE_LABEL = "15MB";
const ACCEPTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT_ATTR = ACCEPTED_MIME_TYPES.join(",");

// ── Cropper settings ─────────────────────────────────────────────────────
const CROP_ASPECT_RATIO = 1; // 1:1 → circular avatar
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.05;
const INITIAL_ZOOM = 1;
const INITIAL_CROP = { x: 0, y: 0 };

// ─────────────────────────────────────────────────────────────────────────

export interface AvatarUploadProps {
  /** Currently saved avatar URL (empty string is fine). */
  currentAvatarUrl: string;
  /** Single character shown in the fallback circle, e.g. first letter of name. */
  fallbackLabel: string;
  /** Called with the new public URL after a successful upload. */
  onAvatarChange: (newUrl: string) => void;
}

/**
 * Drop-in avatar upload component.
 *
 * Flow:
 *  1. User clicks "Tải ảnh lên" → file picker opens
 *  2. Selected image loads into the crop modal (shadcn Dialog)
 *  3. User drags/zooms to position the crop
 *  4. On confirm:
 *     a. `getCroppedImg()` draws the crop region onto a canvas → Blob (WebP, 512×512)
 *     b. Blob is sent to `POST /api/auth/upload-avatar` via FormData
 *     c. Backend returns { avatarUrl } → `onAvatarChange` fires
 */
export function AvatarUpload({
  currentAvatarUrl,
  fallbackLabel,
  onAvatarChange,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Source image for the editor ──────────────────────────────────────
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);

  // ── Crop / zoom state ────────────────────────────────────────────────
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Always reset so the same file can be re-selected later
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error("Vui lòng chọn file ảnh hợp lệ (JPG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`Kích thước ảnh không được vượt quá ${MAX_FILE_SIZE_LABEL}`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCrop(INITIAL_CROP);
      setZoom(INITIAL_ZOOM);
      setModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  /** Fires every time the user moves/zooms the crop handle. */
  const onCropComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  const handleConfirm = async () => {
    if (!rawImageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);

      // 1. Crop → canvas → Blob (WebP 512×512 @ 0.8 quality)
      const blob = await getCroppedImg(rawImageSrc, croppedAreaPixels);

      // 2. Wrap in FormData and POST
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.webp");

      const { data, error } = await apiClient.uploadAvatar(formData);
      if (error) throw new Error(error);

      // 3. Propagate the new URL to the parent
      onAvatarChange(data.avatarUrl);
      closeModal();
      toast.success("Ảnh đại diện đã được cập nhật!");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setRawImageSrc(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !uploading) closeModal();
  };

  // ─────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Static avatar display + trigger button ── */}
      <div className="flex flex-col items-center gap-4">
        <Avatar className="h-32 w-32 ring-2 ring-border">
          <AvatarImage src={currentAvatarUrl} alt="Avatar" />
          <AvatarFallback className="text-4xl font-semibold">
            {fallbackLabel}
          </AvatarFallback>
        </Avatar>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={handleFileSelect}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Camera className="mr-2 h-4 w-4" />
          {uploading ? "Đang tải lên…" : "Tải ảnh lên"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          JPG, PNG, WebP. Tối đa {MAX_FILE_SIZE_LABEL}.
        </p>
      </div>

      {/* ── Crop modal ── */}
      <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa ảnh đại diện</DialogTitle>
          </DialogHeader>

          {rawImageSrc && (
            <div className="space-y-4">
              {/* Crop canvas */}
              <div className="relative h-80 w-full overflow-hidden rounded-xl bg-black">
                <Cropper
                  image={rawImageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={CROP_ASPECT_RATIO}
                  cropShape="round"
                  showGrid={false}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  zoomSpeed={ZOOM_STEP}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom slider */}
              <div className="flex items-center gap-3 px-1">
                <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Slider
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={ZOOM_STEP}
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  className="flex-1"
                  aria-label="Zoom ảnh"
                />
                <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Kéo để di chuyển • Cuộn chuột hoặc dùng slider để zoom
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={uploading}
            >
              <X className="mr-2 h-4 w-4" />
              Huỷ
            </Button>
            <Button onClick={handleConfirm} disabled={uploading || !croppedAreaPixels}>
              {uploading ? (
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Đang xử lý…" : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
