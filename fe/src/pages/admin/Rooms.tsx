import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import type { ApiRoom, ApiUser, RoomStatus } from '@/types/api';

function getLandlordName(landlordId: string | ApiUser): string {
  return typeof landlordId === 'object' ? landlordId.fullName : 'N/A';
}

export default function AdminRooms() {
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoomStatus | 'all'>('pending');

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const params = activeTab === 'all' ? {} : { status: activeTab };
      const { data, error } = await apiClient.getAdminRooms(params);

      if (error) {
        throw new Error(error);
      }
      setRooms(data?.rooms || []);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      toast.error('Không thể tải danh sách tin đăng');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleApprove = async (id: string) => {
    try {
      const { error } = await apiClient.approveRoom(id);
      if (error) {
        throw new Error(error);
      }
      toast.success('Đã phê duyệt tin đăng');
      fetchRooms();
    } catch (err) {
      console.error('Error approving room:', err);
      toast.error('Không thể phê duyệt tin đăng');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Lý do từ chối (nhập)') || 'Không đạt tiêu chuẩn';
    if (!reason) return;

    try {
      const { error } = await apiClient.rejectRoom(id, reason);
      if (error) {
        throw new Error(error);
      }
      toast.success('Đã từ chối tin đăng');
      fetchRooms();
    } catch (err) {
      console.error('Error rejecting room:', err);
      toast.error('Không thể từ chối tin đăng');
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
          <h2 className="text-xl font-semibold">Quản lý Tin đăng</h2>
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'pending' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('pending')}
            >
              Chờ duyệt
            </Button>
            <Button
              variant={activeTab === 'active' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('active')}
            >
              Đang hiển thị
            </Button>
            <Button
              variant={activeTab === 'rejected' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('rejected')}
            >
              Đã từ chối
            </Button>
            <Button
              variant={activeTab === 'all' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('all')}
            >
              Tất cả
            </Button>
          </div>
        </div>

        <div className="bg-white rounded shadow-sm overflow-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Ảnh</th>
                <th className="px-4 py-3 text-left text-sm">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-sm">Chủ trọ</th>
                <th className="px-4 py-3 text-left text-sm">Giá</th>
                <th className="px-4 py-3 text-left text-sm">Ngày đăng</th>
                <th className="px-4 py-3 text-left text-sm">Trạng thái</th>
                <th className="px-4 py-3 text-right text-sm">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rooms.map(r => (
                <tr key={r._id}>
                  <td className="px-4 py-3">
                    {r.images?.[0] ? (
                      <img src={r.images[0]} alt="" className="h-12 w-20 bg-slate-100 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-20 bg-slate-100 rounded" />
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.title}</td>
                  <td className="px-4 py-3">{getLandlordName(r.landlordId)}</td>
                  <td className="px-4 py-3">{r.price?.toLocaleString('vi-VN')}₫</td>
                  <td className="px-4 py-3">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      r.status === 'pending'
                        ? 'bg-amber-100 text-amber-700'
                        : r.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    {r.status !== 'active' && (
                      <Button size="sm" onClick={() => handleApprove(r._id)}>
                        Duyệt
                      </Button>
                    )}
                    {r.status !== 'rejected' && (
                      <Button variant="ghost" size="sm" onClick={() => handleReject(r._id)}>
                        Từ chối
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-muted-foreground">
                    Không có tin
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
