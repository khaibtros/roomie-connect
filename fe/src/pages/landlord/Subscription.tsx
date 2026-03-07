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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LandlordLayout from "@/components/layouts/LandlordLayout";
import { toast } from "sonner";

interface Package {
  type: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  recommended: boolean;
}

interface Subscription {
  id: string;
  packageType: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
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
            Chọn gói cước phù hợp để đăng tin phòng trọ
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
                    Ngày hết hạn: {new Date(currentSubscription.endDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600">Đang Active</Badge>
            </div>
          </motion.div>
        )}

        {/* Packages Grid */}
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
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                    ⭐ Phổ Biến Nhất
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
                <CardHeader className={pkg.recommended ? "bg-gradient-to-r from-amber-50 to-orange-50" : ""}>
                  <CardTitle className="text-xl">{pkg.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-6 pt-6">
                  {/* Price */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Giá</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(pkg.price)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      cho {pkg.duration}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        Thời hạn: {pkg.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        Đăng tin không giới hạn
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="text-sm">
                        Hỗ trợ 24/7
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
                        Đăng ký Ngay
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">ℹ️ Thông Tin Về Gói Cước</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>
              • Bạn cần có gói cước đang hoạt động để đăng tin phòng trọ
            </p>
            <p>
              • Gói cước sẽ tự động gia hạn nếu bạn không hủy
            </p>
            <p>
              • Bạn có thể nâng cấp gói cước bất kỳ lúc nào
            </p>
            <p>
              • Liên hệ hỗ trợ nếu có bất kỳ câu hỏi nào
            </p>
          </CardContent>
        </Card>
      </div>
    </LandlordLayout>
  );
}
