import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  ArrowRight,
  Loader2,
  XCircle,
  CheckCircle,
  HourglassIcon,
  Trash2,
  CalendarClock,
  CreditCard,
  User,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ApiViewingRequest, ViewingStatus, DecisionStatus } from "@/types/api";

interface ViewingItem {
  id: string;
  roomId: string;
  roomTitle: string;
  roomAddress: string;
  roomDistrict: string;
  roomPrice: number;
  roomDeposit?: number;
  roomImage?: string | null;
  roomArea: number;
  roomCapacity: number;
  scheduledTime: string;
  status: ViewingStatus;
  tenantDecision?: DecisionStatus | null;
  rejectionReason?: string | null;
  landlordContact?: {
    fullName: string;
    dateOfBirth?: string;
    zalo?: string;
    bio?: string;
  };
  createdAt: string;
}

function mapApiViewingToItem(v: ApiViewingRequest): ViewingItem {
  return {
    id: v._id,
    roomId: v.roomInfo?.roomId || v.roomId,
    roomTitle: v.roomInfo?.title || "",
    roomAddress: v.roomInfo?.address || "",
    roomDistrict: v.roomInfo?.district || "",
    roomPrice: v.roomInfo?.price || 0,
    roomDeposit: v.roomInfo?.deposit,
    roomImage: v.roomImage || null,
    roomArea: v.roomArea || 0,
    roomCapacity: v.roomCapacity || 1,
    scheduledTime: v.scheduledTime,
    status: v.status,
    tenantDecision: v.tenantDecision ?? null,
    rejectionReason: v.rejectionReason ?? null,
    landlordContact: v.landlordContact,
    createdAt: v.createdAt,
  };
}

const STATUS_CONFIG: Record<ViewingStatus, { label: string; color: string; icon: typeof HourglassIcon }> = {
  pending: {
    label: "Đang chờ chủ trọ xác nhận",
    color: "bg-gray-100 text-gray-800 border border-gray-300",
    icon: HourglassIcon,
  },
  awaiting_payment: {
    label: "Chờ chủ trọ xác nhận",
    color: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    icon: CreditCard,
  },
  confirmed: {
    label: "Xác nhận đặt lịch thành công",
    color: "bg-green-100 text-green-800 border border-green-300",
    icon: CheckCircle,
  },
  completed: {
    label: "Hoàn thành",
    color: "bg-blue-100 text-blue-800 border border-blue-300",
    icon: CheckCircle,
  },
  failed: {
    label: "Thất bại",
    color: "bg-red-500/20 text-red-400 border border-red-500/40",
    icon: XCircle,
  },
};

