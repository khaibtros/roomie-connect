import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Heart, 
  Clock, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  Star,
  Lock,
  Edit2
} from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, loading, role } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [viewedCount, setViewedCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setStatsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch saved rooms count
      const favoritesRes = await apiClient.getFavorites();
      if (favoritesRes.data) {
        const favorites = favoritesRes.data.favorites || favoritesRes.data.rooms || [];
        setSavedCount(Array.isArray(favorites) ? favorites.length : 0);
      }
      
      // Get viewed rooms from localStorage (unique rooms viewed)
      const viewedRooms = JSON.parse(localStorage.getItem('viewedRooms') || '[]');
      setViewedCount(viewedRooms.length);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const MENU_ITEMS = [
    { icon: Heart, label: 'Phòng đã lưu', badge: savedCount.toString(), action: () => navigate('/saved-rooms') },
    { icon: Clock, label: 'Lịch sử xem', badge: viewedCount.toString(), action: () => navigate('/history') },
    { icon: Bell, label: 'Thông báo', badge: '2', action: () => navigate('/notifications') },
    { icon: Shield, label: 'Quyền riêng tư', action: () => navigate('/privacy') },
    { icon: Lock, label: 'Đổi Mật Khẩu', action: () => navigate('/auth/change-password') },
    { icon: Star, label: 'Đánh giá ứng dụng', action: () => navigate('/app-rating') },
    { icon: HelpCircle, label: 'Trợ giúp & Hỗ trợ', action: () => navigate('/support') },
  ];

  const handleLogout = async () => {
    await signOut();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-6 space-y-6">
          {/* Not Logged In Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-3xl p-8 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary-foreground" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Chào Mừng</h2>
            <p className="text-muted-foreground mb-6">
              Đăng nhập hoặc đăng ký để bắt đầu tìm kiếm phòng trọ lý tưởng
            </p>

            <div className="flex gap-3 flex-col sm:flex-row">
              <Button 
                className="flex-1 rounded-full h-11"
                onClick={() => navigate('/auth/login')}
              >
                Đăng Nhập
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 rounded-full h-11"
                onClick={() => navigate('/auth/register')}
              >
                Đăng Ký
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <User className="h-10 w-10 text-primary-foreground" />
              </div>
              <button 
                onClick={() => navigate('/edit-profile')}
                className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-card border-2 border-background flex items-center justify-center shadow-card hover:bg-muted transition-colors"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.fullName || user?.email || 'Người dùng'}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <Badge variant={role === 'admin' ? 'destructive' : role === 'landlord' ? 'default' : 'secondary'} className="mt-2">
                {role === 'admin' ? 'Quản trị viên' : role === 'landlord' ? 'Chủ trọ' : 'Người tìm trọ'}
              </Badge>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 rounded-full"
              onClick={() => navigate('/edit-profile')}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Chỉnh Sửa Hồ Sơ
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-4 text-center"
          >
            <p className="text-2xl font-bold gradient-text">{statsLoading ? '-' : savedCount}</p>
            <p className="text-xs text-muted-foreground">Phòng đã lưu</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-4 text-center"
          >
            <p className="text-2xl font-bold gradient-text">{statsLoading ? '-' : viewedCount}</p>
            <p className="text-xs text-muted-foreground">Lượt xem</p>
          </motion.div>
        </div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-3xl overflow-hidden divide-y divide-border/50"
        >
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="bg-primary/10 text-primary border-0">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            className="w-full rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Đăng Xuất
          </Button>
        </motion.div>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground">
          KnockKnock v1.0.0 • Made with ❤️ for students
        </p>
      </div>
    </Layout>
  );
}


