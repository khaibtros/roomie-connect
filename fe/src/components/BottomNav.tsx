import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, Users, MessageCircle, User, LogOut, Truck } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const navItems = [
  { path: '/home', icon: Home, label: 'Trang chủ' },
  { path: '/find-room', icon: Building2, label: 'Tìm trọ' },
  { path: '/quiz', icon: Users, label: 'Tìm bạn' },
  { path: '/services', icon: Truck, label: 'Dịch vụ' },
  { path: '/messages', icon: MessageCircle, label: 'Tin nhắn' },
  { path: '/profile', icon: User, label: 'Tôi' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="glass-card border-t border-border/50 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/quiz' && location.pathname === '/matches');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className="h-5 w-5 relative z-10" />
                <span className="text-[10px] font-medium relative z-10">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="relative flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
            title="Đăng xuất"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">Thoát</span>
          </button>
        </div>
      </div>
    </nav>
  );
}


