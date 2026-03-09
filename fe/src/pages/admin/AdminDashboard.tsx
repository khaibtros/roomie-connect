// src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Home, DollarSign } from 'lucide-react';
import type { AdminStats, ApiRoom } from '@/types/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [rooms, setRooms] = useState<ApiRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, roomsResponse] = await Promise.all([
        apiClient.getAdminStats(),
        apiClient.getAdminRooms({ status: 'pending', limit: 10 })
      ]);

      if (statsResponse.error) {
        throw new Error(statsResponse.error);
      }
      if (roomsResponse.error) {
        throw new Error(roomsResponse.error);
      }

      setStats(statsResponse.data);
      setRooms(roomsResponse.data?.rooms || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await apiClient.approveRoom(id);
      if (error) {
        throw new Error(error);
      }
      toast.success('Đã phê duyệt tin đăng');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving room:', error);
      toast.error('Không thể phê duyệt tin đăng');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const { error } = await apiClient.rejectRoom(id, 'Không đạt tiêu chuẩn');
      if (error) {
        throw new Error(error);
      }
      toast.success('Đã từ chối tin đăng');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting room:', error);
      toast.error('Không thể từ chối tin đăng');
    }
  };

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-4">Admin — Dashboard</h1>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.totals?.revenue || 0) / 1000000).toFixed(1)}M VND
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng số dư ví
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals?.users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.stats?.landlords || 0} chủ nhà, {stats?.stats?.tenants || 0} người thuê
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tin mới</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totals?.newRooms || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tin chờ duyệt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ đóng</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((stats?.totals?.closeRate || 0) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.stats?.activeRooms || 0} tin đang hoạt động
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Rooms */}
      <h2 className="text-xl font-semibold mb-3">Tin đăng chờ duyệt</h2>
      {rooms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Không có tin đăng chờ duyệt
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map(r => (
            <div key={r.id || r._id} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <div className="font-semibold">{r.title}</div>
                <div className="text-sm text-muted-foreground">
                  {r.address} • {(r.price / 1000000).toFixed(1)}tr
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleApprove(r.id || r._id)}>
                  Approve
                </Button>
                <Button variant="destructive" onClick={() => handleReject(r.id || r._id)}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
