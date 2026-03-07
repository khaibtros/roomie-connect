import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, Home, FileText, Users, AlertCircle, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Đã đăng xuất thành công');
    navigate('/');
  };
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <aside className="w-72 bg-white border-r border-border shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center font-bold text-primary">KK</div>
            <div>
              <div className="font-semibold">KnockKnock Admin</div>
              <div className="text-xs text-muted-foreground">Portal</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <NavLink to="/admin/dashboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-primary/5 text-primary' : 'text-foreground'}`}>
                <Home className="h-4 w-4" /> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/rooms" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-primary/5 text-primary' : 'text-foreground'}`}>
                <FileText className="h-4 w-4" /> Quản lý Tin đăng
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/users" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-primary/5 text-primary' : 'text-foreground'}`}>
                <Users className="h-4 w-4" /> Quản lý Người dùng
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/reports" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-primary/5 text-primary' : 'text-foreground'}`}>
                <AlertCircle className="h-4 w-4" /> Báo cáo & Khiếu nại
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/transactions" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-primary/5 text-primary' : 'text-foreground'}`}>
                <FileText className="h-4 w-4" /> Giao dịch
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-md ${isActive ? 'bg-primary/5 text-primary' : 'text-foreground'}`}>
                <Settings className="h-4 w-4" /> Cài đặt hệ thống
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">AD</div>
            <div className="flex-1">
              <div className="text-sm font-medium">Admin</div>
              <div className="text-xs text-muted-foreground">admin@knockknock.local</div>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-md hover:bg-slate-100"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="flex items-center justify-between p-4 border-b bg-white">
          <div className="text-sm text-muted-foreground">Admin / <span className="font-medium">Dashboard</span></div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-md hover:bg-slate-100"><Bell /></button>
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}