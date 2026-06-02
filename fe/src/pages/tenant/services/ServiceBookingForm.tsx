import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Truck, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const bookingSchema = z.object({
  contactName: z.string().min(1, 'Vui lòng nhập tên liên hệ'),
  contactPhone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ'),
  serviceDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Ngày giờ không được trong quá khứ',
  }),
  note: z.string().max(500, 'Ghi chú tối đa 500 ký tự').optional(),
  
  // Moving
  pickupAddress: z.string().optional(),
  dropoffAddress: z.string().optional(),
  vehicleType: z.enum(['motorbike', 'three_wheeler', 'small_truck']).optional(),
  
  // Cleaning
  address: z.string().optional(),
  roomSizePackage: z.enum(['small', 'medium', 'large']).optional(),
}).superRefine((data, ctx) => {
  if (data.vehicleType) {
    if (!data.pickupAddress) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng nhập nơi đi', path: ['pickupAddress'] });
    if (!data.dropoffAddress) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng nhập nơi đến', path: ['dropoffAddress'] });
  } else if (data.roomSizePackage) {
    if (!data.address) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Vui lòng nhập địa chỉ phòng', path: ['address'] });
  }
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function ServiceBookingForm() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMoving = type === 'moving';
  const isCleaning = type === 'cleaning';

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      vehicleType: isMoving ? 'small_truck' : undefined,
      roomSizePackage: isCleaning ? 'small' : undefined,
    }
  });

  const onSubmit = async (data: BookingFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = {
        serviceType: type,
        serviceDate: data.serviceDate,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        note: data.note,
        estimatedPrice: 0, // Placeholder
      };

      if (isMoving) {
        payload.movingDetails = {
          pickupAddress: data.pickupAddress,
          dropoffAddress: data.dropoffAddress,
          vehicleType: data.vehicleType,
        };
      } else if (isCleaning) {
        payload.cleaningDetails = {
          address: data.address,
          roomSizePackage: data.roomSizePackage,
        };
      }

      const res = await apiClient.createServiceBooking(payload);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Đặt dịch vụ thành công!');
        navigate('/services/my-bookings');
      }
    } catch (err: any) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isMoving && !isCleaning) {
    return <div className="p-8 text-center">Dịch vụ không hợp lệ</div>;
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate('/services')}>
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </Button>
        
        <div className="mb-8 flex items-center gap-4">
          <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${isMoving ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
            {isMoving ? <Truck className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isMoving ? 'Đặt lịch vận chuyển đồ' : 'Đặt lịch dọn dẹp trọ'}</h1>
            <p className="text-muted-foreground text-sm">Điền thông tin bên dưới để chúng tôi hỗ trợ bạn tốt nhất.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-card border rounded-2xl p-6 shadow-sm">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên liên hệ *</label>
              <input {...register('contactName')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nhập tên" />
              {errors.contactName && <p className="text-red-500 text-xs">{errors.contactName.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Số điện thoại *</label>
              <input {...register('contactPhone')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nhập SĐT" />
              {errors.contactPhone && <p className="text-red-500 text-xs">{errors.contactPhone.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ngày giờ thực hiện *</label>
            <input type="datetime-local" {...register('serviceDate')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            {errors.serviceDate && <p className="text-red-500 text-xs">{errors.serviceDate.message}</p>}
          </div>

          {isMoving && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nơi đi *</label>
                <input {...register('pickupAddress')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nhập địa chỉ lấy đồ" />
                {errors.pickupAddress && <p className="text-red-500 text-xs">{errors.pickupAddress.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nơi đến *</label>
                <input {...register('dropoffAddress')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nhập địa chỉ giao đồ" />
                {errors.dropoffAddress && <p className="text-red-500 text-xs">{errors.dropoffAddress.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Loại xe *</label>
                <select {...register('vehicleType')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="motorbike">Xe máy</option>
                  <option value="three_wheeler">Xe ba gác</option>
                  <option value="small_truck">Xe tải nhỏ</option>
                </select>
              </div>
            </>
          )}

          {isCleaning && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Địa chỉ phòng *</label>
                <input {...register('address')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nhập địa chỉ phòng trọ" />
                {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gói dịch vụ (diện tích) *</label>
                <select {...register('roomSizePackage')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="small">Gói nhỏ ({"<"} 20m²)</option>
                  <option value="medium">Gói vừa (20-35m²)</option>
                  <option value="large">Gói lớn ({">"} 35m²)</option>
                </select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Ghi chú thêm</label>
            <textarea {...register('note')} rows={3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Nhập các yêu cầu khác nếu có..."></textarea>
            {errors.note && <p className="text-red-500 text-xs">{errors.note.message}</p>}
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Lưu ý:</strong> Giá chỉ mang tính ước tính. Admin sẽ xác nhận lại chi phí cụ thể sau khi tiếp nhận yêu cầu của bạn.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi yêu cầu...' : 'Hoàn tất đặt lịch'}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
