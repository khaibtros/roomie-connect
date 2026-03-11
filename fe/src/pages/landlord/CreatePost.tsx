import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Home,
  DollarSign,
  Zap,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LandlordLayout from "@/components/layouts/LandlordLayout";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

const steps = [
  { id: 1, title: "Vị trí", icon: MapPin },
  { id: 2, title: "Thông tin", icon: Home },
  { id: 3, title: "Chi phí", icon: DollarSign },
  { id: 4, title: "Tiện ích", icon: Zap },
  { id: 5, title: "Xác nhận", icon: CheckSquare },
];

const districts = [
  "Thạch Hòa",
  "Tân Xã",
  "Bình Yên",
  "Hạ Bằng",
  "Khu công nghệ cao",
];

const amenities = [
  { id: "elevator", label: "Thang máy" },
  { id: "fire_safety", label: "PCCC (Phòng cháy chữa cháy)", highlight: true },
  { id: "shared_washing", label: "Máy giặt chung" },
  { id: "private_washing", label: "Máy giặt riêng" },
  { id: "parking", label: "Chỗ để xe" },
  { id: "camera", label: "Camera an ninh" },
  { id: "pet_friendly", label: "Cho nuôi thú cưng" },
  { id: "shared_owner", label: "Chung chủ" },
  { id: "drying_area", label: "Khu phơi đồ" },
];

const furniture = [
  { id: "bed", label: "Giường" },
  { id: "wardrobe", label: "Tủ quần áo" },
  { id: "air_conditioner", label: "Điều hoà" },
  { id: "water_heater", label: "Nóng lạnh" },
  { id: "kitchen", label: "Bếp / Kệ bếp" },
  { id: "fridge", label: "Tủ lạnh" },
  { id: "fully_furnished", label: "Full nội thất" },
];

