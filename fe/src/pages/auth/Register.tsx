import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, UserPlus, Building2, User, Shield, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const baseSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  full_name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
});

const tenantSchema = baseSchema.extend({
  university: z.string().optional(),
  workplace: z.string().optional(),
});

const landlordSchema = baseSchema.extend({
  phone: z.string().min(10, 'Số điện thoại không hợp lệ'),
  bank_account: z.string().optional(),
  bank_name: z.string().optional(),
});

const roleConfig: Record<UserRole, { title: string; icon: React.ElementType; color: string }> = {
  tenant: { title: 'Người Tìm Trọ', icon: User, color: 'from-primary to-accent' },
  landlord: { title: 'Chủ Trọ', icon: Building2, color: 'from-emerald-500 to-teal-500' },
  admin: { title: 'Quản Trị Viên', icon: Shield, color: 'from-rose-500 to-pink-500' },
};

const universities = [
  'FPT University',
  'ĐHQG Hà Nội',
  'Học viện Nông nghiệp',
  'Đại học Công nghệ',
  'Khác',
];

const banks = [
  'Vietcombank',
  'Techcombank', 
  'MB Bank',
  'BIDV',
  'Agribank',
  'VPBank',
  'ACB',
  'TPBank',
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') as UserRole) || 'tenant';
  const navigate = useNavigate();
  const { signUp, user, role: userRole, loading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    university: '',
    workplace: '',
    bank_account: '',
    bank_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP verification states
  const [emailVerified, setEmailVerified] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [mockOtpCode, setMockOtpCode] = useState(''); // For demo purposes

  const config = roleConfig[role];
  const Icon = config.icon;

  useEffect(() => {
    if (role === 'admin') {
      navigate('/auth/login?role=admin', { replace: true });
      return;
    }
    if (!loading && user && userRole) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'landlord') {
        navigate('/landlord/dashboard');
      } else {
        navigate('/tenant/find-room');
      }
    }
  }, [role, user, userRole, loading, navigate]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Send OTP to email
  const handleSendOtp = async () => {
    // Validate email
    if (!formData.email) {
      setErrors((prev) => ({ ...prev, email: 'Vui lòng nhập email' }));
      return;
    }
    
    const emailSchema = z.string().email('Email không hợp lệ');
    const emailValidation = emailSchema.safeParse(formData.email);
    
    if (!emailValidation.success) {
      setErrors((prev) => ({ ...prev, email: 'Email không hợp lệ' }));
      return;
    }

    setIsSendingOtp(true);
    
    // Simulate API call to send OTP
    try {
      // In real application, call backend API to send OTP
      // const { data, error } = await apiClient.sendOtp(formData.email);
      
      // For demo: Generate random OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setMockOtpCode(generatedOtp);
      
      setIsOtpSent(true);
      setOtpCountdown(60); // 60 seconds countdown
      toast.success(`Mã OTP đã được gửi đến ${formData.email}`);
      toast.info(`(Demo) Mã OTP: ${generatedOtp}`, { duration: 10000 });
    } catch (error) {
      toast.error('Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode) {
      toast.error('Vui lòng nhập mã OTP');
      return;
    }

    setIsVerifyingOtp(true);
    
    try {
      // In real application, call backend API to verify OTP
      // const { data, error } = await apiClient.verifyOtp(formData.email, otpCode);
      
      // For demo: Compare with mock OTP
      if (otpCode === mockOtpCode) {
        setEmailVerified(true);
        setIsOtpSent(false);
        setOtpCode('');
        toast.success('Email xác thực thành công!');
      } else {
        toast.error('Mã OTP không chính xác. Vui lòng thử lại.');
      }
    } catch (error) {
      toast.error('Lỗi xác thực OTP. Vui lòng thử lại.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (otpCountdown === 0) {
      handleSendOtp();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate based on effective role
    const schema = role === 'landlord' ? landlordSchema : tenantSchema;
    const result = schema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(formData.email, formData.password, role, {
      full_name: formData.full_name,
      phone: formData.phone,
      university: formData.university,
      workplace: formData.workplace,
      bank_account: formData.bank_account,
      bank_name: formData.bank_name,
    });
    setIsLoading(false);

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('Email này đã được đăng ký');
      } else {
        toast.error('Đăng ký thất bại: ' + error.message);
      }
    } else {
      toast.success('Đăng ký thành công! Chúc mừng bạn đã đăng ký.');
      if (role === 'tenant') {
        navigate('/home');
      } else if (role === 'landlord') {
        navigate('/landlord/dashboard');
      } else {
        navigate('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-12">
      {/* Background */}
      <div className="fixed inset-0 gradient-mesh opacity-60" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Back button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Link>

        <div className="glass-card rounded-3xl p-8 shadow-elevated">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${config.color} mb-4 shadow-lg`}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Đăng ký tài khoản</h1>
            <p className="text-muted-foreground">
              Đăng ký cho <span className="font-medium text-foreground">{config.title}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common fields */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Họ và tên *</Label>
              <Input
                id="full_name"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                className={errors.full_name ? 'border-destructive' : ''}
              />
              {errors.full_name && <p className="text-sm text-destructive">{errors.full_name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={emailVerified}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {!emailVerified && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || isOtpSent || !formData.email}
                    className="whitespace-nowrap"
                  >
                    {isSendingOtp ? 'Đang gửi...' : 'Gửi OTP'}
                  </Button>
                )}
                {emailVerified && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-green-50 text-green-700 border border-green-200">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Đã xác thực</span>
                  </div>
                )}
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* OTP Verification Section */}
            {isOtpSent && !emailVerified && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg"
              >
                <Label htmlFor="otp">Nhập mã OTP *</Label>
                <div className="flex gap-2">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Nhập 6 chữ số"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center tracking-widest"
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={isVerifyingOtp || otpCode.length !== 6}
                    className="whitespace-nowrap"
                  >
                    {isVerifyingOtp ? 'Đang xác thực...' : 'Xác thực'}
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <p className="text-muted-foreground">Mã OTP đã được gửi đến email của bạn</p>
                  {otpCountdown > 0 ? (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="h-3 w-3" />
                      <span>Gửi lại trong {otpCountdown}s</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-primary hover:underline font-medium"
                    >
                      Gửi lại mã
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={!emailVerified}
                  className={`${errors.password ? 'border-destructive pr-10' : 'pr-10'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            {/* Role-specific fields */}
            {role === 'tenant' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="university">Trường đại học</Label>
                  <Select 
                    value={formData.university} 
                    onValueChange={(value) => handleChange('university', value)}
                    disabled={!emailVerified}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trường" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((uni) => (
                        <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workplace">Nơi làm việc (nếu có)</Label>
                  <Input
                    id="workplace"
                    placeholder="Công ty ABC"
                    value={formData.workplace}
                    onChange={(e) => handleChange('workplace', e.target.value)}
                    disabled={!emailVerified}
                  />
                </div>
              </>
            )}

            {role === 'landlord' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại *</Label>
                  <Input
                    id="phone"
                    placeholder=""
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!emailVerified}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Ngân hàng (để nhận thanh toán)</Label>
                  <Select 
                    value={formData.bank_name} 
                    onValueChange={(value) => handleChange('bank_name', value)}
                    disabled={!emailVerified}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ngân hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_account">Số tài khoản</Label>
                  <Input
                    id="bank_account"
                    placeholder=""
                    value={formData.bank_account}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                    disabled={!emailVerified}
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full rounded-full mt-6" 
              size="lg"
              disabled={isLoading || !emailVerified}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng ký...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Đăng ký
                </div>
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Đã có tài khoản?{' '}
            <Link to={`/auth/login?role=${role}`} className="text-primary font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}


