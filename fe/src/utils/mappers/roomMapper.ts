import type { ApiRoom } from '@/types/api';

/**
 * Represents a room as needed by the Landlord Dashboard UI.
 * This is a lightweight projection of ApiRoom for listing purposes.
 */
export interface LandlordRoom {
  id: string;
  title: string;
  price: number;
  district: string;
  address: string;
  area: number | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  images: string[] | null;
  rejection_reason: string | null;
}

/**
 * Maps an ApiRoom (backend MongoDB document) to a LandlordRoom (UI shape).
 * Handles field name differences: _id → id, createdAt → created_at, etc.
 */
export function mapApiRoomToRoom(apiRoom: ApiRoom): LandlordRoom {
  return {
    id: apiRoom._id,
    title: apiRoom.title,
    price: apiRoom.price,
    district: apiRoom.district,
    address: apiRoom.address,
    area: apiRoom.area ?? null,
    status: apiRoom.status,
    created_at: apiRoom.createdAt,
    expires_at: apiRoom.expiresAt ?? null,
    images: apiRoom.images || null,
    rejection_reason: apiRoom.rejectionReason ?? null,
  };
}
