import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  MapPin,
  Clock,
  Eye,
  Trash2,
  ArrowRight,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { mapApiRoomToUiRoom } from "@/utils/mappers";
import type { Room } from "@/types";
import type { ApiFavorite, ApiRoom } from "@/types/api";

interface SavedRoom extends Room {
  favoritedAt: Date;
}

export default function SavedRooms() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading: authLoading } = useAuth();

  const [rooms, setRooms] = useState<SavedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingRequestingId, setViewingRequestingId] = useState<string | null>(null);
  const [bookingDialogRoom, setBookingDialogRoom] = useState<SavedRoom | null>(null);
  const [bookingTime, setBookingTime] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }

    if (role !== "tenant") {
      toast.error("Chỉ người tìm trọ mới có thể xem danh sách yêu thích");
      navigate("/");
      return;
    }

    fetchSavedRooms();
  }, [isAuthenticated, role, navigate]);

  const fetchSavedRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getFavorites();

      if (error) {
        throw new Error(error);
      }

      // Debug logging
      console.log("Favorites API response:", data);

      // Handle the response structure: { favorites: ApiFavorite[] }
      const favoritesData = data?.favorites || [];
      
      let mappedRooms: SavedRoom[] = [];
      if (Array.isArray(favoritesData)) {
        mappedRooms = favoritesData
          .map((item: ApiFavorite) => {
            console.log("Processing favorite item:", item);
            
            // Item might be: 
            // 1. {room: {...room data...}}
            // 2. {...room data directly...}
            // 3. {roomId: {...room data...}}
            const roomData = (item.room || (typeof item.roomId === 'object' ? item.roomId : null)) as ApiRoom | null;
            
            console.log("Room data to map:", roomData);
            
            // Only map if we have valid room data with at least an id
            if (roomData && roomData._id) {
              return {
                ...mapApiRoomToUiRoom(roomData),
                favoritedAt: item.createdAt ? new Date(item.createdAt) : new Date(),
              };
            }
            return null;
          })
          .filter((room): room is SavedRoom => room !== null);
      }
      
      console.log("Mapped rooms:", mappedRooms);
      setRooms(mappedRooms);
    } catch (error) {
      console.error("Error fetching saved rooms:", error);
      toast.error("Không thể tải danh sách phòng yêu thích");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRoom = async (roomId: string) => {
    setDeletingId(roomId);
    try {
      const { error } = await apiClient.removeFavorite(roomId);
      if (error) {
        toast.error("Không thể xóa phòng");
        return;
      }
      setRooms(rooms.filter((room) => room.id !== roomId));
      toast.success("Đã xóa phòng khỏi danh sách yêu thích");
    } catch (error) {
      console.error("Error removing room:", error);
      toast.error("Không thể xóa phòng");
    } finally {
      setDeletingId(null);
    }
  };

  const openBookingDialog = (room: SavedRoom) => {
    setBookingDialogRoom(room);
    setBookingTime("");
  };

  const handleConfirmBooking = async () => {
    if (!bookingDialogRoom) return;
    if (!bookingTime) {
      toast.error("Vui lòng chọn thời gian xem phòng");
      return;
    }
    setViewingRequestingId(bookingDialogRoom.id);
    try {
      const { error } = await apiClient.createViewingRequest(bookingDialogRoom.id, bookingTime);
      if (error) {
        toast.error(error.includes("already have a pending") ? "Đã có yêu cầu đang chờ phê duyệt cho phòng này" : "Gửi yêu cầu xem phòng thất bại");
        return;
      }
      toast.success("Đã gửi yêu cầu xem phòng cho chủ nhà!");
      setBookingDialogRoom(null);
    } catch (err) {
      console.error("Error creating viewing request:", err);
      toast.error("Không thể tạo yêu cầu xem phòng");
    } finally {
      setViewingRequestingId(null);
    }
  };

  const formatPrice = (price: number) =>
    `${(price / 1000000).toFixed(1).replace(".0", "")} triệu`;

  const timeAgo = (date: Date) => {
    const days = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    return `${days} ngày trước`;
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-6 w-6 text-destructive fill-current" />
            <h1 className="text-3xl font-bold">Phòng yêu thích của tôi</h1>
          </div>
          <p className="text-muted-foreground">
            Bạn đã lưu {rooms.length} phòng
          </p>
        </div>

        {/* Empty State */}
        {rooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 rounded-2xl text-center"
          >
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Chưa có phòng yêu thích</h3>
            <p className="text-muted-foreground mb-6">
              Hãy tìm kiếm và lưu các phòng mà bạn yêu thích
            </p>
            <Button onClick={() => navigate("/find-room")} className="rounded-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Tìm phòng ngay
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                  {/* Image */}
                  <div className="md:col-span-1">
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                      {room.images?.[0] ? (
                        <img
                          src={room.images[0]}
                          alt={room.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onClick={() => navigate(`/rooms/${room.id}`)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-muted-foreground">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:col-span-2 space-y-3">
                    {/* Title & Badge */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {room.title}
                        </h3>
                        {room.owner?.verified && (
                          <Badge className="bg-match-high text-white shrink-0">
                            Chính chủ
                          </Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(room.price)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /tháng
                        </span>
                      </p>
                    </div>

                    {/* Info */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {room.address}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {timeAgo(room.favoritedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {room.views || 0} lượt
                        </span>
                      </div>

                      {/* Quick Info */}
                      <div className="flex gap-2 text-sm">
                        {room.area > 0 && (
                          <span className="px-2 py-1 bg-muted rounded-md">
                            {room.area}m²
                          </span>
                        )}
                        <span className="px-2 py-1 bg-muted rounded-md">
                          {room.maxOccupants} người
                        </span>
                        {room.floor > 0 && (
                          <span className="px-2 py-1 bg-muted rounded-md">
                            Tầng {room.floor}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1 flex flex-col gap-2 justify-between">
                    <div className="space-y-2">
                      <Button
                        onClick={() => navigate(`/rooms/${room.id}`)}
                        className="w-full rounded-lg"
                        size="sm"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Xem chi tiết
                      </Button>
                      <Button
                        onClick={() => openBookingDialog(room)}
                        variant="secondary"
                        className="w-full rounded-lg"
                        size="sm"
                      >
                        <CalendarClock className="h-4 w-4 mr-2" />
                        Đặt lịch xem phòng
                      </Button>
                    </div>

                    <Button
                      onClick={() => handleRemoveRoom(room.id)}
                      disabled={deletingId === room.id}
                      variant="ghost"
                      className="w-full rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                      size="sm"
                    >
                      {deletingId === room.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang xóa...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={!!bookingDialogRoom} onOpenChange={(open) => !open && setBookingDialogRoom(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đặt lịch xem phòng</DialogTitle>
            <DialogDescription>
              {bookingDialogRoom?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn ngày và giờ xem phòng</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {bookingDialogRoom && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Địa chỉ:</strong> {bookingDialogRoom.address}</p>
                <p><strong>Giá:</strong> {formatPrice(bookingDialogRoom.price)}/tháng</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBookingDialogRoom(null)}>
              Hủy
            </Button>
            <Button
              onClick={handleConfirmBooking}
              disabled={!bookingTime || viewingRequestingId === bookingDialogRoom?.id}
            >
              {viewingRequestingId === bookingDialogRoom?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                "Xác nhận đặt lịch"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
