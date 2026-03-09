import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { RoomCard } from "@/components/RoomCard";
import { RoomFilters, type RoomFiltersState } from "@/components/RoomFilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { mapApiRoomToUiRoom } from "@/utils/mappers";
import type { Room } from "@/types";

const DEFAULT_FILTERS: RoomFiltersState = {
  areas: [],
  priceRange: [1000000, 6000000],
  sizes: [],
  roomTypes: [],
  regulations: [],
  amenities: [],
  furniture: [],
};

export default function FindRoom() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roomFilters, setRoomFilters] =
    useState<RoomFiltersState>(DEFAULT_FILTERS);
  const [savedRooms, setSavedRooms] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getRooms({ status: "active" });

      if (error) {
        throw new Error(error);
      }
      setRooms(data?.rooms?.map(mapApiRoomToUiRoom) || []);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoom = (roomId: string) => {
    setSavedRooms((prev) =>
      prev.includes(roomId)
        ? prev.filter((id) => id !== roomId)
        : [...prev, roomId],
    );
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Price filter
      if (
        room.price < roomFilters.priceRange[0] ||
        room.price > roomFilters.priceRange[1]
      )
        return false;

      // Area filter
      if (roomFilters.areas.length > 0) {
        const hasMatchingArea = roomFilters.areas.some((areaId) => {
          if (areaId === "thach-hoa")
            return room.district?.includes("Thạch Hòa");
          if (areaId === "tan-xa") return room.district?.includes("Tân Xã");
          return false;
        });
        if (!hasMatchingArea) return false;
      }

      // Size filter
      if (roomFilters.sizes.length > 0) {
        const hasMatchingSize = roomFilters.sizes.some((sizeId) => {
          if (sizeId === "under-20") return room.area < 20;
          if (sizeId === "20-40") return room.area >= 20 && room.area <= 40;
          if (sizeId === "over-40") return room.area > 40;
          return false;
        });
        if (!hasMatchingSize) return false;
      }

      // Room type filter
      if (roomFilters.roomTypes.length > 0) {
        const hasMatchingType = roomFilters.roomTypes.some((typeId) => {
          return room.roomType?.toLowerCase().includes(typeId.replace("-", ""));
        });
        if (!hasMatchingType) return false;
      }

      // Regulations filter
      if (roomFilters.regulations.length > 0) {
        const hasMatchingRegulation = roomFilters.regulations.some((regId) => {
          if (regId === "shared-owner") return room.owner?.verified === true;
          if (regId === "pets")
            return room.amenities?.some(
              (a) =>
                a.toLowerCase().includes("pet") ||
                a.toLowerCase().includes("thú"),
            );
          return false;
        });
        if (!hasMatchingRegulation) return false;
      }

      // Amenities filter
      if (roomFilters.amenities.length > 0) {
        const amenitiesMap: { [key: string]: string[] } = {
          "smart-lock": ["khóa", "lock", "thông minh"],
          parking: ["xe", "parking", "để xe"],
          "fire-ext": ["cháy", "fire", "chữa"],
          "washing-machine": ["giặt", "máy"],
          elevator: ["thang máy", "elevator"],
          "drying-area": ["phơi", "quần áo"],
          "ev-charging": ["sạc", "xe điện"],
        };

        const hasMatchingAmenity = roomFilters.amenities.some((amenityId) => {
          const keywords = amenitiesMap[amenityId] || [];
          return room.amenities?.some((a) =>
            keywords.some((k) => a.toLowerCase().includes(k)),
          );
        });
        if (!hasMatchingAmenity) return false;
      }

      // Furniture filter
      if (roomFilters.furniture.length > 0) {
        const furnitureMap: { [key: string]: string[] } = {
          wardrobe: ["tủ", "wardrobe"],
          bed: ["giường", "bed"],
          "shoe-rack": ["giá", "giày"],
          desk: ["bàn", "học"],
          stove: ["bếp", "ga"],
        };

        const hasMatchingFurniture = roomFilters.furniture.some(
          (furnitureId) => {
            const keywords = furnitureMap[furnitureId] || [];
            return room.amenities?.some((a) =>
              keywords.some((k) => a.toLowerCase().includes(k)),
            );
          },
        );
        if (!hasMatchingFurniture) return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !room.title.toLowerCase().includes(query) &&
          !room.address.toLowerCase().includes(query) &&
          !room.district.toLowerCase().includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [searchQuery, roomFilters, rooms]);

  const formatPrice = (price: number) => {
    return `${(price / 1000000).toFixed(1).replace(".0", "")} tr`;
  };

  const handleClearFilters = () => {
    setRoomFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  return (
    <Layout>
      <div className="container py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tìm Phòng Trọ</h1>
            <p className="text-muted-foreground text-sm">
              {loading
                ? "Đang tải..."
                : `${filteredRooms.length} phòng phù hợp`}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar - Sticky */}
        <div className="sticky top-0 md:top-16 z-40 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên trọ, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-full bg-card border-border/50"
              />
            </div>
            <Button
              variant="default"
              size="icon"
              className="rounded-full"
              onClick={() => {
                // Trigger search (can add additional search logic here)
              }}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Room Filters - Always Visible */}
          <RoomFilters
            filters={roomFilters}
            onFiltersChange={setRoomFilters}
            onClear={handleClearFilters}
          />
        </div>

        {/* Room Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <RoomCard
                  room={room}
                  onSave={handleSaveRoom}
                  isSaved={savedRooms.includes(room.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground mb-4">
              Không tìm thấy phòng phù hợp với tiêu chí của bạn
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setRoomFilters(DEFAULT_FILTERS);
              }}
            >
              Xoá bộ lọc
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
