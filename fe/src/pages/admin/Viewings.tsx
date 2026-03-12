import { useState, useEffect, useCallback } from "react";
import {
  CalendarClock,
  Clock,
  Loader2,
  RefreshCw,
  Ban,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminLayout from "@/layouts/AdminLayout";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import type {
  AdminViewingDTO,
  ViewingStatus,
  PaymentStatus,
  DecisionStatus,
  RefundStatus,
} from "@/types/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
// Status badge components
// ---------------------------------------------------------------------------
const STATUS_MAP: Record<ViewingStatus, { label: string; className: string }> =
  {
    pending: {
      label: "Chờ duyệt",
      className: "bg-yellow-100 text-yellow-800",
    },
    awaiting_payment: {
      label: "Chờ chủ trọ thanh toán",
      className: "bg-orange-100 text-orange-800",
    },
    confirmed: {
      label: "Đã xác nhận",
      className: "bg-green-100 text-green-800",
    },
    completed: {
      label: "Thành công",
      className: "bg-blue-100 text-blue-800",
    },
    failed: {
      label: "Không thành công",
      className: "bg-red-100 text-red-800",
    },
  };

function ViewingStatusBadge({ status, rejectionReason }: { status: ViewingStatus; rejectionReason?: string | null }) {
  if (status === "failed" && rejectionReason) {
    return <Badge className="bg-orange-100 text-orange-800">Landlord đã hủy</Badge>;
  }
  const cfg = STATUS_MAP[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

function PaymentBadge({
  status,
}: {
  status: PaymentStatus | "none";
}) {
  if (status === "none") return null;
  const map: Record<PaymentStatus, { label: string; className: string }> = {
    pending: { label: "Chờ", className: "bg-yellow-100 text-yellow-800" },
    success: {
      label: "Thành công",
      className: "bg-green-100 text-green-800",
    },
    failed: { label: "Thất bại", className: "bg-red-100 text-red-800" },
    refunded: {
      label: "Đã hoàn tiền",
      className: "bg-gray-100 text-gray-800",
    },
  };
  const cfg = map[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

function DecisionBadge({
  decision,
}: {
  decision: DecisionStatus | null;
}) {
  if (decision === null)
    return <Badge className="bg-gray-100 text-gray-600">Chưa quyết định</Badge>;
  if (decision === "confirmed")
    return <Badge className="bg-green-100 text-green-800">Đã chốt</Badge>;
  return <Badge className="bg-red-100 text-red-800">Không chốt</Badge>;
}

function RefundBadge({
  status,
}: {
  status: RefundStatus | "none";
}) {
  if (status === "none") return null;
  const map: Record<RefundStatus, { label: string; className: string }> = {
    pending: { label: "Chờ xử lý", className: "bg-yellow-100 text-yellow-800" },
    approved: {
      label: "Đã duyệt",
      className: "bg-green-100 text-green-800",
    },
    rejected: { label: "Từ chối", className: "bg-red-100 text-red-800" },
  };
  const cfg = map[status];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ---------------------------------------------------------------------------
// Summary cards
// ---------------------------------------------------------------------------
interface SummaryItem {
  label: string;
  count: number;
  color: string;
}

function SummaryCards({ viewings }: { viewings: AdminViewingDTO[] }) {
  const items: SummaryItem[] = [
    {
      label: "Tổng số yêu cầu",
      count: viewings.length,
      color: "text-slate-700",
    },
    {
      label: "Đang chờ thanh toán",
      count: viewings.filter((v) => v.status === "awaiting_payment").length,
      color: "text-orange-600",
    },
    {
      label: "Đã xác nhận",
      count: viewings.filter((v) => v.status === "confirmed").length,
      color: "text-green-600",
    },
    {
      label: "Thành công",
      count: viewings.filter((v) => v.status === "completed").length,
      color: "text-blue-600",
    },
    {
      label: "Không thành công",
      count: viewings.filter((v) => v.status === "failed" && !v.rejectionReason).length,
      color: "text-red-600",
    },
    {
      label: "Landlord đã hủy",
      count: viewings.filter((v) => v.status === "failed" && !!v.rejectionReason).length,
      color: "text-orange-600",
    },
    {
      label: "Đang chờ hoàn tiền",
      count: viewings.filter((v) => v.refundStatus === "pending").length,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className={`text-3xl font-bold ${item.color}`}>{item.count}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {item.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail dialog
// ---------------------------------------------------------------------------
function ViewingDetailDialog({
  viewing,
  open,
  onOpenChange,
}: {
  viewing: AdminViewingDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!viewing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu xem phòng</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Phòng</p>
              <p className="font-medium">{viewing.room.title}</p>
              <p className="text-muted-foreground text-xs">
                {viewing.room.address}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Giá</p>
              <p className="font-medium text-primary">
                {formatCurrency(viewing.room.price)}/tháng
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Chủ trọ</p>
              <p className="font-medium">{viewing.landlord.fullName}</p>
              <p className="text-xs">{viewing.landlord.email}</p>
              <p className="text-xs">{viewing.landlord.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Người thuê</p>
              <p className="font-medium">{viewing.tenant.fullName}</p>
              <p className="text-xs">{viewing.tenant.email}</p>
              <p className="text-xs">{viewing.tenant.phone}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Lịch hẹn</p>
              <p className="font-medium">
                {formatDateTime(viewing.scheduledTime)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Trạng thái</p>
              <ViewingStatusBadge status={viewing.status} rejectionReason={viewing.rejectionReason} />
              {viewing.rejectionReason && (
                <p className="text-sm text-red-600 mt-1">
                  Lý do từ chối: {viewing.rejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminViewings() {
  const [viewings, setViewings] = useState<AdminViewingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedViewing, setSelectedViewing] =
    useState<AdminViewingDTO | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchViewings = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getAdminViewings();
      if (error) {
        toast.error("Không thể tải danh sách xem phòng");
        return;
      }
      setViewings(data?.viewings ?? []);
    } catch {
      toast.error("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchViewings();
  }, [fetchViewings]);

  const handleApproveRefund = async (refundId: string) => {
    setActionLoading(refundId);
    try {
      const { error } = await apiClient.approveRefund(refundId);
      if (error) {
        toast.error("Không thể duyệt hoàn tiền");
        return;
      }
      toast.success("Đã duyệt hoàn tiền");
      fetchViewings();
    } catch {
      toast.error("Lỗi khi duyệt hoàn tiền");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    setActionLoading(refundId);
    try {
      const { error } = await apiClient.rejectRefund(refundId);
      if (error) {
        toast.error("Không thể từ chối hoàn tiền");
        return;
      }
      toast.success("Đã từ chối hoàn tiền");
      fetchViewings();
    } catch {
      toast.error("Lỗi khi từ chối hoàn tiền");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <CalendarClock className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">
                Theo dõi tình hình xem phòng
              </h1>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchViewings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Summary cards */}
        <SummaryCards viewings={viewings} />

        {/* Table */}
        {viewings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CalendarClock className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Chưa có yêu cầu xem phòng nào
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Ảnh</TableHead>
                  <TableHead>Tên phòng</TableHead>
                  <TableHead>Thông tin phòng</TableHead>
                  <TableHead>Chủ trọ</TableHead>
                  <TableHead>Người thuê</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Landlord</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Hoàn tiền</TableHead>
                  <TableHead className="text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {viewings.map((v) => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedViewing(v);
                        setShowDetail(true);
                      }}
                    >
                      {/* Room image */}
                      <TableCell>
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                          {v.room.imageUrl ? (
                            <img
                              src={v.room.imageUrl}
                              alt={v.room.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Room name */}
                      <TableCell className="font-medium max-w-[150px] truncate">
                        {v.room.title}
                      </TableCell>

                      {/* Room info */}
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          <p className="text-primary font-semibold">
                            {formatCurrency(v.room.price)}/tháng
                          </p>
                          <p className="text-muted-foreground text-xs truncate max-w-[160px]">
                            {v.room.address}
                          </p>
                          <p className="text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(v.scheduledTime)}
                          </p>
                        </div>
                      </TableCell>

                      {/* Landlord */}
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          <p className="font-medium">
                            {v.landlord.fullName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {v.landlord.email}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {v.landlord.phone}
                          </p>
                        </div>
                      </TableCell>

                      {/* Tenant */}
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          <p className="font-medium">{v.tenant.fullName}</p>
                          <p className="text-muted-foreground text-xs">
                            {v.tenant.email}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {v.tenant.phone}
                          </p>
                        </div>
                      </TableCell>

                      {/* Payment status */}
                      <TableCell>
                        <PaymentBadge status={v.paymentStatus} />
                      </TableCell>

                      {/* Viewing status */}
                      <TableCell>
                        <div className="space-y-1">
                          <ViewingStatusBadge status={v.status} rejectionReason={v.rejectionReason} />
                          {v.rejectionReason && (
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]" title={v.rejectionReason}>
                              Lý do: {v.rejectionReason}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Landlord decision */}
                      <TableCell>
                        <DecisionBadge decision={v.landlordDecision} />
                      </TableCell>

                      {/* Tenant decision */}
                      <TableCell>
                        <DecisionBadge decision={v.tenantDecision} />
                      </TableCell>

                      {/* Refund status */}
                      <TableCell>
                        <RefundBadge status={v.refundStatus} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        {v.refundStatus === "pending" && v.refundId && (
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-8"
                              disabled={actionLoading === v.refundId}
                              onClick={() => handleApproveRefund(v.refundId!)}
                            >
                              {actionLoading === v.refundId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-400 text-red-600 hover:bg-red-50 h-8"
                              disabled={actionLoading === v.refundId}
                              onClick={() => handleRejectRefund(v.refundId!)}
                            >
                              {actionLoading === v.refundId ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <ViewingDetailDialog
        viewing={selectedViewing}
        open={showDetail}
        onOpenChange={setShowDetail}
      />
    </AdminLayout>
  );
}
