import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, Sparkles, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';

const ServicesList = () => {
  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dịch vụ hỗ trợ</h1>
            <p className="text-muted-foreground mt-2">
              Các dịch vụ tiện ích giúp bạn chuyển trọ và sinh hoạt dễ dàng hơn.
            </p>
          </div>
          <Link to="/services/my-bookings">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" />
              Lịch sử đặt dịch vụ
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Vận Chuyển */}
          <div className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Vận chuyển đồ đạc</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Hỗ trợ chở đồ từ trọ cũ sang trọ mới nhanh chóng, an toàn. Phù hợp cho mọi nhu cầu chuyển trọ.
            </p>
            <ul className="mb-6 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Có nhiều loại xe: Xe máy, ba gác, xe tải.
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Hỗ trợ bê vác lên/xuống tầng.
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Đảm bảo an toàn tài sản.
              </li>
            </ul>
            <Link to="/services/book/moving" className="block">
              <Button className="w-full gap-2 group-hover:bg-primary/90">
                Đặt lịch chuyển đồ <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Card Dọn Dẹp */}
          <div className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Dọn dẹp phòng trọ</h3>
            <p className="mb-4 text-muted-foreground text-sm">
              Làm sạch phòng trọ trước khi chuyển vào hoặc dọn dẹp định kỳ. Giúp không gian sống luôn sạch sẽ.
            </p>
            <ul className="mb-6 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Gói nhỏ ({"<"} 20m²), vừa (20-35m²), lớn ({">"} 35m²).
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Dọn dẹp cơ bản hoặc tổng vệ sinh (deep cleaning).
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Nhân viên cẩn thận, nhiệt tình.
              </li>
            </ul>
            <Link to="/services/book/cleaning" className="block">
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800">
                Đặt lịch dọn dẹp <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServicesList;
