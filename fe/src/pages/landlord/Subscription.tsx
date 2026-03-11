import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LandlordLayout from "@/components/layouts/LandlordLayout";
import { toast } from "sonner";

interface Package {
  type: string;
  name: string;
  duration: string;
  maintenanceFee: number;
  commissionPerContract: number;
  description: string;
  recommended: boolean;
  features: {
    maintenanceDisplay: string;
    commission: string;
    postsPerRoom: string;
    continuousDisplay: boolean;
    freeEdit: boolean;
    verificationBadge: boolean;
    basicPriority: string | boolean;
    aiSuggestions: string | boolean;
    analytics: string;
  };
}

interface Subscription {
  id: string;
  packageType: string;
  startDate: string;
  endDate: string;
  maintenanceFee: number;
  commissionPerContract: number;
  status: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const monthlyRate = (annualFee: number) => {
  return Math.round(annualFee / 12);
};

export default function LandlordSubscription() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<Package[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }

    // Handle PayOS return redirect params
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      toast.success("Thanh toán thành công! Giao dịch đang được xử lý.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === "cancel") {
      toast.error("Bạn đã hủy thanh toán.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch packages
      const { data: packagesData } = await apiClient.getSubscriptionPackages();
      if (packagesData?.packages) {
        setPackages(packagesData.packages);
      }

      // Fetch current subscription
      const { data: subData } = await apiClient.getCurrentSubscription();
      if (subData?.subscription) {
        setCurrentSubscription(subData.subscription);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (packageType: string) => {
    try {
      setSubscribing(packageType);

      const { data, error } = await apiClient.subscribe(packageType);

      if (error) {
        toast.error("Đăng ký thất bại: " + error);
        return;
      }

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data?.subscription) {
        setCurrentSubscription(data.subscription);
        toast.success("Đăng ký gói cước thành công! 🎉");
        fetchData();
      }
    } catch (error) {
      toast.error("Lỗi khi đăng ký");
      console.error(error);
    } finally {
      setSubscribing(null);
    }
  };

  const isSubscriptionActive = currentSubscription && new Date(currentSubscription.endDate) > new Date();

  return (
    <LandlordLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gói Phí Duy Trì</h1>
          <p className="text-muted-foreground mt-2">
            Chọn gói cước phù hợp để đăng tin phòng trọ. Hệ thống Hybrid Revenue Model kết hợp phí duy trì tin đăng và hoa hồng giao dịch thành công.
          </p>
        </div>

        {/* Current Subscription Status */}
        {isSubscriptionActive && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-emerald-900">
                    Gói Cước Đang Hoạt Động
                  </h3>
                  <p className="text-sm text-emerald-700 mt-1">
                    Gói:{" "}
                    {packages.find((p) => p.type === currentSubscription.packageType)
                      ?.name || currentSubscription.packageType}
                  </p>
                  <p className="text-sm text-emerald-700">
                    Phí duy trì: {formatCurrency(currentSubscription.maintenanceFee)}
                  </p>
                  <p className="text-sm text-emerald-700">
                    Hoa hồng: {formatCurrency(currentSubscription.commissionPerContract)} / hợp đồng
                  </p>
                  <p className="text-sm text-emerald-700">
                    Hết hạn: {new Date(currentSubscription.endDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600">Đang Active</Badge>
            </div>
          </motion.div>
        )}

        {/* Tabs: Pricing Cards + Comparison  */}
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cards">Chọn Gói Phí Duy Trì</TabsTrigger>
            <TabsTrigger value="comparison">So Sánh Chi Tiết</TabsTrigger>
          </TabsList>

          {/* Pricing Cards Tab */}
          <TabsContent value="cards" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg, idx) => (
                <motion.div
                  key={pkg.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative ${pkg.recommended ? "md:scale-105" : ""}`}
                >
                  {pkg.recommended && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                        ⭐ Phổ Biến Nhất - Tiết Kiệm 17%
                      </Badge>
                    </div>
                  )}

                  <Card
                    className={`h-full flex flex-col ${
                      pkg.recommended
                        ? "border-2 border-amber-400 shadow-lg"
                        : "border border-border"
                    }`}
                  >
                    <CardHeader
                      className={pkg.recommended ? "bg-gradient-to-r from-amber-50 to-orange-50" : ""}
                    >
                      <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{pkg.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Thời hạn: {pkg.duration === "3 months" ? "3 tháng" : pkg.duration === "6 months" ? "6 tháng" : "12 tháng"}
                      </p>
                    </CardHeader>

                    <CardContent className="flex-1 flex flex-col gap-6 pt-6">
                      {/* Maintenance Fee */}
                      <div className="border-b pb-4">
                        <p className="text-sm text-muted-foreground mb-2">Phí Duy Trì Đăng Tin</p>
                        <p className="text-3xl font-bold text-primary">
                          {formatCurrency(pkg.maintenanceFee)}
                        </p>
                        {pkg.duration !== "3 months" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ≈ {formatCurrency(monthlyRate(pkg.maintenanceFee))}/tháng
                          </p>
                        )}
                      </div>

                      {/* Commission */}
                      <div className="border-b pb-4">
                        <p className="text-sm text-muted-foreground mb-2">Hoa Hồng / Hợp Đồng Thành Công</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {formatCurrency(pkg.commissionPerContract)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Được tính khi có hợp đồng thành công
                        </p>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm">
                            {pkg.features.postsPerRoom}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm">
                            Hiển thị liên tục trong thời gian đăng ký
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm">
                            Chỉnh sửa & cập nhật tin miễn phí
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm">
                            Huy hiệu xác thực chủ trọ
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm">
                            {typeof pkg.features.basicPriority === "string"
                              ? pkg.features.basicPriority
                              : "Ưu tiên hiển thị cơ bản"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm">
                            {typeof pkg.features.aiSuggestions === "string"
                              ? pkg.features.aiSuggestions
                              : "Gợi ý khách thuê bằng AI"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm">
                            Phân tích dữ liệu người thuê: {pkg.features.analytics}
                          </span>
                        </div>
                      </div>

                      {/* Subscribe Button */}
                      <Button
                        onClick={() => handleSubscribe(pkg.type)}
                        disabled={subscribing !== null}
                        className={`w-full mt-auto ${
                          pkg.recommended
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            : ""
                        }`}
                        variant={pkg.recommended ? "default" : "outline"}
                      >
                        {subscribing === pkg.type ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Đăng Ký Ngay
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>So Sánh Chi Tiết Các Gói Cước</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold">
                          Tính Năng
                        </th>
                        {packages.map((pkg) => (
                          <th 
                            key={pkg.type}
                            className={`text-center py-3 px-4 font-semibold ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.name}
                            {pkg.recommended && <div className="text-xs mt-1">Phổ biến</div>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {/* Maintenance Fee */}
                      <tr className="bg-blue-50 hover:bg-blue-100">
                        <td className="py-3 px-4 font-medium">
                          Phí Duy Trì Đăng Tin
                        </td>
                        {packages.map((pkg) => (
                          <td
                            key={`maint-${pkg.type}`}
                            className={`text-center py-3 px-4 font-semibold text-blue-600 ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.features.maintenanceDisplay}
                          </td>
                        ))}
                      </tr>

                      {/* Commission */}
                      <tr className="bg-orange-50 hover:bg-orange-100">
                        <td className="py-3 px-4 font-medium">
                          Hoa Hồng / 1 Hợp Đồng Thành Công
                        </td>
                        {packages.map((pkg) => (
                          <td
                            key={`comm-${pkg.type}`}
                            className={`text-center py-3 px-4 font-semibold text-orange-600 ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.features.commission}
                          </td>
                        ))}
                      </tr>

                      {/* Posts Per Room */}
                      <tr>
                        <td className="py-3 px-4">Số Tin Đăng Được Duy Trì</td>
                        {packages.map((pkg) => (
                          <td
                            key={`posts-${pkg.type}`}
                            className={`text-center py-3 px-4 ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.features.postsPerRoom}
                          </td>
                        ))}
                      </tr>

                      {/* Continuous Display */}
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4">
                          Hiển Thị Liên Tục Trong Thời Gian Đăng Ký
                        </td>
                        {packages.map((pkg) => (
                          <td
                            key={`display-${pkg.type}`}
                            className={`text-center py-3 px-4 ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.features.continuousDisplay ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Free Edit */}
                      <tr>
                        <td className="py-3 px-4">
                          Chỉnh Sửa & Cập Nhật Tin Miễn Phí
                        </td>
                        {packages.map((pkg) => (
                          <td
                            key={`edit-${pkg.type}`}
                            className={`text-center py-3 px-4 ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.features.freeEdit ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Verification Badge */}
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4">Huy Hiệu Xác Thực Chủ Trọ</td>
                        {packages.map((pkg) => (
                          <td
                            key={`badge-${pkg.type}`}
                            className={`text-center py-3 px-4 ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.features.verificationBadge ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Priority Display */}
                      <tr>
                        <td className="py-3 px-4">Ưu Tiên Hiển Thị</td>
                        {packages.map((pkg) => (
                          <td
                            key={`priority-${pkg.type}`}
                            className={`text-center py-3 px-4 text-sm ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {typeof pkg.features.basicPriority === "string"
                              ? pkg.features.basicPriority
                              : pkg.features.basicPriority ? "✔" : "—"}
                          </td>
                        ))}
                      </tr>

                      {/* AI Suggestions */}
                      <tr className="bg-gray-50">
                        <td className="py-3 px-4">Gợi Ý Khách Thuê Bằng AI</td>
                        {packages.map((pkg) => (
                          <td
                            key={`ai-${pkg.type}`}
                            className={`text-center py-3 px-4 text-sm ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {typeof pkg.features.aiSuggestions === "string"
                              ? pkg.features.aiSuggestions
                              : pkg.features.aiSuggestions ? "✔" : "—"}
                          </td>
                        ))}
                      </tr>

                      {/* Analytics */}
                      <tr>
                        <td className="py-3 px-4 font-medium">
                          Phân Tích Dữ Liệu Người Thuê
                        </td>
                        {packages.map((pkg) => (
                          <td
                            key={`analytics-${pkg.type}`}
                            className={`text-center py-3 px-4 font-semibold ${
                              pkg.recommended ? "bg-amber-50" : ""
                            }`}
                          >
                            {pkg.features.analytics}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Hybrid Revenue Model - Mô Hình Doanh Thu Kép
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              • <span className="font-semibold">Phí Duy Trì:</span> Đảm bảo dòng tiền ổn định để bạn duy trì các tin đăng liên tục
            </p>
            <p>
              • <span className="font-semibold">Hoa Hồng Giao Dịch:</span> Chỉ phát sinh khi có giá trị thực được tạo ra (hợp đồng thành công)
            </p>
            <p>
              • <span className="font-semibold">Công Bằng:</span> Bạn chỉ trả thêm phí khi có khách thuê thực sự, không phải trả ngay từ đầu
            </p>
            <p>
              • <span className="font-semibold">Minh Bạch:</span> Toàn bộ chi phí được hiển thị rõ ràng trước khi bạn đăng ký
            </p>
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
}
