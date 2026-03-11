import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, User, CreditCard, Save } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schema for tenant
const tenantProfileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  university: z.string().optional(),
  workplace: z.string().optional(),
});

// Validation schema for landlord
const landlordProfileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải có 10 chữ số'),
  bankName: z.string().min(1, 'Vui lòng nhập tên ngân hàng').optional(),
  bankAccount: z.string().min(1, 'Vui lòng nhập số tài khoản').optional(),
});

type TenantFormData = z.infer<typeof tenantProfileSchema>;
type LandlordFormData = z.infer<typeof landlordProfileSchema>;

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, role, isAuthenticated, loading: authLoading, refreshUser } = useAuth();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [university, setUniversity] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Vui lòng đăng nhập để chỉnh sửa hồ sơ');
      navigate('/auth/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Load user data on mount
  useEffect(() => {
    if (user && !authLoading) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAvatarUrl(user.avatarUrl || '');
      if (role === 'tenant') {
        setUniversity(user.university || '');
        setWorkplace(user.workplace || '');
      } else if (role === 'landlord') {
        setBankName(user.bankName || '');
        setBankAccount(user.bankAccount || '');
      }
    }
  }, [user, role, authLoading]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 2MB');
      return;
    }

    if (!file.type.match(/^image\//)) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatarUrl(dataUrl);
        toast.success('Tải ảnh lên thành công');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
      setUploading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    let validationResult;

    if (role === 'tenant') {
      validationResult = tenantProfileSchema.safeParse({
        fullName,
        phone,
        university: university || undefined,
        workplace: workplace || undefined,
      } as TenantFormData);
    } else {
      validationResult = landlordProfileSchema.safeParse({
        fullName,
        phone,
        bankName: bankName || undefined,
        bankAccount: bankAccount || undefined,
      } as LandlordFormData);
    }

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    await handleSave(validationResult.data);
  };

  const handleSave = async (data: TenantFormData | LandlordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await apiClient.updateProfile({ ...data, avatarUrl });

      if (error) {
        toast.error('Lỗi: ' + error);
        return;
      }

      // Refresh user data from backend
      await refreshUser();

      toast.success('Hồ sơ đã được cập nhật thành công!');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Không thể cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  return (
    <Layout>
      <div className="container py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-muted-foreground text-sm">
            Quản lý thông tin cá nhân và tài khoản
          </p>
        </div>

        <form onSubmit={validateAndSubmit}>
          {/* Top row: Avatar + Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 mb-6">
            {/* Avatar Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="font-semibold mb-4">Ảnh đại diện</h3>
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                fallbackLabel={fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                onAvatarChange={(newUrl) => {
                  setAvatarUrl(newUrl);
                  refreshUser();
                }}
              />
            </motion.div>

            {/* Personal Info Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Thông tin cá nhân</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">Họ và tên *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nhập họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={errors.fullName ? 'border-destructive' : ''}
                    disabled={isLoading}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">Số điện thoại</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Nhập số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className={errors.phone ? 'border-destructive' : ''}
                    disabled={isLoading}
                    maxLength={10}
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive">{errors.phone}</p>
                  )}
                </div>

                {/* Tenant: Zalo = phone (or university) */}
                {role === 'tenant' && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="university">Trường Đại Học</Label>
                      <Input
                        id="university"
                        type="text"
                        placeholder="Nhập tên trường"
                        value={university}
                        onChange={(e) => setUniversity(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="workplace">Nơi Làm Việc</Label>
                      <Input
                        id="workplace"
                        type="text"
                        placeholder="Nhập nơi làm việc"
                        value={workplace}
                        onChange={(e) => setWorkplace(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Bank Info Card (landlord only) */}
          {role === 'landlord' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Thông tin ngân hàng</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Để nhận thanh toán từ khách thuê
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName" className="text-sm font-medium">Ngân hàng</Label>
                  <Input
                    id="bankName"
                    type="text"
                    placeholder="Nhập tên ngân hàng"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.bankName && (
                    <p className="text-xs text-destructive">{errors.bankName}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bankAccount" className="text-sm font-medium">Số tài khoản</Label>
                  <Input
                    id="bankAccount"
                    type="text"
                    placeholder="Nhập số tài khoản"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.bankAccount && (
                    <p className="text-xs text-destructive">{errors.bankAccount}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-lg h-10 px-6 gap-2 bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
