import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Eye,
  Check,
  Zap,
  Droplets,
  Wifi,
  Sparkles,
  Car,
  Users,
  Layers,
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mapApiRoomToUiRoom } from "@/utils/mappers";
import type { Room } from "@/types";

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "Điều hoà": <Zap className="h-4 w-4" />,
  "Nóng lạnh": <Droplets className="h-4 w-4" />,
  Wifi: <Wifi className="h-4 w-4" />,
  "WC khép kín": <Home className="h-4 w-4" />,
  "Bếp riêng": <Sparkles className="h-4 w-4" />,
  "Máy giặt": <Sparkles className="h-4 w-4" />,
  "Thang máy": <Layers className="h-4 w-4" />,
  "Bảo vệ 24/7": <Users className="h-4 w-4" />,
};

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role, loading: authLoading } = useAuth();
  
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  const trackViewedRoom = useCallback((roomId: string) => {
    try {
      const viewedRooms = JSON.parse(localStorage.getItem('viewedRooms') || '[]') as string[];
      if (!viewedRooms.includes(roomId)) {
        viewedRooms.push(roomId);
        localStorage.setItem('viewedRooms', JSON.stringify(viewedRooms));
      }
    } catch (error) {
      console.error('Error tracking viewed room:', error);
    }
  }, []);

  const fetchRoom = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data, error } = await apiClient.getRoom(id);

      if (error) {
        throw new Error(error);
      }
      const roomData = data?.room ? mapApiRoomToUiRoom(data.room) : null;
      setRoom(roomData);
      
      // Track viewed room after successful load
      if (roomData) {
        trackViewedRoom(roomData);
      }
    } catch (error) {
      console.error("Error fetching room:", error);
      toast.error("Không thể tải thông tin phòng");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const checkIfSaved = useCallback(async () => {
    if (!isAuthenticated || !id) return;
    
    try {
      const { data } = await apiClient.checkIsFavorited(id);
      if (data?.isFavorited) {
        setSaved(true);
      }
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  }, [isAuthenticated, id]);

  useEffect(() => {
    if (id) {
      fetchRoom();
      checkIfSaved();
      trackViewedRoom(id);
    }
  }, [id, fetchRoom, checkIfSaved, trackViewedRoom]);

  const handleSaveRoom = async () => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để lưu phòng');
      navigate('/auth/login');
      return;
    }

    // Only allow tenants to save rooms
    if (role !== 'tenant') {
      toast.error('Chỉ người tìm trọ mới có thể lưu phòng');
      return;
    }

    setIsSaving(true);
    try {
      if (saved) {
        // Remove from favorites
        const { error } = await apiClient.removeFavorite(id!);
        if (error) {
          toast.error('Lỗi: ' + error);
          return;
        }
        setSaved(false);
        toast.success('Đã xóa phòng khỏi danh sách yêu thích');
      } else {
        // Add to favorites
        const { error } = await apiClient.addFavorite(id!);
        if (error) {
          if (error.includes('already')) {
            setSaved(true);
            toast.success('Phòng này đã có trong danh sách yêu thích', {
              action: {
                label: 'Xem danh sách',
                onClick: () => navigate('/saved-rooms')
              }
            });
          } else {
            toast.error('Lỗi: ' + error);
          }
          return;
        }
        setSaved(true);
        toast.success('Đã lưu phòng vào danh sách yêu thích', {
          action: {
            label: 'Xem danh sách',
            onClick: () => navigate('/saved-rooms')
          }
        });
      }
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Không thể lưu phòng');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Vite environment key for Google Maps Embed API
  const mapsKey = (import.meta.env as Record<string, any>).VITE_GOOGLE_MAPS_KEY as
    | string
    | undefined;

  // Build embed URL when address and API key are available
  const mapSrc = room?.address && mapsKey
    ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
        mapsKey,
      )}&q=${encodeURIComponent(room.address)}`
    : null;

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!room) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Không tìm thấy phòng trọ</p>
          <Button onClick={() => navigate("/find-room")} className="mt-4">
            Quay lại
          </Button>
        </div>
      </Layout>
    );
  }

  const formatPrice = (price: number) =>
    `${(price / 1000000).toFixed(1).replace(".0", "")} triệu`;
  const formatUtility = (value: number | string) => {
    if (typeof value === "string") return value;
    if (value === 0) return "Miễn phí";
    return `${value.toLocaleString()}đ`;
  };

  const timeAgo = (date: Date) => {
    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    return `${days} ngày trước`;
  };

  return (
    <Layout>
      {/* Rating Dialog */}
      {showRatingDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowRatingDialog(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-2xl p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Đánh giá phòng</h2>
              <button
                onClick={() => setShowRatingDialog(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Star Rating */}
              <div className="flex justify-center gap-2 py-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "h-8 w-8",
                        (hoverRating || rating) >= star
                          ? "fill-accent text-accent"
                          : "text-muted-foreground",
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Comment */}
              <textarea
                placeholder="Chia sẻ nhận xét của bạn về phòng này (tùy chọn)"
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                rows={4}
              />

              {/* Submit Button */}
              <Button
                onClick={async () => {
                  if (rating === 0) {
                    toast.error("Vui lòng chọn mức đánh giá");
                    return;
                  }
                  
                  setIsSubmittingRating(true);
                  try {
                    // TODO: Implement API call to submit rating
                    // await apiClient.rateRoom(id, { rating, comment: ratingComment });
                    toast.success("Cảm ơn bạn đã đánh giá phòng!");
                    setShowRatingDialog(false);
                    setRating(0);
                    setRatingComment("");
                  } catch (error) {
                    toast.error("Không thể gửi đánh giá");
                  } finally {
                    setIsSubmittingRating(false);
                  }
                }}
                className="w-full rounded-full"
                disabled={isSubmittingRating || rating === 0}
              >
                {isSubmittingRating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi đánh giá"
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
          <button
            onClick={() =>
              setCurrentImage(
                (prev) =>
                  (prev - 1 + (room.images?.length || 0)) %
                  (room.images?.length || 1),
              )
            }
            className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img
            src={room.images?.[currentImage]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
          <button
            onClick={() =>
              setCurrentImage((prev) => (prev + 1) % (room.images?.length || 1))
            }
            className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </motion.div>
      )}

      <div className="container py-4 md:py-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="grid grid-cols-4 gap-2 rounded-2xl overflow-hidden">
              <div
                className="col-span-4 md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-square cursor-pointer"
                onClick={() => setShowLightbox(true)}
              >
                <img
                  src={room.images?.[0]}
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
              {room.images?.slice(1, 5).map((img, idx) => (
                <div
                  key={idx}
                  className="hidden md:block aspect-square cursor-pointer"
                  onClick={() => {
                    setCurrentImage(idx + 1);
                    setShowLightbox(true);
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div>
              <div className="flex gap-2 mb-2">
                {room.owner?.verified && (
                  <Badge className="bg-match-high text-white">
                    <Check className="h-3 w-3 mr-1" />
                    Chính chủ
                  </Badge>
                )}
                <Badge variant="outline">
                  {room.roomType === "studio"
                    ? "Studio"
                    : room.roomType === "shared"
                      ? "Ở ghép"
                      : room.roomType === "apartment"
                        ? "Căn hộ"
                        : "Phòng đơn"}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold mb-2">{room.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                    {room.address}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeAgo(new Date(room.postedAt))}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {room.views || 0} lượt xem
                </span>
              </div>

                {/* Google Maps Embed iframe: render directly under the address when address + key exist */}
                {mapSrc ? (
                  <div className="mt-3 w-full h-64 rounded overflow-hidden">
                    <iframe
                      title="Room location"
                      src={mapSrc}
                      width="100%"
                      height="100%"
                      style={{ border: 0, minHeight: 240 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  room.address && !mapsKey ? (
                    <div className="mt-3 text-sm text-yellow-600">
                      VITE_GOOGLE_MAPS_KEY chưa được cấu hình — bản đồ không hiển thị.
                    </div>
                  ) : null
                )}
            </div>

            {/* Key Specs */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Diện tích", value: `${room.area}m²` },
                { label: "Tối đa", value: `${room.maxOccupants} người` },
                { label: "Tầng", value: room.floor },
                { label: "Đặt cọc", value: formatPrice(room.deposit) },
              ].map((spec) => (
                <div
                  key={spec.label}
                  className="glass-card p-3 rounded-xl text-center"
                >
                  <p className="text-lg font-bold text-primary">{spec.value}</p>
                  <p className="text-xs text-muted-foreground">{spec.label}</p>
                </div>
              ))}
            </div>

            {/* Utilities */}
            <div className="glass-card p-4 rounded-2xl">
              <h3 className="font-semibold mb-3">💡 Chi phí dịch vụ</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {([
                  {
                    icon: <Zap className="h-4 w-4" />,
                    label: "Điện",
                    value: room.utilities.electricity
                      ? `${room.utilities.electricity}đ/số`
                      : "Miễn phí",
                  },
                  {
                    icon: <Droplets className="h-4 w-4" />,
                    label: "Nước",
                    value: formatUtility(room.utilities.water),
                  },
                  {
                    icon: <Wifi className="h-4 w-4" />,
                    label: "Internet",
                    value: formatUtility(room.utilities.internet),
                  },
                  {
                    icon: <Sparkles className="h-4 w-4" />,
                    label: "Vệ sinh",
                    value: formatUtility(room.utilities.cleaning),
                  },
                  {
                    icon: <Car className="h-4 w-4" />,
                    label: "Gửi xe",
                    value: formatUtility(room.utilities.parking),
                  },
                ]).map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg"
                  >
                    <span className="text-primary">{item.icon}</span>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div>
              <h3 className="font-semibold mb-3">✨ Tiện ích</h3>
              <div className="flex flex-wrap gap-2">
                {room.amenities?.map((amenity: string) => (
                  <span
                    key={amenity}
                    className="flex items-center gap-2 px-3 py-2 bg-muted rounded-full text-sm"
                  >
                    {AMENITY_ICONS[amenity] || <Check className="h-4 w-4" />}{" "}
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold mb-3">📝 Mô tả chi tiết</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {room.description}
              </p>
            </div>
          </div>

          {/* Sidebar - Booking Card */}
          <div className="lg:col-span-1">
            <div className="glass-card p-5 rounded-2xl sticky top-20 space-y-4">
              <div className="text-center border-b border-border pb-4">
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(room.price)}
                </p>
                <p className="text-muted-foreground">/tháng</p>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-3">
                <img
                  src={room.owner?.avatar || "/placeholder-avatar.png"}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium">{room.owner?.name || "Chủ nhà"}</p>
                  {room.owner?.verified && (
                    <p className="text-xs text-match-high flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Đã xác minh
                    </p>
                  )}
                </div>
              </div>

              {/* CTAs */}
              <Button
                className="w-full rounded-full"
                size="lg"
                onClick={() =>
                  window.open(`https://zalo.me/${room.owner?.phone}`, "_blank")
                }
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Nhắn Zalo
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                size="lg"
                onClick={() => window.open(`tel:${room.owner?.phone}`)}
              >
                <Phone className="h-4 w-4 mr-2" /> Gọi điện
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className={cn(
                    "flex-1 rounded-full",
                    saved && "text-destructive",
                  )}
                  onClick={handleSaveRoom}
                  disabled={isSaving || authLoading}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Heart
                      className={cn("h-4 w-4 mr-2", saved && "fill-current")}
                    />
                  )}
                  {isSaving ? "Đang lưu..." : "Lưu phòng"}
                </Button>
                <Button variant="ghost" className="flex-1 rounded-full" onClick={() => setShowRatingDialog(true)}>
                  <Star className="h-4 w-4 mr-2" /> Đánh giá
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fixed CTA */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden z-40">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xl font-bold text-primary">
              {formatPrice(room.price)}
              <span className="text-sm font-normal text-muted-foreground">
                /tháng
              </span>
            </p>
          </div>
          <Button
            className="flex-1 rounded-full"
            onClick={() =>
              window.open(`https://zalo.me/${room.owner?.phone}`, "_blank")
            }
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Nhắn Zalo
          </Button>
        </div>
      </div>
    </Layout>
  );
}
