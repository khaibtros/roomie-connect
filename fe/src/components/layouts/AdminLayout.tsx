import { ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  Shield,
  Truck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Tổng quan', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Quản lý phòng', href: '/admin/rooms', icon: Home },
  { label: 'Quản lý người dùng', href: '/admin/users', icon: Users },
  { label: 'Giao dịch', href: '/admin/transactions', icon: CreditCard },
  { label: 'Dịch vụ', href: '/admin/services', icon: Truck },
  { label: 'Cài đặt', href: '/admin/settings', icon: Settings },
];

function NavLink({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
        isActive 
          ? 'bg-primary text-primary-foreground shadow-card' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      navigate('/auth/login?role=admin');
    }
  }, [user, role, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-1 flex-col gap-y-4 border-r border-border bg-card px-4 py-6">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg">Admin Panel</span>
              <p className="text-xs text-muted-foreground">KnockKnock</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 mt-4">
            {navItems.map((item) => (
              <NavLink 
                key={item.href} 
                item={item} 
                isActive={location.pathname === item.href}
              />
            ))}
          </nav>

          {/* Sign Out */}
          <Button 
            variant="ghost" 
            className="justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full px-4 py-6">
                <div className="flex items-center gap-2 px-4 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold">Admin Panel</span>
                    <p className="text-xs text-muted-foreground">KnockKnock</p>
                  </div>
                </div>

                <nav className="flex-1 space-y-1">
                  {navItems.map((item) => (
                    <NavLink 
                      key={item.href} 
                      item={item} 
                      isActive={location.pathname === item.href}
                    />
                  ))}
                </nav>

                <Button 
                  variant="ghost" 
                  className="justify-start gap-3 text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Đăng xuất
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">Admin</span>
          </div>

          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}


