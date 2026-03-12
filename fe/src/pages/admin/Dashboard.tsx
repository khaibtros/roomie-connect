import React, { useState, useEffect } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { apiClient } from '@/lib/api';
import { mockStats } from '@/lib/adminMockData';
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, FilePlus, CheckCircle, Loader2 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import type { AdminStats } from '@/types/api';

const currency = (v: number) => v.toLocaleString('vi-VN') + '₫';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await apiClient.getAdminStats();
        if (!error && data) {
          setStats(data);
        } else {
          // Fallback to mock data if API fails
          setStats(mockStats as unknown as AdminStats);
        }
      } catch {
        setStats(mockStats as unknown as AdminStats);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const { totals, revenueMonthly, userGrowth, recentActivity } = stats || mockStats;

  return (
    <AdminLayout>
      <div className="max-w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tổng Doanh Thu</div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{currency(totals.revenue)}</div>
            <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" /> +12% so với tháng trước
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tổng Người Dùng</div>
              <Users className="h-5 w-5 text-sky-600" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{totals.users}</div>
            <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" /> +6% so với tháng trước
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tin Đăng Mới</div>
              <FilePlus className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{totals.newRooms}</div>
            <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-red-500" /> -2% so với tháng trước
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Tỉ lệ Chốt</div>
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-3 text-2xl font-semibold">{Math.round(totals.closeRate * 100)}%</div>
            <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" /> +1.5% so với tháng trước
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-3">Doanh thu 6 tháng</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <AreaChart data={revenueMonthly}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow-sm">
            <h3 className="font-semibold mb-3">Tăng trưởng người dùng</h3>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="landlords" fill="#10b981" name="Chủ trọ" />
                  <Bar dataKey="tenants" fill="#3b82f6" name="Người tìm trọ" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow-sm">
          <h3 className="font-semibold mb-3">Hoạt động gần đây</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {recentActivity.map((a, i) => <li key={i} className="py-2 border-b last:border-b-0">{a}</li>)}
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}


