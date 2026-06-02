import React, { useEffect, useState } from 'react';
import { Truck, Sparkles, X, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function MyServiceBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const res = await apiClient.getMyServiceBookings();
      if (res.data) {
        setBookings(res.data);
      } else {
        toast.error(res.error || 'Không thể tải lịch sử dịch vụ');
      }
    } catch (error) {
      toast.error('Lỗi khi tải lịch sử dịch vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn huỷ đơn dịch vụ này?')) return;
    
    try {
      const res = await apiClient.cancelServiceBooking(id);
      if (res.data) {
        toast.success('Đã huỷ đơn thành công');
        fetchBookings();
      } else {
        toast.error(res.error || 'Huỷ đơn thất bại');
      }
    } catch (err) {
      toast.error('Lỗi khi huỷ đơn');
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

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Lịch sử đặt dịch vụ</h1>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-2xl">
            <p className="text-muted-foreground mb-4">Bạn chưa đặt dịch vụ nào.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-4">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-xl shrink-0 ${booking.serviceType === 'moving' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {booking.serviceType === 'moving' ? <Truck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">
                        {booking.serviceType === 'moving' ? 'Vận chuyển đồ' : 'Dọn dẹp trọ'}
                      </h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1 mb-4">
                      <p className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> Ngày thực hiện: {format(new Date(booking.serviceDate), "dd/MM/yyyy HH:mm", { locale: vi })}</p>
                      <p>Người liên hệ: {booking.contactName} - {booking.contactPhone}</p>
                      
                      {booking.serviceType === 'moving' && booking.movingDetails && (
                        <>
                          <p>Nơi đi: {booking.movingDetails.pickupAddress}</p>
                          <p>Nơi đến: {booking.movingDetails.dropoffAddress}</p>
                          <p>Loại xe: {booking.movingDetails.vehicleType === 'motorbike' ? 'Xe máy' : booking.movingDetails.vehicleType === 'three_wheeler' ? 'Xe ba gác' : 'Xe tải nhỏ'}</p>
                        </>
                      )}
                      
                      {booking.serviceType === 'cleaning' && booking.cleaningDetails && (
                        <>
                          <p>Địa chỉ: {booking.cleaningDetails.address}</p>
                          <p>Gói: {booking.cleaningDetails.roomSizePackage === 'small' ? 'Gói nhỏ (< 20m²)' : booking.cleaningDetails.roomSizePackage === 'medium' ? 'Gói vừa (20-35m²)' : 'Gói lớn (> 35m²)'}</p>
                        </>
                      )}
                      
                      {booking.adminNote && (
                        <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">Phản hồi từ Admin: {booking.adminNote}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-start md:items-end gap-2">
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 gap-2" onClick={() => handleCancel(booking._id)}>
                      <X className="w-4 h-4" /> Huỷ đơn
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
