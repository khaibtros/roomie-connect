import React, { useEffect, useState } from 'react';
import { Truck, Sparkles, Filter, Edit, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/AdminLayout';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ApiServiceBooking } from '@/types/api';

export default function AdminServices() {
  const [bookings, setBookings] = useState<ApiServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNote, setEditNote] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await apiClient.getAdminServiceBookings();
      if (res.data) {
        setBookings(res.data);
      } else {
        toast.error(res.error || 'Không thể tải danh sách dịch vụ');
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (id: string) => {
    try {
      const res = await apiClient.updateServiceBookingStatus(id, editStatus, editNote);
      if (res.data) {
        toast.success('Cập nhật trạng thái thành công');
        setEditingId(null);
        fetchBookings();
      } else {
        toast.error(res.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-medium">Chờ xác nhận</span>;
      case 'confirmed': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Đã xác nhận</span>;
      case 'in_progress': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">Đang thực hiện</span>;
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Hoàn thành</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Đã huỷ</span>;
      case 'rejected': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">Bị từ chối</span>;
      default: return null;
    }
  };

  const filteredBookings = bookings.filter(b => statusFilter === 'all' || b.status === statusFilter);

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Dịch vụ</h1>
          <p className="text-muted-foreground mt-1">
            Tiếp nhận và điều phối các yêu cầu dịch vụ của người dùng.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:ring-0 outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã huỷ</option>
            <option value="rejected">Từ chối</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-2xl">
          <p className="text-muted-foreground">Không có đơn dịch vụ nào.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col xl:flex-row justify-between gap-6">
              <div className="flex gap-4 flex-1">
                <div className={`flex items-center justify-center h-12 w-12 rounded-xl shrink-0 ${booking.serviceType === 'moving' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                  {booking.serviceType === 'moving' ? <Truck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                </div>
                <div className="w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">
                      {booking.serviceType === 'moving' ? 'Vận chuyển đồ' : 'Dọn dẹp trọ'}
                    </h3>
                    {getStatusBadge(booking.status)}
                    <span className="text-xs text-muted-foreground ml-auto">
                      Tạo lúc: {format(new Date(booking.createdAt), "HH:mm dd/MM/yyyy", { locale: vi })}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <div className="text-sm space-y-1">
                      <p className="font-semibold text-foreground">Thông tin liên hệ</p>
                      <p>Người đặt: {booking.tenant?.fullName}</p>
                      <p>Tên liên hệ: {booking.contactName}</p>
                      <p>SĐT: {booking.contactPhone}</p>
                      <p>Ngày hẹn: <span className="font-medium">{format(new Date(booking.serviceDate), "HH:mm dd/MM/yyyy", { locale: vi })}</span></p>
                    </div>

                    <div className="text-sm space-y-1">
                      <p className="font-semibold text-foreground">Chi tiết dịch vụ</p>
                      {booking.serviceType === 'moving' && booking.movingDetails && (
                        <>
                          <p>Nơi đi: {booking.movingDetails.pickupAddress}</p>
                          <p>Nơi đến: {booking.movingDetails.dropoffAddress}</p>
                          <p>Loại xe: {booking.movingDetails.vehicleType === 'motorbike' ? 'Xe máy' : booking.movingDetails.vehicleType === 'three_wheeler' ? 'Xe ba gác' : 'Xe tải nhỏ'}</p>
                          {booking.movingDetails.floorNumber != null && (
                            <p>Tầng số: {booking.movingDetails.floorNumber}</p>
                          )}
                          {booking.movingDetails.hasElevator != null && (
                            <p>Thang máy: {booking.movingDetails.hasElevator ? 'Có' : 'Không'}</p>
                          )}
                          {booking.movingDetails.itemDescription && (
                            <p>Đồ đạc: {booking.movingDetails.itemDescription}</p>
                          )}
                        </>
                      )}
                      {booking.serviceType === 'cleaning' && booking.cleaningDetails && (
                        <>
                          <p>Địa chỉ: {booking.cleaningDetails.address}</p>
                          <p>Gói: {booking.cleaningDetails.roomSizePackage === 'small' ? 'Gói nhỏ (< 20m²)' : booking.cleaningDetails.roomSizePackage === 'medium' ? 'Gói vừa (20-35m²)' : 'Gói lớn (> 35m²)'}</p>
                          {booking.cleaningDetails.estimatedArea != null && (
                            <p>Diện tích ước tính: {booking.cleaningDetails.estimatedArea}m²</p>
                          )}
                          {booking.cleaningDetails.cleaningType && (
                            <p>Loại dọn: {booking.cleaningDetails.cleaningType === 'basic' ? 'Cơ bản' : 'Tổng vệ sinh'}</p>
                          )}
                        </>
                      )}
                      {booking.note && <p>Ghi chú KH: {booking.note}</p>}
                    </div>
                  </div>
                  
                  {booking.adminNote && editingId !== booking._id && (
                    <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                      <span className="font-semibold">Ghi chú của Admin:</span> {booking.adminNote}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col justify-start xl:items-end gap-3 min-w-[250px] border-t xl:border-t-0 xl:border-l pt-4 xl:pt-0 xl:pl-6">
                {editingId === booking._id ? (
                  <div className="space-y-3 w-full">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Cập nhật trạng thái</label>
                      <select 
                        value={editStatus} 
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="in_progress">Đang thực hiện</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã huỷ</option>
                        <option value="rejected">Từ chối</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Ghi chú cho khách hàng</label>
                      <textarea 
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        rows={2}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Vd: Đã gọi xác nhận..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingId(null)}>Huỷ</Button>
                      <Button size="sm" className="flex-1 gap-1" onClick={() => handleUpdateStatus(booking._id)}>
                        <CheckCircle className="w-4 h-4" /> Lưu
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full xl:w-auto gap-2" 
                    onClick={() => {
                      setEditingId(booking._id);
                      setEditStatus(booking.status);
                      setEditNote(booking.adminNote || '');
                    }}
                  >
                    <Edit className="w-4 h-4" /> Cập nhật xử lý
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
