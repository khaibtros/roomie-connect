import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Building2, Users, MessageCircle, User, Bell, LogOut, LogIn, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const navItems = [
  { path: '/home', label: 'Trang chủ' },
  { path: '/find-room', label: 'Tìm trọ' },
  { path: '/find-roommate', label: 'Tìm bạn ở ghép' },
];

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, loading } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 hidden md:block">
      <div className="glass-card border-b border-border/50">
        <div className="container flex h-16 items-center justify-between">
          <Link to={isAuthenticated ? '/home' : '/'} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">KK</span>
            </div>
            <span className="font-bold text-xl gradient-text">KnockKnock</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path === '/quiz' && location.pathname === '/matches');
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative px-4 py-2 rounded-full text-sm font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute inset-0 bg-primary/10 rounded-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {isAuthenticated ? (
                  <>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Bell className="h-5 w-5" />
                    </Button>
                    {(user?.role === 'tenant' || !user?.role) && (
                      <Link to="/tenant/ai-payment">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 ml-2 bg-yellow-500/10 text-yellow-600 rounded-full font-medium hover:bg-yellow-500/20 transition-all cursor-pointer">
                          <Coins className="h-4 w-4" />
                          <span>{user?.knockCoin || 0}</span>
                        </div>
                      </Link>
                    )}
                    <Link to="/profile">
                      <div className="h-9 w-9 ml-2 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center hover:shadow-lg transition-shadow">
                        <User className="h-5 w-5 text-primary-foreground" />
                      </div>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full"
                      onClick={handleLogout}
                      title="Đăng xuất"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth/login">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <LogIn className="h-4 w-4" />
                        Đăng Nhập
                      </Button>
                    </Link>
                    <Link to="/auth/register">
                      <Button size="sm" className="rounded-full">
                        Đăng Ký
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


