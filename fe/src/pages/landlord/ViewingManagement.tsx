import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  CreditCard,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Ban,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import LandlordLayout from "@/components/layouts/LandlordLayout";
import { toast } from "sonner";
import type {
  ApiViewingRequest,
  ViewingStatus,
  DecisionStatus,
  ApiPayment,
} from "@/types/api";

// ---------------------------------------------------------------------------
// Local mapped type
// ---------------------------------------------------------------------------
interface ViewingItem {
  id: string;
  tenantId: string;
  roomTitle: string;
  roomAddress: string;
  roomPrice: number;
  scheduledTime: string;
  status: ViewingStatus;
  payment: ApiPayment | null;
  createdAt: string;
}

function mapApiViewingToItem(v: ApiViewingRequest): ViewingItem {
  return {
    id: v._id,
    tenantId: v.tenantId,
    roomTitle: v.roomInfo?.title || "",
    roomAddress: v.roomInfo?.address || "",
    roomPrice: v.roomInfo?.price || 0,
    scheduledTime: v.scheduledTime,
    status: v.status,
    payment: v.payment ?? null,
    createdAt: v.createdAt,
  };
}

// ---------------------------------------------------------------------------
// ViewingStatusBadge
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<
  ViewingStatus,
  { label: string; className: string; Icon: typeof Clock }
> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-yellow-100 text-yellow-800",
    Icon: Clock,
  },
  awaiting_payment: {
    label: "Chờ thanh toán",
    className: "bg-orange-100 text-orange-800",
    Icon: CreditCard,
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-green-100 text-green-800",
    Icon: CheckCircle2,
  },
  completed: {
    label: "Thành công",
    className: "bg-blue-100 text-blue-800",
    Icon: CheckCircle2,
  },
  failed: {
    label: "Không thành công",
    className: "bg-red-100 text-red-800",
    Icon: XCircle,
  },
};

