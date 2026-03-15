import type { ApiRoom } from '@/types/api';

/**
 * Represents a room as needed by the Landlord Dashboard UI.
 * This is a lightweight projection of ApiRoom for listing purposes.
 */
export interface LandlordRoom {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
}

/**
 * Maps an ApiRoom (backend MongoDB document) to a LandlordRoom (UI shape).
 * Handles field name differences: _id → id, createdAt → created_at.
 */
export function mapApiRoomToRoom(apiRoom: ApiRoom): LandlordRoom {
  return {
    id: apiRoom._id,
    title: apiRoom.title,
    price: apiRoom.price,
    status: apiRoom.status,
    created_at: apiRoom.createdAt,
  };
}
