/**
 * RoomComparisonCard — renders a structured side-by-side (or stacked)
 * comparison of 2–4 rooms returned by the COMPARE_ROOMS AI intent.
 *
 * Design goals:
 *  - Fits inside an existing chat bubble (max-w-[80%] parent)
 *  - Responsive: side-by-side columns on sm+, stacked cards on mobile
 *  - Consistent with the KnockKnock shadcn/Tailwind theme
 *  - Shows only criteria that have actual data (no "N/A" fabrication)
 *  - Highlights the "best" value per numeric row
 */

import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  DollarSign,
  Home,
  Users,
  Zap,
  Droplets,
  Wifi,
  Check,
  ExternalLink,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoomComparisonData {
  id: string;
  title: string;
  price: number;
  deposit: number | null;
  area: number | null;
  capacity: number;
  address: string;
  district: string;
  images: string[];
  amenities: string[];
  electricityPrice: number | null;
  waterPrice: number | null;
  internetPrice: number | null;
  isFullyFurnished: boolean;
  status: string;
}

interface RoomComparisonCardProps {
  rooms: RoomComparisonData[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  const m = price / 1_000_000;
  return `${m % 1 === 0 ? m : m.toFixed(1)} triệu/th`;
}

function formatMillion(value: number): string {
  const m = value / 1_000_000;
  return `${m % 1 === 0 ? m : m.toFixed(1)} tr`;
}

function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

/**
 * Returns the index of the "best" (lowest) value in an array of numbers.
 * Returns -1 when all values are equal or there is only one value.
 */
function bestLowIndex(values: (number | null)[]): number {
  const actual = values.filter((v): v is number => v !== null);
  if (actual.length < 2) return -1;
  const min = Math.min(...actual);
  const winners = values.filter((v) => v === min);
  if (winners.length > 1) return -1; // tie — no highlighting
  return values.indexOf(min);
}

/**
 * Returns the index of the "best" (highest) value in an array.
 * Used for area, capacity.
 */
function bestHighIndex(values: (number | null)[]): number {
  const actual = values.filter((v): v is number => v !== null);
  if (actual.length < 2) return -1;
  const max = Math.max(...actual);
  const winners = values.filter((v) => v === max);
  if (winners.length > 1) return -1;
  return values.indexOf(max);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Header card for one room in the comparison table. */
function RoomHeader({ room, index }: { room: RoomComparisonData; index: number }) {
  const labels = ["A", "B", "C", "D"];
  return (
    <Link
      to={`/rooms/${room.id}`}
      className="group block hover:opacity-90 transition-opacity"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/60 bg-background">
        {/* Thumbnail */}
        <div className="relative h-28 bg-muted">
          {room.images[0] ? (
            <img
              src={room.images[0]}
              alt={room.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Home className="h-8 w-8 opacity-30" />
            </div>
          )}
          {/* Room label badge */}
          <span className="absolute top-2 left-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
            {labels[index]}
          </span>
          {/* Open link icon */}
          <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-4 w-4 text-white drop-shadow" />
          </span>
        </div>
        {/* Title + location */}
        <div className="p-2">
          <p className="text-xs font-semibold line-clamp-2 leading-snug">{room.title}</p>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
            <span className="line-clamp-1">{room.district}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/** A single criterion row in the comparison grid. */
function CriterionRow({
  label,
  icon,
  values,
  bestIndex,
  suffix,
}: {
  label: string;
  icon: React.ReactNode;
  values: (string | null)[];
  bestIndex?: number;
  suffix?: string;
}) {
  return (
    <tr className="border-t border-border/40">
      {/* Criterion label */}
      <td className="py-2 pr-2 text-[10px] text-muted-foreground font-medium align-middle whitespace-nowrap">
        <div className="flex items-center gap-1">
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </div>
      </td>
      {values.map((val, i) => (
        <td
          key={i}
          className={`py-2 px-1 text-[11px] text-center font-medium align-middle ${
            bestIndex === i
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-foreground"
          }`}
        >
          {val !== null ? (
            <span>
              {val}
              {suffix && <span className="text-muted-foreground ml-0.5">{suffix}</span>}
            </span>
          ) : (
            <span className="text-muted-foreground/50 text-[10px]">—</span>
          )}
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function RoomComparisonCard({ rooms }: RoomComparisonCardProps) {
  if (rooms.length < 2) return null;

  const prices = rooms.map((r) => r.price);
  const areas = rooms.map((r) => r.area);
  const deposits = rooms.map((r) => r.deposit);
  const capacities = rooms.map((r) => r.capacity);
  const electricities = rooms.map((r) => r.electricityPrice);
  const waters = rooms.map((r) => r.waterPrice);
  const internets = rooms.map((r) => r.internetPrice);

  const bestPriceIdx = bestLowIndex(prices);
  const bestAreaIdx = bestHighIndex(areas);
  const bestDepositIdx = bestLowIndex(deposits);
  const bestCapacityIdx = bestHighIndex(capacities);
  const bestElecIdx = bestLowIndex(electricities);
  const bestWaterIdx = bestLowIndex(waters);
  const bestInternetIdx = bestLowIndex(internets);

  // Only show utility rows if at least one room has data
  const hasDeposit = deposits.some((d) => d !== null);
  const hasElec = electricities.some((e) => e !== null);
  const hasWater = waters.some((w) => w !== null);
  const hasInternet = internets.some((n) => n !== null);

  const gridCols =
    rooms.length === 2
      ? "grid-cols-2"
      : rooms.length === 3
        ? "grid-cols-3"
        : "grid-cols-4";

  return (
    <div className="mt-3 rounded-xl border border-border/60 overflow-hidden bg-background/60 backdrop-blur-sm">
      {/* Comparison header */}
      <div className="px-3 py-2 bg-primary/5 border-b border-border/40 flex items-center gap-2">
        <span className="text-xs font-semibold text-primary">
          So sánh {rooms.length} phòng
        </span>
        <span className="text-[10px] text-muted-foreground">
          • Màu xanh = tốt hơn
        </span>
      </div>

      <div className="p-3">
        {/* Room header cards */}
        <div className={`grid ${gridCols} gap-2 mb-3`}>
          {rooms.map((room, i) => (
            <RoomHeader key={room.id} room={room} index={i} />
          ))}
        </div>

        {/* Comparison table */}
        <table className="w-full">
          <colgroup>
            <col className="w-16 sm:w-20" />
            {rooms.map((_, i) => (
              <col key={i} />
            ))}
          </colgroup>
          <tbody>
            {/* Price */}
            <CriterionRow
              label="Giá thuê"
              icon={<DollarSign className="h-3 w-3" />}
              values={rooms.map((r) => formatPrice(r.price))}
              bestIndex={bestPriceIdx}
            />

            {/* Area */}
            <CriterionRow
              label="Diện tích"
              icon={<Home className="h-3 w-3" />}
              values={rooms.map((r) => (r.area !== null ? `${r.area} m²` : null))}
              bestIndex={bestAreaIdx}
            />

            {/* Deposit */}
            {hasDeposit && (
              <CriterionRow
                label="Tiền cọc"
                icon={<DollarSign className="h-3 w-3" />}
                values={deposits.map((d) => (d !== null ? formatMillion(d) : null))}
                bestIndex={bestDepositIdx}
              />
            )}

            {/* Capacity */}
            <CriterionRow
              label="Sức chứa"
              icon={<Users className="h-3 w-3" />}
              values={rooms.map((r) => `${r.capacity} người`)}
              bestIndex={bestCapacityIdx}
            />

            {/* Electricity */}
            {hasElec && (
              <CriterionRow
                label="Giá điện"
                icon={<Zap className="h-3 w-3" />}
                values={electricities.map((e) => (e !== null ? formatVnd(e) + "/kWh" : null))}
                bestIndex={bestElecIdx}
              />
            )}

            {/* Water */}
            {hasWater && (
              <CriterionRow
                label="Giá nước"
                icon={<Droplets className="h-3 w-3" />}
                values={waters.map((w) => (w !== null ? formatVnd(w) + "/m³" : null))}
                bestIndex={bestWaterIdx}
              />
            )}

            {/* Internet */}
            {hasInternet && (
              <CriterionRow
                label="Internet"
                icon={<Wifi className="h-3 w-3" />}
                values={internets.map((n) => (n !== null ? formatVnd(n) + "/th" : null))}
                bestIndex={bestInternetIdx}
              />
            )}
          </tbody>
        </table>

        {/* Amenity section — per room badges */}
        <div className={`grid ${gridCols} gap-2 mt-3`}>
          {rooms.map((room) => (
            <div key={room.id}>
              {room.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {room.amenities.slice(0, 6).map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="text-[9px] px-1 py-0"
                    >
                      <Check className="h-2 w-2 mr-0.5" />
                      {label}
                    </Badge>
                  ))}
                  {room.amenities.length > 6 && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">
                      +{room.amenities.length - 6}
                    </Badge>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/50">
                  Chưa có tiện ích
                </span>
              )}
            </div>
          ))}
        </div>

        {/* View links */}
        <div className={`grid ${gridCols} gap-2 mt-3`}>
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/rooms/${room.id}`}
              className="text-[10px] text-primary hover:underline text-center block"
            >
              Xem chi tiết →
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
