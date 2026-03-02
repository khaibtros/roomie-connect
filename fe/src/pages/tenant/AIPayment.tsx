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
    id: "free",
    name: "Free",
    description: "Tính năng cơ bản",
    price: 0,
    monthlyCredit: 0,
    features: [
      "Tìm kiếm và lọc cơ bản",
      "Truy cập ưu tiên vào danh sách mới",
      "Trò chuyện AI giới hạn hàng ngày",
      "Tương thích tìm kiếm bạn phòng (2 lần/ngày)",
    ],
  },
  {
    id: "aiplus",
    name: "AI Plus - 1 Tháng",
    description: "Dùng thử AI không giới hạn",
    price: 49000,
    monthlyCredit: 30,
    features: [
      "Tìm kiếm và lọc cơ bản",
      "Truy cập ưu tiên vào danh sách mới",
      "Trò chuyện AI không giới hạn",
      "Tương thích tìm kiếm bạn phòng (3 lần/ngày)",
      "Lịch sử giá cho thuê",
    ],
    popular: true,
  },
  {
    id: "aipro",
    name: "AI Pro - 3 Tháng",
    description: "Tính năng nâng cao đầy đủ",
    price: 129000,
    monthlyCredit: 90,
    features: [
      "Tìm kiếm và lọc cơ bản",
      "Truy cập ưu tiên vào danh sách mới",
      "Trò chuyện AI không giới hạn + Tính năng nâng cao",
      "Tương thích tìm kiếm bạn phòng không giới hạn",
      "Lịch sử giá cho thuê",
    ],
  },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "credit_card",
    name: "Thẻ Tín Dụng/Ghi Nợ",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Visa, Mastercard, JCB",
  },
  {
    id: "bank_transfer",
    name: "Chuyển Khoản Ngân Hàng",
    icon: <Building2 className="h-5 w-5" />,
    description: "Chuyển khoản trực tiếp",
  },
  {
    id: "mobile",
    name: "Ví Điện Tử",
    icon: <Smartphone className="h-5 w-5" />,
    description: "Momo, ZaloPay, VNPay",
  },
];

export default function AIPayment() {
  const navigate = useNavigate();

  const [selectedPackage, setSelectedPackage] = useState<string>("aiplus");
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
      // TODO: Implement actual payment gateway integration
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(`Chuyển hướng tới cổng thanh toán ${selectedPackage}...`);

      // In real implementation, redirect to payment gateway
      // window.location.href = `/payment/process?package=${selectedPackage}&method=${selectedPayment}`;

      // For demo, navigate to success page
      setTimeout(() => {
        navigate("/tenant/ai-chat");
        toast.success(
          `Nâng cấp lên ${currentPackage.name} thành công! Bạn có thêm ${currentPackage.monthlyCredit} tin nhắn.`
        );
      }, 1000);
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
            <h1 className="text-3xl font-bold">AI Assistant Packages</h1>
          </div>
          <p className="text-muted-foreground">
            Chọn gói dịch vụ AI phù hợp với nhu cầu của bạn
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package List */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Danh sách gói dịch vụ</h2>
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
                        : "hover:shadow-lg"
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
                      <p className="text-sm text-muted-foreground">
                        
                      </p>
                    </div>

                    <div className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
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

            {/* Payment Method Selection */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={cn(
                      "glass-card p-4 rounded-xl cursor-pointer transition-all flex items-center gap-4",
                      selectedPayment === method.id
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted"
                    )}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={selectedPayment === method.id}
                      onChange={(e) => setSelectedPayment(e.target.value)}
                      className="h-4 w-4 accent-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-primary">{method.icon}</span>
                        <h3 className="font-semibold">{method.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

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
                  <span className="text-muted-foreground">Tin nhắn/tháng</span>
                  <span className="font-semibold">
                    {currentPackage.monthlyCredit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phương thức</span>
                  <span className="font-semibold">
                    {PAYMENT_METHODS.find((m) => m.id === selectedPayment)?.name}
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
                q: "Tôi có thể nâng cấp gói bất kỳ lúc nào không?",
                a: "Có, bạn có thể nâng cấp từ Free lên AI Plus hoặc AI Pro bất kỳ lúc nào. Phí sẽ được tính toán theo thời gian sử dụng.",
              },
              {
                q: "Gói AI Plus cung cấp bao lâu?",
                a: "Gói AI Plus cung cấp dịch vụ trong 1 tháng. Gói AI Pro cung cấp dịch vụ trong 3 tháng với giá rẻ hơn so với mua 3 lần AI Plus.",
              },
              {
                q: "Tôi có thể hoàn tiền không?",
                a: "Chúng tôi cung cấp hoàn tiền 100% trong 7 ngày nếu bạn không hài lòng với dịch vụ.",
              },
              {
                q: "Lượt trò chuyện AI không dùng hết có giữ được không?",
                a: "Các lượt trò chuyện sẽ được reset khi gói hết hạn. Chúng tôi khuyến nghị sử dụng hết các lượt trong thời hạn gói.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="glass-card p-4 rounded-xl space-y-2"
              >
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
