import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiUser } from '@/types/api';

export default function AdminUsers() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'landlord' | 'tenant'>('all');

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { role: filter };
      const { data, error } = await apiClient.getAdminUsers(params);

      if (error) {
        throw new Error(error);
      }
      setUsers(data?.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id: string) => {
    try {
      const { error } = await apiClient.banUser(id);
      if (error) {
        throw new Error(error);
      }
      toast.success('Đã khóa tài khoản');
      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Không thể khóa tài khoản');
    }
  };

  const handleUnban = async (id: string) => {
    try {
      const { error } = await apiClient.unbanUser(id);
      if (error) {
        throw new Error(error);
      }
      toast.success('Đã mở khóa tài khoản');
      fetchUsers();
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('Không thể mở khóa tài khoản');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quản lý Người dùng</h2>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'landlord' | 'tenant')}
              className="px-3 py-1 rounded border"
            >
              <option value="all">All</option>
              <option value="landlord">Landlord</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm overflow-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Người dùng</th>
                <th className="px-4 py-3 text-left text-sm">Liên hệ</th>
                <th className="px-4 py-3 text-left text-sm">Role</th>
                <th className="px-4 py-3 text-left text-sm">Ví</th>
                <th className="px-4 py-3 text-left text-sm">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id || u._id}>
                  <td className="px-4 py-3 flex items-center gap-3">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">
                        {u.fullName?.split(' ').slice(-1)[0]?.[0] || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{u.fullName || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{u.email}</div>
                    <div className="text-xs text-muted-foreground">{u.phone || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.role === 'landlord'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.wallet ? u.wallet.toLocaleString('vi-VN') + '₫' : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        u.isBanned
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.isBanned ? 'banned' : 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant={u.isBanned ? 'secondary' : 'destructive'}
                      size="sm"
                      onClick={() => u.isBanned ? handleUnban(u.id || u._id) : handleBan(u.id || u._id)}
                    >
                      {u.isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    Không có người dùng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
