import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Eye, Phone, AlertTriangle } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PrivacySetting {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  enabled: boolean;
  action: string;
}

export default function Privacy() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PrivacySetting[]>([
    {
      id: 'profile_public',
      title: 'Hồ sơ công khai',
      description: 'Cho phép người khác xem hồ sơ của bạn',
      icon: <Eye className="h-5 w-5" />,
      enabled: true,
      action: 'public',
    },
    {
      id: 'show_phone',
      title: 'Hiển thị số điện thoại',
      description: 'Cho phép hiển thị số điện thoại trong tin nhắn',
      icon: <Phone className="h-5 w-5" />,
      enabled: false,
      action: 'phone',
    },
    {
      id: 'activity_status',
      title: 'Trạng thái hoạt động',
      description: 'Cho phép người khác biết bạn đang online',
      icon: <Eye className="h-5 w-5" />,
      enabled: true,
      action: 'status',
    },
  ]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
    const setting = settings.find(s => s.id === id);
    toast.success(`${setting?.title} được ${!setting?.enabled ? 'bật' : 'tắt'}`);
  };

  const handleDataExport = () => {
    toast.success('Đang tải xuống dữ liệu của bạn...');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    toast.success('Yêu cầu xóa tài khoản được gửi. Nó sẽ được xóa trong 30 ngày');
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Quyền Riêng Tư</h1>
            <p className="text-muted-foreground">Quản lý cài đặt quyền riêng tư của bạn</p>
          </div>
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 mb-8"
        >
          <h2 className="text-lg font-bold">Cài Đặt Riêng Tư</h2>
          {settings.map((setting, idx) => (
            <motion.div
              key={setting.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card rounded-lg p-4 flex items-start justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mt-1">
                  {setting.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{setting.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                </div>
              </div>
              <button
                onClick={() => toggleSetting(setting.id)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  setting.enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <motion.span
                  layout
                  className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
                  animate={{ x: setting.enabled ? 28 : 4 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Data Export */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-blue-50 rounded-lg p-6 mb-8"
        >
          <h2 className="text-lg font-bold mb-4">Xuất Dữ Liệu</h2>
          <p className="text-gray-600 mb-4">Tải xuống một bản sao tất cả dữ liệu cá nhân của bạn</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDataExport}>
              📥 Tải Dữ Liệu
            </Button>
            <Button variant="outline" onClick={handleDataExport}>
              📄 Báo Cáo Quyền Riêng Tư
            </Button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border-2 border-red-200 rounded-lg p-6"
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-900">Vùng Nguy Hiểm</h2>
              <p className="text-sm text-red-700">Những hành động này không thể hoàn tác</p>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full"
          >
            🗑️ Xóa Tài Khoản Vĩnh Viễn
          </Button>

          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-white rounded-lg border-2 border-red-500"
            >
              <p className="font-semibold text-red-900 mb-4">
                Bạn chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác!
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="flex-1">
                  Hủy
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount} className="flex-1">
                  Xác Nhận Xóa
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
