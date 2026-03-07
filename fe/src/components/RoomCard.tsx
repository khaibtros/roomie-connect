import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { historyService } from "@/pages/tenant/features/history/services/history.service";
import {
  Heart,
  Phone,
  MapPin,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { Room } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface RoomCardProps {
  room: Room;
  onSave?: (roomId: string) => void;
  isSaved?: boolean;
}

export function RoomCard({ room, onSave, isSaved = false }: RoomCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [currentImage, setCurrentImage] = useState(0);
  const [saved, setSaved] = useState(isSaved);
  const [isLoading, setIsLoading] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % room.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage(
      (prev) => (prev - 1 + room.images.length) % room.images.length,
    );
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

    setIsLoading(true);
    try {
      if (saved) {
        // Remove from favorites
        const { error } = await apiClient.removeFavorite(room.id);
        if (error) {
          toast.error('Lỗi: ' + error);
          return;
        }
        setSaved(false);
        onSave?.(room.id);
        toast.success('Đã xóa phòng khỏi danh sách yêu thích');
      } else {
        // Add to favorites
        const { error } = await apiClient.addFavorite(room.id);
        if (error) {
          if (error.includes('already')) {
            setSaved(true);
            onSave?.(room.id);
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
        onSave?.(room.id);
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
      setIsLoading(false);
    }
  };

  const handleContact = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`https://zalo.me/${room.owner.phone}`, "_blank");
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1).replace(".0", "")} tr`;
    }
    return `${(price / 1000).toFixed(0)}k`;
  };

  const handleCardClick = () => {
    historyService.add({
      id: room.id,
      title: room.title,
      address: room.address,
      price: room.price,
      thumbnail: room.images[0] ?? "",
    });
  };

  return (
    <Link to={`/rooms/${room.id}`} onClick={handleCardClick}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="glass-card rounded-3xl overflow-hidden hover:shadow-elevated transition-all duration-300 cursor-pointer"
      >
        {/* Image Carousel */}
        <div className="relative aspect-[4/3] overflow-hidden group">
          <img
            src={room.images[currentImage]}
            alt={room.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Navigation Arrows */}
          {room.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {room.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImage(idx);
                    }}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      idx === currentImage ? "bg-white w-3" : "bg-white/60",
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {room.owner?.verified && (
              <Badge className="bg-match-high/90 text-white border-0 backdrop-blur-sm">
                <Check className="h-3 w-3 mr-1" />
                Chính chủ
              </Badge>
            )}
            {room.nearbyPlaces?.some(
              (p) => p.includes("FPT") || p.includes("ĐHQG"),
            ) && (
              <Badge className="bg-primary/90 text-primary-foreground border-0 backdrop-blur-sm">
                Gần trường
              </Badge>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors disabled:opacity-50"
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                saved ? "fill-destructive text-destructive" : "text-foreground",
              )}
            />
          </button>

          {/* Area badge */}
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
            <Maximize2 className="h-3 w-3" />
            {room.area}m²
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold line-clamp-2 flex-1 text-foreground">
              {room.title}
            </h3>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-primary">
                {formatPrice(room.price)}
              </p>
              <p className="text-xs text-muted-foreground">/tháng</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{room.address}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {room.amenities?.slice(0, 3).map((amenity) => (
              <span
                key={amenity}
                className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
              >
                {amenity}
              </span>
            ))}
            {room.amenities?.length > 3 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                +{(room.amenities?.length || 0) - 3}
              </span>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleContact}
              className="flex-1 rounded-full"
              size="sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Liên hệ Zalo
            </Button>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