const POST_FEE = 50000;

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await apiClient.getWallet();

      if (!error && data?.wallet) {
        setWalletBalance(data.wallet.balance);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
    }
  };

  const [formData, setFormData] = useState({
    // Step 1
    district: "",
    address: "",
    // Step 2
    title: "",
    description: "",
    price: "",
    deposit: "",
    area: "",
    capacity: "1",
    // Step 3
    electricity_price: "3500",
    water_price: "100000",
    internet_price: "0",
    cleaning_fee: "0",
    parking_fee: "0",
    // Step 4
    amenities: [] as string[],
    furniture: [] as string[],
    images: [] as string[],
  });

  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (id: string) => {
    const newAmenities = formData.amenities.includes(id)
      ? formData.amenities.filter((a) => a !== id)
      : [...formData.amenities, id];
    handleChange("amenities", newAmenities);
  };

  const toggleFurniture = (id: string) => {
    const newFurniture = formData.furniture.includes(id)
      ? formData.furniture.filter((f) => f !== id)
      : [...formData.furniture, id];
    handleChange("furniture", newFurniture);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.district && formData.address;
      case 2:
        return formData.title && formData.price && formData.area;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (walletBalance < POST_FEE) {
      toast.error("Số dư không đủ! Vui lòng nạp thêm tiền vào ví.");
      return;
    }

    setLoading(true);

    try {
      // Create room post using API
      const roomPayload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        deposit: formData.deposit ? Number(formData.deposit) : null,
        area: formData.area ? Number(formData.area) : null,
        capacity: Number(formData.capacity),
        district: formData.district,
        address: formData.address,
        electricity_price: formData.electricity_price
          ? Number(formData.electricity_price)
          : null,
        water_price: formData.water_price
          ? Number(formData.water_price)
          : null,
        internet_price: formData.internet_price
          ? Number(formData.internet_price)
          : null,
        cleaning_fee: formData.cleaning_fee
          ? Number(formData.cleaning_fee)
          : null,
        parking_fee: formData.parking_fee
          ? Number(formData.parking_fee)
          : null,
        has_elevator: formData.amenities.includes("elevator"),
        has_fire_safety: formData.amenities.includes("fire_safety"),
        has_shared_washing: formData.amenities.includes("shared_washing"),
        has_private_washing: formData.amenities.includes("private_washing"),
        has_parking: formData.amenities.includes("parking"),
        has_security_camera: formData.amenities.includes("camera"),
        has_pet_friendly: formData.amenities.includes("pet_friendly"),
        has_shared_owner: formData.amenities.includes("shared_owner"),
        has_drying_area: formData.amenities.includes("drying_area"),
        has_bed: formData.furniture.includes("bed"),
        has_wardrobe: formData.furniture.includes("wardrobe"),
        has_air_conditioner: formData.furniture.includes("air_conditioner"),
        has_water_heater: formData.furniture.includes("water_heater"),
        has_kitchen: formData.furniture.includes("kitchen"),
        has_fridge: formData.furniture.includes("fridge"),
        is_fully_furnished: formData.furniture.includes("fully_furnished"),
        images: formData.images,
      };

      const { data: roomData, error: roomError } = await apiClient.createRoom(roomPayload);

      if (roomError) {
        if (roomError.includes("Active subscription required")) {
          toast.error("Vui lòng đăng ký gói cước để tiếp tục đăng tin phòng trọ.");
          navigate("/landlord/subscription");
          return;
        }
        throw new Error(roomError);
      }

      toast.success("Đăng tin thành công! Tin của bạn đang chờ duyệt.");
      navigate("/landlord/posts");
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Không thể đăng tin. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandlordLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Đăng tin mới</h1>
          <p className="text-muted-foreground mt-1">
            Điền đầy đủ thông tin để đăng tin cho thuê
          </p>
        </div>

        {/* Steps Progress */}
        <div className="flex w-full items-center mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? "flex-1" : ""}`}
            >
              <div className="relative flex flex-col items-center">
                <div
                  className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all z-10
                  ${
                    currentStep >= step.id
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                  }
                `}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span
                  className={`absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs hidden sm:block ${
                    currentStep >= step.id
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card className="mt-10">
            <CardHeader>
              <CardTitle>{steps[currentStep - 1].title}</CardTitle>
              <CardDescription>
                {currentStep === 1 && "Nhập địa chỉ chính xác của phòng trọ"}
                {currentStep === 2 && "Mô tả chi tiết về phòng trọ"}
                {currentStep === 3 && "Thông tin về các loại phí"}
                {currentStep === 4 && "Chọn tiện ích và nội thất có sẵn"}
                {currentStep === 5 && "Kiểm tra và xác nhận thông tin"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Location */}
              {currentStep === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Khu vực *</Label>
                    <Select
                      value={formData.district}
                      onValueChange={(v) => handleChange("district", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khu vực" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Địa chỉ cụ thể *</Label>
                    <Textarea
                      placeholder="Số nhà, ngõ, thôn..."
                      value={formData.address}
                      onChange={(e) => handleChange("address", e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Step 2: Room Info */}
              {currentStep === 2 && (
                <>
                  <div className="space-y-2">
                    <Label>Tiêu đề tin *</Label>
                    <Input
                      placeholder="VD: Studio khép kín full nội thất gần FPT"
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea
                      placeholder="Mô tả chi tiết về phòng..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Giá thuê (VNĐ/tháng) *</Label>
                      <Input
                        type="number"
                        placeholder="3000000"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiền cọc (VNĐ)</Label>
                      <Input
                        type="number"
                        placeholder="3000000"
                        value={formData.deposit}
                        onChange={(e) =>
                          handleChange("deposit", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Diện tích (m²) *</Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={formData.area}
                        onChange={(e) => handleChange("area", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số người tối đa</Label>
                      <Select
                        value={formData.capacity}
                        onValueChange={(v) => handleChange("capacity", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem key={n} value={n.toString()}>
                              {n} người
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3: Utilities */}
              {currentStep === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Giá điện (VNĐ/kWh)</Label>
                      <Input
                        type="number"
                        placeholder="3500"
                        value={formData.electricity_price}
                        onChange={(e) =>
                          handleChange("electricity_price", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Giá nước (VNĐ/người/tháng)</Label>
                      <Input
                        type="number"
                        placeholder="100000"
                        value={formData.water_price}
                        onChange={(e) =>
                          handleChange("water_price", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Internet (VNĐ/tháng)</Label>
                      <Input
                        type="number"
                        placeholder="0 = Miễn phí"
                        value={formData.internet_price}
                        onChange={(e) =>
                          handleChange("internet_price", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phí vệ sinh (VNĐ/tháng)</Label>
                      <Input
                        type="number"
                        placeholder="0 = Miễn phí"
                        value={formData.cleaning_fee}
                        onChange={(e) =>
                          handleChange("cleaning_fee", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phí gửi xe (VNĐ/tháng)</Label>
                    <Input
                      type="number"
                      placeholder="0 = Miễn phí"
                      value={formData.parking_fee}
                      onChange={(e) =>
                        handleChange("parking_fee", e.target.value)
                      }
                    />
                  </div>
                </>
              )}

              {/* Step 4: Amenities */}
              {currentStep === 4 && (
                <>
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Tiện ích</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {amenities.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            formData.amenities.includes(item.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          } ${item.highlight ? "ring-2 ring-amber-400/50" : ""}`}
                          onClick={() => toggleAmenity(item.id)}
                        >
                          <Checkbox
                            checked={formData.amenities.includes(item.id)}
                            onCheckedChange={() => toggleAmenity(item.id)}
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                          {item.highlight && (
                            <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                              Quan trọng
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Nội thất</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {furniture.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${
                            formData.furniture.includes(item.id)
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted"
                          }`}
                          onClick={() => toggleFurniture(item.id)}
                        >
                          <Checkbox
                            checked={formData.furniture.includes(item.id)}
                            onCheckedChange={() => toggleFurniture(item.id)}
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 5: Confirmation */}
              {currentStep === 5 && (
                <>
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-xl space-y-3">
                      <h3 className="font-semibold">Thông tin phòng trọ</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-muted-foreground">Địa chỉ:</div>
                        <div>
                          {formData.address}, {formData.district}
                        </div>
                        <div className="text-muted-foreground">Giá thuê:</div>
                        <div className="font-medium text-primary">
                          {formatCurrency(Number(formData.price))}/tháng
                        </div>
                        <div className="text-muted-foreground">Diện tích:</div>
                        <div>{formData.area} m²</div>
                        <div className="text-muted-foreground">Sức chứa:</div>
                        <div>{formData.capacity} người</div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-xl">
                      <h3 className="font-semibold mb-3">Chi phí đăng tin</h3>
                      <div className="flex justify-between items-center">
                        <span>Phí đăng tin (30 ngày)</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(POST_FEE)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t">
                        <span>Số dư ví hiện tại</span>
                        <span className="font-semibold">
                          {formatCurrency(walletBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span>Sau khi đăng</span>
                        <span
                          className={`font-semibold ${walletBalance - POST_FEE < 0 ? "text-destructive" : "text-emerald-600"}`}
                        >
                          {formatCurrency(walletBalance - POST_FEE)}
                        </span>
                      </div>
                    </div>

                    {walletBalance < POST_FEE && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Số dư không đủ! Vui lòng nạp thêm{" "}
                          {formatCurrency(POST_FEE - walletBalance)} để đăng
                          tin.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              disabled={!canProceed()}
            >
              Tiếp tục
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={walletBalance < POST_FEE || loading}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {loading ? "Đang xử lý..." : "Thanh toán & Đăng tin"}
            </Button>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
}
