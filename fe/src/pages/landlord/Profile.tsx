import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MessageCircle,
  CreditCard,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LandlordLayout from "@/components/layouts/LandlordLayout";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { AvatarUpload } from "@/components/AvatarUpload";

export default function LandlordProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    zalo: "",
    bank_name: "",
    bank_account: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
    // fetchProfile is defined below and stable – eslint-disable is safe here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getProfile();

      if (error) {
        throw new Error(error);
      }

      if (data?.user) {
        setProfile({
          full_name: data.user.fullName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          zalo: data.user.workplace || "",
          bank_name: data.user.bankName || "",
          bank_account: data.user.bankAccount || "",
          avatar_url: data.user.avatarUrl || "",
        });
      } else {
        setProfile({
          full_name: "",
          email: user?.email || "",
          phone: "",
          zalo: "",
          bank_name: "",
          bank_account: "",
          avatar_url: "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await apiClient.updateProfile({
        fullName: profile.full_name,
        phone: profile.phone,
        workplace: profile.zalo,
        bankName: profile.bank_name,
        bankAccount: profile.bank_account,
        avatarUrl: profile.avatar_url,
      });

      if (error) {
        throw new Error(error);
      }

      toast.success("Đã lưu thông tin hồ sơ");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Không thể lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin cá nhân và tài khoản
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Avatar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Ảnh đại diện</CardTitle>
              </CardHeader>
              <CardContent>
                <AvatarUpload
                  currentAvatarUrl={profile.avatar_url}
                  fallbackLabel={profile.full_name?.charAt(0)?.toUpperCase() || "U"}
                  onAvatarChange={(newUrl) =>
                    setProfile((prev) => ({ ...prev, avatar_url: newUrl }))
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin cá nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Họ và tên *</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) =>
                        setProfile({ ...profile, full_name: e.target.value })
                      }
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Số điện thoại
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="0912345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zalo">
                      <MessageCircle className="h-4 w-4 inline mr-1" />
                      Số Zalo
                    </Label>
                    <Input
                      id="zalo"
                      value={profile.zalo}
                      onChange={(e) =>
                        setProfile({ ...profile, zalo: e.target.value })
                      }
                      placeholder="0912345678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Thông tin ngân hàng
                </CardTitle>
                <CardDescription>
                  Để nhận thanh toán từ khách thuê
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Ngân hàng</Label>
                    <Input
                      id="bank_name"
                      value={profile.bank_name}
                      onChange={(e) =>
                        setProfile({ ...profile, bank_name: e.target.value })
                      }
                      placeholder="Vietcombank"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Số tài khoản</Label>
                    <Input
                      id="bank_account"
                      value={profile.bank_account}
                      onChange={(e) =>
                        setProfile({ ...profile, bank_account: e.target.value })
                      }
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </LandlordLayout>
  );
}
