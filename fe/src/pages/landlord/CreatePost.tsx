import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  Image as ImageIcon,
  X,
  Plus,
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
  { id: 5, title: "Hình ảnh", icon: ImageIcon },
  { id: 6, title: "Xác nhận", icon: CheckSquare },
];

const districts = [
  "Thạch Hòa",
  "Tân Xã",
  "Bình Yên",
  "Hạ Bằng",
  "Khu công nghệ cao",
];

const amenities = [
  { id: "elevator", label: "Thang máy", field: "has_elevator" },
  { id: "fire_safety", label: "PCCC (Phòng cháy chữa cháy)", field: "has_fire_safety" },
  { id: "shared_washing", label: "Máy giặt chung", field: "has_shared_washing" },
  { id: "private_washing", label: "Máy giặt riêng", field: "has_private_washing" },
  { id: "parking", label: "Chỗ để xe", field: "has_parking" },
  { id: "camera", label: "Camera an ninh", field: "has_security_camera" },
  { id: "pet_friendly", label: "Cho nuôi thú cưng", field: "has_pet_friendly" },
  { id: "shared_owner", label: "Chung chủ", field: "has_shared_owner" },
  { id: "drying_area", label: "Khu phơi đồ", field: "has_drying_area" },
];

const furniture = [
  { id: "bed", label: "Giường", field: "has_bed" },
  { id: "wardrobe", label: "Tủ quần áo", field: "has_wardrobe" },
  { id: "air_conditioner", label: "Điều hoà", field: "has_air_conditioner" },
  { id: "water_heater", label: "Nóng lạnh", field: "has_water_heater" },
  { id: "kitchen", label: "Bếp / Kệ bếp", field: "has_kitchen" },
  { id: "fridge", label: "Tủ lạnh", field: "has_fridge" },
  { id: "fully_furnished", label: "Full nội thất", field: "is_fully_furnished" },
];

const POST_FEE = 50000;

