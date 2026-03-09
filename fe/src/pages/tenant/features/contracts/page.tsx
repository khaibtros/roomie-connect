import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  MapPin,
  Clock,
  ArrowRight,
  Loader2,
  XCircle,
  CheckCircle,
  HourglassIcon,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ContractItem {
  id: string;
  roomId: string;
  roomTitle: string;
  roomAddress: string;
  roomDistrict: string;
  roomPrice: number;
  roomDeposit?: number;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  requestDate: string;
}

function mapApiContractToItem(c: import("@/types/api").ApiContractRequest): ContractItem {
  return {
    id: c._id,
    roomId: c.roomInfo?.roomId || c.roomId,
    roomTitle: c.roomInfo?.title || "",
    roomAddress: c.roomInfo?.address || "",
    roomDistrict: c.roomInfo?.district || "",
    roomPrice: c.roomInfo?.price || 0,
    roomDeposit: c.roomInfo?.deposit,
    status: c.status,
    rejectionReason: c.rejectionReason,
    requestDate: c.createdAt,
  };
}

const STATUS_CONFIG = {
  pending: {
    label: "Đang chờ phê duyệt",
    color: "bg-white/10 text-white border border-white/30",
    icon: HourglassIcon,
  },
  approved: {
    label: "Đã phê duyệt",
    color: "bg-green-500/20 text-green-400 border border-green-500/40",
    icon: CheckCircle,
  },
  rejected: {
    label: "Không phê duyệt",
    color: "bg-red-500/20 text-red-400 border border-red-500/40",
    icon: XCircle,
  },
};

export default function TenantContracts() {
  const navigate = useNavigate();
  const { isAuthenticated, role, loading: authLoading } = useAuth();

  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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
    fetchContracts();
  }, [isAuthenticated, role, navigate]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getTenantContracts();
      if (error) throw new Error(error);
      setContracts((data?.contracts || []).map(mapApiContractToItem));
    } catch (err) {
      console.error("Error fetching contracts:", err);
      toast.error("Không thể tải danh sách hợp đồng");
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (contractId: string) => {
    setCancellingId(contractId);
    try {
      const { error } = await apiClient.cancelContractRequest(contractId);
      if (error) {
        toast.error("Không thể hủy yêu cầu hợp đồng");
        return;
      }
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      toast.success("Đã hủy yêu cầu hợp đồng");
    } catch (err) {
      console.error("Error cancelling contract:", err);
      toast.error("Không thể hủy yêu cầu hợp đồng");
    } finally {
      setCancellingId(null);
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

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  const pending = contracts.filter((c) => c.status === "pending");
  const approved = contracts.filter((c) => c.status === "approved");
  const rejected = contracts.filter((c) => c.status === "rejected");

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Theo dõi hợp đồng</h1>
          </div>
          <p className="text-muted-foreground">
            Bạn có {contracts.length} yêu cầu hợp đồng •{" "}
            <span className="text-yellow-400">{pending.length} đang chờ</span> •{" "}
            <span className="text-green-400">{approved.length} đã duyệt</span> •{" "}
            <span className="text-red-400">{rejected.length} từ chối</span>
          </p>
        </div>

        {/* Empty state */}
        {contracts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 rounded-2xl text-center"
          >
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Chưa có yêu cầu hợp đồng</h3>
            <p className="text-muted-foreground mb-6">
              Hãy tìm phòng ưng ý và gửi yêu cầu hợp đồng cho chủ nhà
            </p>
            <Button onClick={() => navigate("/saved-rooms")} className="rounded-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              Xem phòng đã lưu
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract, index) => {
              const cfg = STATUS_CONFIG[contract.status];
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                  className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-5 space-y-4">
                    {/* Top row: title + status badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {contract.roomTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {contract.roomAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeAgo(contract.requestDate)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${cfg.color}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </Badge>
                    </div>

                    {/* Price row */}
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Giá thuê: </span>
                        <span className="font-bold text-primary text-base">
                          {formatPrice(contract.roomPrice)}
                          <span className="text-xs font-normal text-muted-foreground">
                            /tháng
                          </span>
                        </span>
                      </div>
                      {contract.roomDeposit && (
                        <div>
                          <span className="text-muted-foreground">Đặt cọc: </span>
                          <span className="font-semibold">
                            {formatPrice(contract.roomDeposit)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rejection reason */}
                    {contract.status === "rejected" && contract.rejectionReason && (
                      <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-red-400 mb-0.5">
                            Lý do từ chối
                          </p>
                          <p className="text-sm text-red-300">{contract.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Approved message */}
                    {contract.status === "approved" && (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                        <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                        <p className="text-sm text-green-300">
                          Chủ nhà đã chấp thuận yêu cầu. Hãy liên hệ để hoàn tất thủ tục.
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                        onClick={() => navigate(`/rooms/${contract.roomId}`)}
                      >
                        <ArrowRight className="h-4 w-4 mr-1.5" />
                        Xem phòng
                      </Button>

                      {contract.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={cancellingId === contract.id}
                          onClick={() => handleCancel(contract.id)}
                          className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {cancellingId === contract.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                              Đang hủy...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-1.5" />
                              Hủy yêu cầu
                            </>
                          )}
                        </Button>
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
