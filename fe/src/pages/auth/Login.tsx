import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, LogIn, Building2, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

const roleConfig: Record<UserRole, { title: string; icon: React.ElementType; color: string }> = {
  tenant: { title: 'Người Tìm Trọ', icon: User, color: 'from-primary to-accent' },
  landlord: { title: 'Chủ Trọ', icon: Building2, color: 'from-emerald-500 to-teal-500' },
  admin: { title: 'Admin', icon: Shield, color: 'from-rose-500 to-pink-500' },
};

export default function Login() {
  const [searchParams] = useSearchParams();
  const role = (searchParams.get('role') as UserRole) || 'tenant';
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const { signIn, user, role: userRole, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const config = roleConfig[role];
  const Icon = config.icon;

  useEffect(() => {
    if (!loading && user && userRole) {
      if (from) {
        navigate(from, { replace: true });
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'landlord') {
        navigate('/landlord/dashboard');
      } else {
        navigate('/tenant/find-room');
      }
    } 
  }, [user, userRole, loading, navigate, from]);

  async function waitForRole(timeout = 2000) {
    const start = Date.now();
    // Poll until role is set or timeout
    while (Date.now() - start < timeout) {
      // read current role from context
      // small delay
      if ((window as unknown as Record<string, unknown>).__auth_role_ready) break;
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });
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
    const { error } = await signIn(email, password);
    // Wait a moment for mock seeding to finish
    await new Promise((r) => setTimeout(r, 100));
    setIsLoading(false);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email hoặc mật khẩu không đúng');
      } else {
        toast.error('Đăng nhập thất bại: ' + error.message);
      }
    } else {
      toast.success('Đăng nhập thành công!');
      // rely on useEffect to redirect once role is available
    }
  };

  const demoQuick = async (email: string) => {
    setIsLoading(true);
    const { error } = await signIn(email, 'demo123456');
    await new Promise((r) => setTimeout(r, 100));
    setIsLoading(false);

    if (error) {
      toast.error('Lỗi đăng nhập: ' + error.message);
    } else {
      toast.success('Đăng nhập thành công!');
    }
  };


  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
            <h1 className="text-2xl font-bold mb-2">Đăng nhập</h1>
            <p className="text-muted-foreground">
              Đăng nhập cho <span className="font-medium text-foreground">{config.title}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
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
              <div className="text-right">
                <Link 
                  to="/auth/forgot-password" 
                  className="text-xs text-primary hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-full" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang đăng nhập...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Đăng nhập
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">hoặc</span>
            </div>
          </div>

          {/* Social login */}
          <Button 
            variant="outline" 
            className="w-full rounded-full" 
            size="lg"
            type="button"
            onClick={() => toast.info('Tính năng đang phát triển')}
          >
            <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Tiếp tục với Google
          </Button>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Chưa có tài khoản?{' '}
            <Link to={`/auth/register?role=${role}`} className="text-primary font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>

          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => demoQuick('landlord@demo.com')}>Demo Landlord</Button>
            <Button variant="ghost" onClick={() => demoQuick('tenant@demo.com')}>Demo Tenant</Button>
            <Button variant="ghost" onClick={() => demoQuick('admin@demo.com')}>Demo Admin</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


