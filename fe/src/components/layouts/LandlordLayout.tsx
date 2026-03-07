import { ReactNode, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  FileCheck,
  User,
  LogOut,
  Menu,
  Bell,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface LandlordLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Tổng quan", href: "/landlord/dashboard", icon: LayoutDashboard },
  { label: "Quản lý tin", href: "/landlord/posts", icon: FileText },
  { label: "Gói phí duy trì", href: "/landlord/subscription", icon: CreditCard },
  { label: "Quản lý hợp đồng", href: "/landlord/contracts", icon: FileCheck },
  { label: "Hồ sơ", href: "/landlord/profile", icon: User },
];

function NavLink({
  item,
  isActive,
}: {
  item: (typeof navItems)[0];
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
        isActive
          ? "bg-primary text-primary-foreground shadow-card"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

export default function LandlordLayout({ children }: LandlordLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && (!user || role !== "landlord")) {
      navigate("/auth/login?role=landlord");
    }
  }, [user, role, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
          <Link to="/" className="flex items-center gap-2 px-4 mb-4">
            <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center shadow-card">
              <span className="text-primary-foreground font-bold">KK</span>
            </div>
            <span className="font-bold text-xl gradient-text">KnockKnock</span>
          </Link>

          {/* Create Post Button */}
          <Button asChild className="rounded-xl shadow-card">
            <Link to="/landlord/create-post">
              <PlusCircle className="h-4 w-4" />
              Đăng tin mới
            </Link>
          </Button>

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
                <Link to="/" className="flex items-center gap-2 px-4 mb-6">
                  <div className="h-10 w-10 rounded-full gradient-bg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      KK
                    </span>
                  </div>
                  <span className="font-bold text-xl gradient-text">
                    KnockKnock
                  </span>
                </Link>

                <Button asChild className="rounded-xl mb-4">
                  <Link to="/landlord/create-post">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Đăng tin mới
                  </Link>
                </Button>

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

          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                KK
              </span>
            </div>
          </Link>

          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