export default function CreatePost() {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(isEditMode);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

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
    // Step 5
    images: [] as string[],
  });

  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
      if (isEditMode) {
        fetchPostData();
      }
    }
  }, [user, id]);

  const fetchSubscriptionStatus = async () => {
    try {
      const { data, error } = await apiClient.getCurrentSubscription();
      if (!error && data?.subscription) {
        setHasActiveSubscription(data.subscription.status === "active");
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    }
  };

  const fetchPostData = async () => {
    if (!id) return;
    try {
      setFetchingData(true);
      const { data, error } = await apiClient.getRoom(id);
      if (error) throw new Error(error);

      if (data?.room) {
        const room = data.room as any;
        
        // Map amenities
        const activeAmenities: string[] = [];
        amenities.forEach(a => {
           if (room[a.field]) activeAmenities.push(a.id);
        });

        // Map furniture
        const activeFurniture: string[] = [];
        furniture.forEach(f => {
           if (room[f.field]) activeFurniture.push(f.id);
        });

        setFormData({
          district: room.district || "",
          address: room.address || "",
          title: room.title || "",
          description: room.description || "",
          price: room.price?.toString() || "",
          deposit: room.deposit?.toString() || "",
          area: room.area?.toString() || "",
          capacity: room.capacity?.toString() || "1",
          electricity_price: room.electricity_price?.toString() || "3500",
          water_price: room.water_price?.toString() || "100000",
          internet_price: room.internet_price?.toString() || "0",
          cleaning_fee: room.cleaning_fee?.toString() || "0",
          parking_fee: room.parking_fee?.toString() || "0",
          amenities: activeAmenities,
          furniture: activeFurniture,
          images: room.images || [],
        });
      }
    } catch (error) {
      console.error("Error fetching post data:", error);
      toast.error("Không thể tải thông tin tin đăng");
      navigate("/landlord/posts");
    } finally {
      setFetchingData(false);
    }
  };

  const postFee = hasActiveSubscription ? 0 : POST_FEE;

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formDataUpload = new FormData();
    for (let i = 0; i < files.length; i++) {
      formDataUpload.append("images", files[i]);
    }

    try {
      setUploadingImages(true);
      const { data, error } = await apiClient.uploadRoomImages(formDataUpload);
      if (error) throw new Error(error);

      if (data?.imageURLs) {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...data.imageURLs]
        }));
        toast.success(`Đã tải lên ${data.imageURLs.length} ảnh`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
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
      case 5:
        return formData.images.length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
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
        water_price: formData.water_price ? Number(formData.water_price) : null,
        internet_price: formData.internet_price
          ? Number(formData.internet_price)
          : null,
        cleaning_fee: formData.cleaning_fee
          ? Number(formData.cleaning_fee)
          : null,
        parking_fee: formData.parking_fee ? Number(formData.parking_fee) : null,
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

      let response;
      if (isEditMode && id) {
        response = await apiClient.updateRoom(id, roomPayload);
      } else {
        response = await apiClient.createRoom(roomPayload);
      }

      const { error: roomError } = response;

      if (roomError) {
        if (roomError.includes("Active subscription required")) {
          toast.error(
            "Vui lòng đăng ký gói cước để tiếp tục đăng tin phòng trọ.",
          );
          navigate("/landlord/subscription");
          return;
        }
        throw new Error(roomError);
      }

      toast.success(isEditMode ? "Cập nhật tin thành công!" : "Đăng tin thành công! Tin của bạn đang chờ duyệt.");
      navigate("/landlord/posts");
    } catch (error) {
      console.error("Error submitting post:", error);
      toast.error(isEditMode ? "Không thể cập nhật tin. Vui lòng thử lại." : "Không thể đăng tin. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{isEditMode ? "Chỉnh sửa tin" : "Đăng tin mới"}</h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Cập nhật thông tin phòng trọ của bạn" : "Điền đầy đủ thông tin để đăng tin cho thuê"}
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
                {currentStep === 5 && "Tải lên hình ảnh thực tế của phòng trọ"}
                {currentStep === 6 && "Kiểm tra và xác nhận thông tin"}
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
                        min="0"
                        placeholder="3000000"
                        value={formData.price}
                        onChange={(e) => handleChange("price", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tiền cọc (VNĐ)</Label>
                      <Input
                        type="number"
                        min="0"
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
                        min="0"
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
                        min="0"
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
                        min="0"
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
                        min="0"
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
                        min="0"
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
                      min="0"
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
                          }`}
                          onClick={() => toggleAmenity(item.id)}
                        >
                          <Checkbox
                            checked={formData.amenities.includes(item.id)}
                            onCheckedChange={() => toggleAmenity(item.id)}
                          />
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
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

              {/* Step 5: Images */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div 
                    className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium">Tải ảnh lên</p>
                    <p className="text-sm text-muted-foreground mt-1">Dung lượng tối đa 10MB mỗi ảnh</p>
                  </div>

                  {uploadingImages && (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary animate-pulse">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Đang tải ảnh lên...
                    </div>
                  )}

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative aspect-square group">
                          <img 
                            src={url} 
                            alt={`Room image ${index + 1}`} 
                            className="w-full h-full object-cover rounded-xl border"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                      >
                        <Plus className="h-6 w-6 mb-1" />
                        <span className="text-xs">Thêm ảnh</span>
                      </button>
                    </div>
                  )}
                  
                  {formData.images.length === 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Vui lòng tải lên ít nhất 1 hình ảnh của phòng trọ.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Step 6: Confirmation */}
              {currentStep === 6 && (
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
                        <div className="text-muted-foreground">Số lượng ảnh:</div>
                        <div>{formData.images.length} ảnh</div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted rounded-xl">
                      <h3 className="font-semibold mb-3">Chi phí đăng tin</h3>
                      <div className="flex justify-between items-center">
                        <span>Phí đăng tin</span>
                        <span className="font-semibold text-primary">
                          {hasActiveSubscription ? (
                            <span className="text-emerald-600">
                              Miễn phí (Đã đăng ký gói)
                            </span>
                          ) : (
                            "Theo gói"
                          )}
                        </span>
                      </div>
                    </div>
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
            disabled={currentStep === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(steps.length, prev + 1))}
              disabled={!canProceed() || uploadingImages}
            >
              Tiếp tục
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              {loading
                ? "Đang xử lý..."
                : isEditMode 
                  ? "Cập nhật tin"
                  : hasActiveSubscription
                    ? "Đăng tin"
                    : "Thanh toán & Đăng tin"}
            </Button>
          )}
        </div>
      </div>
    </LandlordLayout>
  );
}
