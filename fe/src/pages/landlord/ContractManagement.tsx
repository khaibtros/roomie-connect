import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import LandlordLayout from "@/components/layouts/LandlordLayout";
import { toast } from "sonner";

interface Contract {
  id: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  roomTitle: string;
  roomPrice: number;
  requestDate: string;
  status: "pending" | "approved" | "rejected";
}

const statusConfig = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  approved: {
    label: "Đã phê duyệt",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Từ chối",
    color: "bg-red-100 text-red-800",
    icon: XCircle,
  },
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("vi-VN");
};

export default function ContractManagement() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getLandlordContracts();

      if (!error && data?.contracts) {
        setContracts(data.contracts);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      toast.error("Lỗi khi tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contract: Contract) => {
    try {
      setActionLoading(contract.id);
      const { error } = await apiClient.approveContract(contract.id);

      if (error) {
        toast.error("Lỗi phê duyệt hợp đồng");
        return;
      }

      toast.success("Phê duyệt hợp đồng thành công!");
      fetchContracts();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Lỗi khi phê duyệt hợp đồng");
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (contract: Contract) => {
    if (!rejectionReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    try {
      setActionLoading(contract.id);
      const { error } = await apiClient.rejectContract(contract.id, rejectionReason);

      if (error) {
        toast.error("Lỗi từ chối hợp đồng");
        return;
      }

      toast.success("Từ chối hợp đồng thành công");
      fetchContracts();
      setShowRejectDialog(false);
      setRejectionReason("");
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Lỗi khi từ chối hợp đồng");
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingContracts = contracts.filter((c) => c.status === "pending");
  const approvedContracts = contracts.filter((c) => c.status === "approved");
  const rejectedContracts = contracts.filter((c) => c.status === "rejected");

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Quản Lý Hợp Đồng</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Xem và quản lý các yêu cầu tạo hợp đồng từ người thuê trọ
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingContracts.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Chờ xử lý</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{approvedContracts.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Đã phê duyệt</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{rejectedContracts.length}</p>
                <p className="text-sm text-muted-foreground mt-2">Từ chối</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Contracts */}
        {pendingContracts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Yêu Cầu Chờ Xử Lý
            </h2>
            <div className="grid gap-4">
              {pendingContracts.map((contract) => (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Tên Người Thuê</p>
                            <p className="font-semibold">{contract.tenantName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-sm">{contract.tenantEmail}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Phòng</p>
                            <p className="font-semibold">{contract.roomTitle}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Giá Phòng</p>
                            <p className="font-semibold text-primary">
                              {formatCurrency(contract.roomPrice)}/tháng
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Chi Tiết
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Contracts */}
        {approvedContracts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Hợp Đồng Đã Phê Duyệt
            </h2>
            <div className="grid gap-4">
              {approvedContracts.map((contract) => (
                <Card key={contract.id} className="bg-green-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tên Người Thuê</p>
                          <p className="font-semibold">{contract.tenantName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phòng</p>
                          <p className="font-semibold">{contract.roomTitle}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày Phê Duyệt</p>
                          <p className="text-sm">{formatDate(contract.requestDate)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-600">Đã Phê Duyệt</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Contracts */}
        {rejectedContracts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Hợp Đồng Bị Từ Chối
            </h2>
            <div className="grid gap-4">
              {rejectedContracts.map((contract) => (
                <Card key={contract.id} className="bg-red-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Tên Người Thuê</p>
                          <p className="font-semibold">{contract.tenantName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phòng</p>
                          <p className="font-semibold">{contract.roomTitle}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ngày Từ Chối</p>
                          <p className="text-sm">{formatDate(contract.requestDate)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-red-600">Từ Chối</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {contracts.length === 0 && !loading && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Chưa có yêu cầu tạo hợp đồng nào
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi Tiết Yêu Cầu Hợp Đồng</DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-6">
              {/* Tenant Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Thông Tin Người Thuê</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tên</p>
                    <p className="font-medium">{selectedContract.tenantName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedContract.tenantEmail}</p>
                  </div>
                  {selectedContract.tenantPhone && (
                    <div>
                      <p className="text-muted-foreground">Điện Thoại</p>
                      <p className="font-medium">{selectedContract.tenantPhone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Room Info */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">Thông Tin Phòng</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Tên Phòng</p>
                    <p className="font-medium">{selectedContract.roomTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Giá Phòng</p>
                    <p className="font-medium text-primary">
                      {formatCurrency(selectedContract.roomPrice)}/tháng
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span>Trạng Thái:</span>
                <Badge
                  className={statusConfig[selectedContract.status as keyof typeof statusConfig].color}
                >
                  {statusConfig[selectedContract.status as keyof typeof statusConfig].label}
                </Badge>
              </div>

              {/* Actions */}
              {selectedContract.status === "pending" && (
                <div className="flex gap-3">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedContract)}
                    disabled={actionLoading !== null}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Phê Duyệt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={actionLoading !== null}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Từ Chối
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ Chối Yêu Cầu Hợp Đồng</DialogTitle>
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
                onClick={() =>
                  selectedContract && handleReject(selectedContract)
                }
                disabled={actionLoading !== null || !rejectionReason.trim()}
              >
                Xác Nhận Từ Chối
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </LandlordLayout>
  );
}