function ViewingStatusBadge({ status }: { status: ViewingStatus }) {
  const { label, className, Icon } = STATUS_MAP[status];
  return (
    <Badge className={`inline-flex items-center gap-1 ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VIEWING_FEE = 400_000;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

const formatDateTime = (date: string) =>
  new Date(date).toLocaleString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ---------------------------------------------------------------------------
// PaymentButton
// ---------------------------------------------------------------------------
function PaymentButton({
  viewing,
  loading,
  onPay,
}: {
  viewing: ViewingItem;
  loading: boolean;
  onPay: (viewing: ViewingItem) => void;
}) {
  return (
    <Button
      className="bg-orange-600 hover:bg-orange-700"
      size="sm"
      disabled={loading}
      onClick={() => onPay(viewing)}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      Thanh toán {formatCurrency(VIEWING_FEE)}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// DecisionSection
// ---------------------------------------------------------------------------
function DecisionSection({
  viewing,
  loading,
  onDecision,
}: {
  viewing: ViewingItem;
  loading: boolean;
  onDecision: (viewing: ViewingItem, decision: DecisionStatus) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        className="bg-green-600 hover:bg-green-700"
        size="sm"
        disabled={loading}
        onClick={() => onDecision(viewing, "confirmed")}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ThumbsUp className="w-4 h-4 mr-2" />
        )}
        Chốt
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        className="border-red-400 text-red-600 hover:bg-red-50"
        onClick={() => onDecision(viewing, "rejected")}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <ThumbsDown className="w-4 h-4 mr-2" />
        )}
        Không chốt
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ViewingTable
// ---------------------------------------------------------------------------
function ViewingTable({
  viewings,
  actionLoadingId,
  onViewDetail,
  onApprove,
  onReject,
  onPay,
  onDecision,
}: {
  viewings: ViewingItem[];
  actionLoadingId: string | null;
  onViewDetail: (v: ViewingItem) => void;
  onApprove: (v: ViewingItem) => void;
  onReject: (v: ViewingItem) => void;
  onPay: (v: ViewingItem) => void;
  onDecision: (v: ViewingItem, d: DecisionStatus) => void;
}) {
  if (viewings.length === 0) return null;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Phòng</TableHead>
            <TableHead>Lịch hẹn</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {viewings.map((v) => {
            const isLoading = actionLoadingId === v.id;
            return (
              <TableRow key={v.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {v.roomTitle}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDateTime(v.scheduledTime)}
                </TableCell>
                <TableCell className="text-primary font-semibold">
                  {formatCurrency(v.roomPrice)}/tháng
                </TableCell>
                <TableCell>
                  <ViewingStatusBadge status={v.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {v.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={isLoading}
                          onClick={() => onApprove(v)}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-400 text-red-600 hover:bg-red-50"
                          disabled={isLoading}
                          onClick={() => onReject(v)}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Ban className="w-4 h-4" />
                          )}
                        </Button>
                      </>
                    )}

                    {v.status === "awaiting_payment" && (
                      <PaymentButton
                        viewing={v}
                        loading={isLoading}
                        onPay={onPay}
                      />
                    )}

                    {v.status === "confirmed" && (
                      <DecisionSection
                        viewing={v}
                        loading={isLoading}
                        onDecision={onDecision}
                      />
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetail(v)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ===========================================================================
// LandlordViewingPage
// ===========================================================================
export default function LandlordViewingPage() {
  const { user } = useAuth();
  const [viewings, setViewings] = useState<ViewingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Detail dialog
  const [selectedViewing, setSelectedViewing] = useState<ViewingItem | null>(
    null,
  );
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchViewings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getLandlordViewings();
      if (!error && data?.viewings) {
        setViewings(data.viewings.map(mapApiViewingToItem));
      }
    } catch (err) {
      console.error("Error fetching viewings:", err);
      toast.error("Lỗi khi tải danh sách yêu cầu xem phòng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchViewings();
    }
  }, [user, fetchViewings]);

  // -----------------------------------------------------------------------
  // Actions
  // -----------------------------------------------------------------------
  const handleApprove = async (viewing: ViewingItem) => {
    try {
      setActionLoadingId(viewing.id);
      const { error } = await apiClient.approveViewing(viewing.id);
      if (error) {
        toast.error("Lỗi phê duyệt yêu cầu xem phòng");
        return;
      }
      toast.success("Phê duyệt yêu cầu xem phòng thành công!");
      fetchViewings();
      setShowDetailDialog(false);
    } catch {
      toast.error("Lỗi khi phê duyệt yêu cầu");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectDialog = (viewing: ViewingItem) => {
    setSelectedViewing(viewing);
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!selectedViewing) return;
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setActionLoadingId(selectedViewing.id);
      const { error } = await apiClient.rejectViewing(
        selectedViewing.id,
        rejectionReason,
      );
      if (error) {
        toast.error("Lỗi từ chối yêu cầu xem phòng");
        return;
      }
      toast.success("Từ chối yêu cầu xem phòng thành công");
      fetchViewings();
      setShowRejectDialog(false);
      setRejectionReason("");
      setShowDetailDialog(false);
    } catch {
      toast.error("Lỗi khi từ chối yêu cầu");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePay = async (viewing: ViewingItem) => {
    try {
      setActionLoadingId(viewing.id);
      const { error } = await apiClient.payViewing(viewing.id);
      if (error) {
        toast.error("Lỗi thanh toán");
        return;
      }
      toast.success("Thanh toán thành công! Lịch xem phòng đã được xác nhận.");
      fetchViewings();
      setShowDetailDialog(false);
    } catch {
      toast.error("Lỗi khi thanh toán");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDecision = async (
    viewing: ViewingItem,
    decision: DecisionStatus,
  ) => {
    try {
      setActionLoadingId(viewing.id);
      const { error } = await apiClient.submitLandlordDecision(viewing.id, {
        decision,
      });
      if (error) {
        toast.error("Lỗi gửi quyết định");
        return;
      }
      toast.success(
        decision === "confirmed" ? "Đã chốt thành công!" : "Đã từ chối",
      );
      fetchViewings();
      setShowDetailDialog(false);
    } catch {
      toast.error("Lỗi khi gửi quyết định");
    } finally {
      setActionLoadingId(null);
    }
  };

  // -----------------------------------------------------------------------
  // Derived lists
  // -----------------------------------------------------------------------
  const pendingViewings = viewings.filter((v) => v.status === "pending");
  const awaitingPaymentViewings = viewings.filter(
    (v) => v.status === "awaiting_payment",
  );
  const confirmedViewings = viewings.filter((v) => v.status === "confirmed");
  const completedViewings = viewings.filter((v) => v.status === "completed");
  const failedViewings = viewings.filter((v) => v.status === "failed");

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <CalendarClock className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Quản Lý Lịch Xem Phòng</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Xem và quản lý các yêu cầu đặt lịch xem phòng từ người thuê trọ
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            {
              count: pendingViewings.length,
              label: "Chờ xử lý",
              color: "text-yellow-600",
            },
            {
              count: awaitingPaymentViewings.length,
              label: "Chờ thanh toán",
              color: "text-orange-600",
            },
            {
              count: confirmedViewings.length,
              label: "Đã xác nhận",
              color: "text-green-600",
            },
            {
              count: completedViewings.length,
              label: "Thành công",
              color: "text-blue-600",
            },
            {
              count: failedViewings.length,
              label: "Không thành công",
              color: "text-red-600",
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className={`text-3xl font-bold ${stat.color}`}>
                    {stat.count}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending viewings */}
        {pendingViewings.length > 0 && (
          <Section
            title="Yêu Cầu Chờ Xử Lý"
            icon={<Clock className="w-5 h-5 text-yellow-600" />}
          >
            <ViewingTable
              viewings={pendingViewings}
              actionLoadingId={actionLoadingId}
              onViewDetail={(v) => {
                setSelectedViewing(v);
                setShowDetailDialog(true);
              }}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onPay={handlePay}
              onDecision={handleDecision}
            />
          </Section>
        )}

        {/* Awaiting payment */}
        {awaitingPaymentViewings.length > 0 && (
          <Section
            title="Chờ Thanh Toán"
            icon={<CreditCard className="w-5 h-5 text-orange-600" />}
          >
            <ViewingTable
              viewings={awaitingPaymentViewings}
              actionLoadingId={actionLoadingId}
              onViewDetail={(v) => {
                setSelectedViewing(v);
                setShowDetailDialog(true);
              }}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onPay={handlePay}
              onDecision={handleDecision}
            />
          </Section>
        )}

        {/* Confirmed viewings */}
        {confirmedViewings.length > 0 && (
          <Section
            title="Đã Xác Nhận - Chờ Quyết Định"
            icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          >
            <ViewingTable
              viewings={confirmedViewings}
              actionLoadingId={actionLoadingId}
              onViewDetail={(v) => {
                setSelectedViewing(v);
                setShowDetailDialog(true);
              }}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onPay={handlePay}
              onDecision={handleDecision}
            />
          </Section>
        )}

        {/* Completed */}
        {completedViewings.length > 0 && (
          <Section
            title="Thành Công"
            icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
          >
            <ViewingTable
              viewings={completedViewings}
              actionLoadingId={actionLoadingId}
              onViewDetail={(v) => {
                setSelectedViewing(v);
                setShowDetailDialog(true);
              }}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onPay={handlePay}
              onDecision={handleDecision}
            />
          </Section>
        )}

        {/* Failed */}
        {failedViewings.length > 0 && (
          <Section
            title="Không Thành Công"
            icon={<XCircle className="w-5 h-5 text-red-600" />}
          >
            <ViewingTable
              viewings={failedViewings}
              actionLoadingId={actionLoadingId}
              onViewDetail={(v) => {
                setSelectedViewing(v);
                setShowDetailDialog(true);
              }}
              onApprove={handleApprove}
              onReject={openRejectDialog}
              onPay={handlePay}
              onDecision={handleDecision}
            />
          </Section>
        )}

        {/* Empty state */}
        {viewings.length === 0 && !loading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarClock className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Chưa có yêu cầu xem phòng nào
              </p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* Detail Dialog                                                     */}
      {/* ================================================================= */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Yêu Cầu Xem Phòng</DialogTitle>
          </DialogHeader>

          {selectedViewing && (
            <div className="space-y-6">
              {/* Room Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Thông Tin Phòng</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tên Phòng</p>
                    <p className="font-medium">{selectedViewing.roomTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{selectedViewing.roomAddress}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Giá Phòng</p>
                    <p className="font-medium text-primary">
                      {formatCurrency(selectedViewing.roomPrice)}/tháng
                    </p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Lịch Hẹn</h3>
                <p className="text-sm font-medium">
                  {formatDateTime(selectedViewing.scheduledTime)}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span>Trạng Thái:</span>
                <ViewingStatusBadge status={selectedViewing.status} />
              </div>

              {/* Status-specific actions */}
              {selectedViewing.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedViewing)}
                    disabled={actionLoadingId !== null}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Phê Duyệt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openRejectDialog(selectedViewing)}
                    disabled={actionLoadingId !== null}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Từ Chối
                  </Button>
                </div>
              )}

              {selectedViewing.status === "awaiting_payment" && (
                <PaymentButton
                  viewing={selectedViewing}
                  loading={actionLoadingId === selectedViewing.id}
                  onPay={handlePay}
                />
              )}

              {selectedViewing.status === "confirmed" && (
                <DecisionSection
                  viewing={selectedViewing}
                  loading={actionLoadingId === selectedViewing.id}
                  onDecision={handleDecision}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* Reject Dialog                                                     */}
      {/* ================================================================= */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ Chối Yêu Cầu Xem Phòng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Lý Do Từ Chối
              </label>
              <Textarea
                placeholder="Nhập lý do từ chối yêu cầu..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
              >
                Hủy
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleReject}
                disabled={
                  actionLoadingId !== null || !rejectionReason.trim()
                }
              >
                {actionLoadingId ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Xác Nhận Từ Chối
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LandlordLayout>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {children}
    </motion.div>
  );
}
