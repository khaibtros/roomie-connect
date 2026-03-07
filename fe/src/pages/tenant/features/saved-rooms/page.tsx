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
  FileText,
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

export default function SavedRooms() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading: authLoading } = useAuth();

  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [contractRequestingId, setContractRequestingId] = useState<string | null>(null);

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

    // Set up interval to refresh every 5 seconds for real-time updates
    const interval = setInterval(() => {
      fetchSavedRooms();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, role]);

  const fetchSavedRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getFavorites();

      if (error) {
        throw new Error(error);
      }

      // Debug logging
      console.log("Favorites API response:", data);

      // Handle both possible response structures
      const favoritesData = data?.favorites || data?.rooms || [];
      
      let mappedRooms: any[] = [];
      if (Array.isArray(favoritesData)) {
        mappedRooms = favoritesData
          .map((item: any) => {
            console.log("Processing favorite item:", item);
            
            // Item might be: 
            // 1. {room: {...room data...}}
            // 2. {...room data directly...}
            // 3. {roomId: {...room data...}}
            const roomData = item.room || item.roomId || item;
            
            console.log("Room data to map:", roomData);
            
            // Only map if we have valid room data with at least an id
            if (roomData && (roomData._id || roomData.id)) {
              return mapApiRoomToUiRoom(roomData);
            }
            return null;
          })
          .filter((room: any) => room !== null);
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

  const handleCreateContractRequest = async (room: any) => {
    setContractRequestingId(room.id);
    try {
      // TODO: Implement API call for creating contract request
      // const { error } = await apiClient.createContractRequest(room.id);
      // if (error) {
      //   toast.error("Không thể tạo yêu cầu hợp đồng");
      //   return;
      // }
      toast.success("Đã gửi yêu cầu hợp đồng cho chủ nhà");
      // Optionally navigate or refresh
    } catch (error) {
      console.error("Error creating contract request:", error);
      toast.error("Không thể tạo yêu cầu hợp đồng");
    } finally {
      setContractRequestingId(null);
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
                          {timeAgo(new Date(room.created_at || room.postedAt))}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {room.views || 0} lượt
                        </span>
                      </div>

                      {/* Quick Info */}
                      <div className="flex gap-2 text-sm">
                        <span className="px-2 py-1 bg-muted rounded-md">
                          {room.area}m²
                        </span>
                        <span className="px-2 py-1 bg-muted rounded-md">
                          {room.maxOccupants} người
                        </span>
                        <span className="px-2 py-1 bg-muted rounded-md">
                          Tầng {room.floor}
                        </span>
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
                        onClick={() => handleCreateContractRequest(room)}
                        disabled={contractRequestingId === room.id}
                        variant="secondary"
                        className="w-full rounded-lg"
                        size="sm"
                      >
                        {contractRequestingId === room.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Gửi yêu cầu hợp đồng
                          </>
                        )}
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
    </Layout>
  );
}
