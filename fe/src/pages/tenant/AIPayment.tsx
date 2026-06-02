import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Zap,
  CreditCard,
  Smartphone,
  Building2,
  ArrowRight,
  Lock,
  Loader2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface AIPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  monthlyCredit: number;
  features: string[];
  popular?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const AI_PACKAGES: AIPackage[] = [
  {
    id: "basic",
    name: "Gói Basic",
    description: "Nhận 200 Knock Coin",
    price: 49000,
    monthlyCredit: 200,
    features: [
      "200 Knock Coin sử dụng ngay",
      "Giao dịch nhanh chóng",
      "Thanh toán an toàn",
      "Chat AI gợi ý phòng phù hợp",
      "Hỗ trợ giải đáp thắc mắc nhanh",
    ],
  },
  {
    id: "standard",
    name: "Gói Standard",
    description: "Nhận 450 Knock Coin",
    price: 99000,
    monthlyCredit: 450,
    features: [
      "450 Knock Coin (Tiết kiệm 20%)",
      "Giao dịch nhanh chóng",
      "Thanh toán an toàn",
      "Chat AI gợi ý phòng tân tiến",
      "Gợi ý bạn ở ghép ưu tiên",
      "Hỗ trợ ưu tiên 24/7",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Gói Premium",
    description: "Nhận 1000 Knock Coin",
    price: 199000,
    monthlyCredit: 1000,
    features: [
      "1000 Knock Coin (Hời nhất)",
      "Giao dịch nhanh chóng",
      "Thanh toán an toàn",
      "Chat AI Roomie không giới hạn",
      "Gợi ý bạn ở ghép tốt nhất",
      "Hoàn tiền nếu không hài lòng",
      "Giải đáp thắc mắc 24/7",
    ],
  },
];

export default function AIPayment() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success") {
      toast.success("Thanh toán thành công! Đang cập nhật số dư...");
      
      // PayOS webhooks can be slightly delayed. 
      // We try to refresh immediately, and then again after 2 and 5 seconds.
      refreshUser();
      const timer1 = setTimeout(() => refreshUser(), 2000);
      const timer2 = setTimeout(() => refreshUser(), 5000);

      // Remove query param to prevent re-triggering on manual refresh
      window.history.replaceState({}, "", window.location.pathname);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else if (status === "cancel") {
      toast.error("Bạn đã hủy thanh toán.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refreshUser]);

  const [selectedPackage, setSelectedPackage] = useState<string>("standard");
  const [selectedPayment, setSelectedPayment] = useState<string>("credit_card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  const currentPackage = AI_PACKAGES.find((p) => p.id === selectedPackage)!;

  const handleConfirmPayment = async () => {
    if (!agreedTerms) {
      toast.error("Vui lòng chấp nhận điều khoản và điều kiện");
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await apiClient.purchaseCoins(selectedPackage);
      if (error || !data) {
        toast.error(error || "Không thể tạo liên kết thanh toán");
        return;
      }

      toast.success(`Chuyển hướng tới PayOS...`);
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Không thể xử lý thanh toán. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Miễn phí";
    return `${price.toLocaleString("vi-VN")}₫`;
  };

  return (
    <Layout>
      <div className="container py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-6 w-6 text-accent" />
            <h1 className="text-3xl font-bold">Nạp Knock Coin</h1>
          </div>
          <p className="text-muted-foreground">
            Chọn gói nạp Coin để mở khóa thêm nhiều tính năng kết nối
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Danh sách gói dịch vụ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {AI_PACKAGES.map((pkg) => (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ y: -4 }}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={cn(
                      "glass-card p-6 rounded-2xl cursor-pointer transition-all relative overflow-hidden",
                      selectedPackage === pkg.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:shadow-lg",
                    )}
                  >
                    {pkg.popular && (
                      <Badge className="absolute top-4 right-4 bg-accent text-white">
                        Phổ biến
                      </Badge>
                    )}

                    <div className="mb-4">
                      <h3 className="text-lg font-semibold">{pkg.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="mb-4">
                      <p className="text-3xl font-bold text-primary">
                        {formatPrice(pkg.price)}
                      </p>
                      <p className="text-sm text-muted-foreground"></p>
                    </div>

                    <div className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {selectedPackage === pkg.id && (
                      <div className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Payment Method Selection removed as requested */}

            {/* Terms & Conditions */}
            <label className="flex items-start gap-3 p-4 glass-card rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="h-4 w-4 mt-1 accent-primary"
              />
              <div className="flex-1">
                <p className="text-sm">
                  Tôi đồng ý với{" "}
                  <button className="text-primary hover:underline">
                    điều khoản dịch vụ
                  </button>{" "}
                  và{" "}
                  <button className="text-primary hover:underline">
                    chính sách bảo mật
                  </button>
                </p>
              </div>
            </label>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 rounded-2xl sticky top-24 space-y-4">
              <h2 className="text-xl font-semibold">Tóm tắt đơn hàng</h2>

              {/* Package Details */}
              <div className="space-y-3 pb-4 border-b border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gói dịch vụ</span>
                  <span className="font-semibold">{currentPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Knock Coin nhận được
                  </span>
                  <span className="font-semibold">
                    {currentPackage.monthlyCredit} Coin
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kênh thanh toán</span>
                  <span className="font-semibold text-primary">
                    PayOS (Tự động)
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3 pb-4 border-b border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Giá gói</span>
                  <span>{formatPrice(currentPackage.price)}</span>
                </div>
                {currentPackage.price > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">VAT (10%)</span>
                      <span>
                        {formatPrice(Math.round(currentPackage.price * 0.1))}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Tổng cộng</span>
                      <span className="text-primary">
                        {formatPrice(Math.round(currentPackage.price * 1.1))}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4" />
                Thanh toán an toàn được bảo vệ
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleConfirmPayment}
                disabled={isProcessing || !agreedTerms}
                className="w-full rounded-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Tiến hành thanh toán
                  </>
                )}
              </Button>

              {currentPackage.price === 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Gói miễn phí không cần thanh toán
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-2xl font-bold mb-6">Câu hỏi thường gặp</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "Knock Coin dùng để làm gì?",
                a: "Bạn có thể dùng Knock Coin để mở khóa thông tin liên lạc của các bạn ở ghép tiềm năng (50 Coin/người) hoặc sử dụng các tính năng AI cao cấp trong tương lai.",
              },
              {
                q: "Coin có thời hạn sử dụng không?",
                a: "Không, Knock Coin của bạn sẽ được lưu giữ vĩnh viễn trong ví và không bị hết hạn cho đến khi bạn sử dụng hết.",
              },
              {
                q: "Sau khi nạp bao lâu thì nhận được Coin?",
                a: "Hệ thống nạp qua PayOS là hoàn toàn tự động. Thông thường bạn sẽ nhận được Coin ngay lập tức trong tài khoản sau khi giao dịch thành công.",
              },
              {
                q: "Tôi có thể hoàn tiền không?",
                a: "Chúng tôi hỗ trợ hoàn tiền trong trường hợp lỗi giao dịch hoặc hệ thống. Vui lòng liên hệ bộ phận hỗ trợ để được giải quyết nhanh nhất.",
              },
            ].map((item, idx) => (
              <div key={idx} className="glass-card p-4 rounded-xl space-y-2">
                <h3 className="font-semibold">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