export default function TenantViewings() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading: authLoading } = useAuth();

  const [viewings, setViewings] = useState<ViewingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [decisionLoadingId, setDecisionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login");
      return;
    }
    if (role !== "tenant") {
      toast.error("Chỉ người tìm trọ mới có thể xem trang này");
      navigate("/");
      return;
    }
    fetchViewings();
  }, [isAuthenticated, role, navigate]);

  const fetchViewings = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getMyViewings();
      if (error) throw new Error(error);
      setViewings((data?.viewings || []).map(mapApiViewingToItem));
    } catch (err) {
      console.error("Error fetching viewings:", err);
      toast.error("Không thể tải danh sách lịch xem phòng");
      setViewings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (viewingId: string) => {
    setCancellingId(viewingId);
    try {
      const { error } = await apiClient.cancelViewing(viewingId);
      if (error) {
        toast.error("Không thể hủy yêu cầu");
        return;
      }
      setViewings((prev) => prev.filter((v) => v.id !== viewingId));
      toast.success("Đã hủy yêu cầu xem phòng");
    } catch (err) {
      console.error("Error cancelling viewing:", err);
      toast.error("Không thể hủy yêu cầu");
    } finally {
      setCancellingId(null);
    }
  };

  const handleDecision = async (viewingId: string, decision: DecisionStatus) => {
    setDecisionLoadingId(viewingId);
    try {
      const { error } = await apiClient.submitTenantDecision(viewingId, { decision });
      if (error) {
        toast.error("Không thể gửi quyết định");
        return;
      }
      toast.success(
        decision === "confirmed" ? "Đã chốt thành công!" : "Không chốt thành công",
      );
      setViewings((prev) =>
        prev.map((v) =>
          v.id === viewingId
            ? { ...v, status: (decision === "confirmed" ? "completed" : "failed") as ViewingStatus, tenantDecision: decision }
            : v,
        ),
      );
    } catch (err) {
      console.error("Error submitting decision:", err);
      toast.error("Không thể gửi quyết định");
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const formatPrice = (price: number) =>
    `${(price / 1_000_000).toFixed(1).replace(".0", "")} triệu`;

  const timeAgo = (dateStr: string) => {
    const days = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return "Hôm nay";
    if (days === 1) return "Hôm qua";
    return `${days} ngày trước`;
  };

  const formatScheduledTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  const pending = viewings.filter((v) => v.status === "pending");
  const confirmed = viewings.filter((v) => v.status === "confirmed");
  const completed = viewings.filter((v) => v.status === "completed");
  const failed = viewings.filter((v) => v.status === "failed");

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CalendarClock className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Lịch xem phòng</h1>
          </div>
          <p className="text-muted-foreground">
            Bạn có {viewings.length} lịch xem phòng •{" "}
            <span className="text-yellow-400">{pending.length} đang chờ</span> •{" "}
            <span className="text-green-400">{confirmed.length} đã xác nhận</span> •{" "}
            <span className="text-blue-400">{completed.length} hoàn thành</span>
          </p>
        </div>

        {/* Empty state */}
        {viewings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 rounded-2xl text-center"
          >
            <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Chưa có lịch xem phòng</h3>
            <p className="text-muted-foreground mb-6">
              Hãy tìm phòng ưng ý và đặt lịch xem phòng
            </p>
            <Button onClick={() => navigate("/saved-rooms")} className="rounded-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Xem phòng đã lưu
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {viewings.map((viewing, index) => {
              const cfg = STATUS_CONFIG[viewing.status];
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={viewing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                    {/* Image */}
                    <div className="md:col-span-1">
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                        {viewing.roomImage ? (
                          <img
                            src={viewing.roomImage}
                            alt={viewing.roomTitle}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                            onClick={() => navigate(`/rooms/${viewing.roomId}`)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted">
                            <span className="text-muted-foreground text-sm">Chưa có ảnh</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="md:col-span-2 space-y-3">
                      {/* Title */}
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {viewing.roomTitle}
                        </h3>
                        <p className="text-2xl font-bold text-primary mt-1">
                          {formatPrice(viewing.roomPrice)}
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
                            {viewing.roomAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {timeAgo(viewing.createdAt)}
                          </span>
                        </div>

                        {/* Scheduled Time */}
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarClock className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            Lịch hẹn: {formatScheduledTime(viewing.scheduledTime)}
                          </span>
                        </div>

                        {/* Quick Info */}
                        <div className="flex gap-2 text-sm">
                          <span className="px-2 py-1 bg-muted rounded-md">
                            {viewing.roomArea}m²
                          </span>
                          <span className="px-2 py-1 bg-muted rounded-md">
                            {viewing.roomCapacity} người
                          </span>
                        </div>

                        {/* Status badge */}
                        <Badge
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </Badge>
                      </div>

                      {/* Confirmed or completed - show landlord contact */}
                      {(viewing.status === "confirmed" || viewing.status === "completed" || viewing.status === "failed") && viewing.landlordContact && (
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                            <p className="text-sm font-medium text-green-300">
                              Xác nhận đặt lịch thành công
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{viewing.landlordContact.fullName}</span>
                            </div>
                            {viewing.landlordContact.dateOfBirth && (
                              <div>
                                <span className="text-muted-foreground">Ngày sinh: </span>
                                {viewing.landlordContact.dateOfBirth}
                              </div>
                            )}
                            {viewing.landlordContact.zalo && (
                              <div>
                                <span className="text-muted-foreground">Zalo: </span>
                                {viewing.landlordContact.zalo}
                              </div>
                            )}
                            {viewing.landlordContact.bio && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">Giới thiệu: </span>
                                {viewing.landlordContact.bio}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Failed message */}
                      {viewing.status === "failed" && !viewing.tenantDecision && (
                        <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 space-y-1">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                            <p className="text-sm text-red-300">
                              Chủ trọ đã từ chối yêu cầu xem phòng
                            </p>
                          </div>
                          {viewing.rejectionReason && (
                            <p className="text-sm text-red-300/80 pl-6">
                              Lý do: {viewing.rejectionReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-1 flex flex-col gap-2 justify-between">
                      <div className="space-y-2">
                        <Button
                          onClick={() => navigate(`/rooms/${viewing.roomId}`)}
                          className="w-full rounded-lg"
                          size="sm"
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Button>

                        {/* Decision buttons for confirmed viewings / result for completed */}
                        {(viewing.status === "confirmed" || viewing.status === "completed" || viewing.status === "failed") && (() => {
                          if (viewing.tenantDecision != null) {
                            return viewing.tenantDecision === "confirmed" ? (
                              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
                                <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                                <p className="text-sm font-medium text-green-600">
                                  Cảm ơn bạn đã tin dùng KnockKnock
                                </p>
                              </div>
                            ) : (
                              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-center">
                                <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                                <p className="text-sm font-medium text-red-500">
                                  Không chốt thành công
                                </p>
                              </div>
                            );
                          }
                          if (viewing.status === "completed" || viewing.status === "failed") return null;
                          return (
                            <div className="space-y-2 pt-2">
                              <p className="text-xs text-muted-foreground font-medium text-center">
                                Bạn có muốn chốt phòng này?
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700 rounded-lg"
                                  disabled={decisionLoadingId === viewing.id}
                                  onClick={() => handleDecision(viewing.id, "confirmed")}
                                >
                                  {decisionLoadingId === viewing.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <ThumbsUp className="h-4 w-4 mr-1" />
                                      Chốt
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-red-400 text-red-500 hover:bg-red-50 rounded-lg"
                                  disabled={decisionLoadingId === viewing.id}
                                  onClick={() => handleDecision(viewing.id, "rejected")}
                                >
                                  {decisionLoadingId === viewing.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <ThumbsDown className="h-4 w-4 mr-1" />
                                      Không chốt
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {viewing.status === "pending" && (
                        <div className="flex justify-end pt-2">
                          <button
                            disabled={cancellingId === viewing.id}
                            onClick={() => handleCancel(viewing.id)}
                            className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                          >
                            {cancellingId === viewing.id ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang hủy...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4" />
                                Hủy yêu cầu
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
