import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { Settings, Save, Bell, Lock, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  enableRegistration: boolean;
  enablePayment: boolean;
  maxUploadSize: number;
  sessionTimeout: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  maintenanceMessage: string;
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'KnockKnock - Tìm phòng cho thuê',
    siteDescription: 'Nền tảng tìm kiếm phòng cho thuê và bạn ở ghép hàng đầu',
    supportEmail: 'support@knockknock.local',
    supportPhone: '+84 24 1234 5678',
    maintenanceMode: false,
    enableRegistration: true,
    enablePayment: true,
    maxUploadSize: 10,
    sessionTimeout: 30,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMessage: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof SystemSettings, value: SystemSettings[keyof SystemSettings]) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast.success('Cài đặt đã được lưu thành công!');
    setHasChanges(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-blue-600" />
            Cài đặt Hệ thống
          </h1>
          <p className="text-muted-foreground mt-2">Quản lý các cài đặt cơ bản của hệ thống</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-border">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
            {/* Sidebar */}
            <div className="border-r border-border bg-muted/50 p-4 lg:p-6">
              <h3 className="font-semibold mb-4">Các mục cài đặt</h3>
              <div className="space-y-2">
                {[
                  { icon: Globe, label: 'Thông tin chung' },
                  { icon: Lock, label: 'Bảo mật', disabled: true },
                  { icon: Bell, label: 'Thông báo' },
                  { icon: Zap, label: 'Hiệu năng' },
                ].map(({ icon: Icon, label, disabled }) => (
                  <button
                    key={label}
                    disabled={disabled}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 p-6 space-y-8">
              {/* General Information */}
              <section className="space-y-4 pb-6 border-b border-border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Thông tin chung
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="siteName">Tên trang web</Label>
                    <Input
                      id="siteName"
                      value={settings.siteName}
                      onChange={(e) => handleChange('siteName', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="siteDescription">Mô tả trang web</Label>
                    <textarea
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => handleChange('siteDescription', e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-border rounded-lg resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supportEmail">Email hỗ trợ</Label>
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => handleChange('supportEmail', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supportPhone">Số điện thoại hỗ trợ</Label>
                      <Input
                        id="supportPhone"
                        type="tel"
                        value={settings.supportPhone}
                        onChange={(e) => handleChange('supportPhone', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Maintenance */}
              <section className="space-y-4 pb-6 border-b border-border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Chế độ bảo trì
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div>
                      <Label className="font-semibold">Bật chế độ bảo trì</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Khi bật, người dùng sẽ thấy trang bảo trì thay vì sử dụng ứng dụng
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
                    />
                  </div>
                  {settings.maintenanceMode && (
                    <div>
                      <Label htmlFor="maintenanceMessage">Thông báo bảo trì</Label>
                      <textarea
                        id="maintenanceMessage"
                        value={settings.maintenanceMessage}
                        onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                        className="w-full mt-2 px-3 py-2 border border-border rounded-lg resize-none"
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Features */}
              <section className="space-y-4 pb-6 border-b border-border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Tính năng
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-semibold">Cho phép đăng ký</Label>
                      <p className="text-sm text-muted-foreground mt-1">Cho phép người dùng mới tạo tài khoản</p>
                    </div>
                    <Switch
                      checked={settings.enableRegistration}
                      onCheckedChange={(checked) => handleChange('enableRegistration', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-semibold">Cho phép thanh toán</Label>
                      <p className="text-sm text-muted-foreground mt-1">Cho phép giao dịch thanh toán trong hệ thống</p>
                    </div>
                    <Switch
                      checked={settings.enablePayment}
                      onCheckedChange={(checked) => handleChange('enablePayment', checked)}
                    />
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section className="space-y-4 pb-6 border-b border-border">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Thông báo
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-semibold">Thông báo qua email</Label>
                      <p className="text-sm text-muted-foreground mt-1">Gửi thông báo cho người dùng qua email</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="font-semibold">Thông báo qua SMS</Label>
                      <p className="text-sm text-muted-foreground mt-1">Gửi thông báo cho người dùng qua SMS</p>
                    </div>
                    <Switch
                      checked={settings.smsNotifications}
                      onCheckedChange={(checked) => handleChange('smsNotifications', checked)}
                    />
                  </div>
                </div>
              </section>

              {/* Performance */}
              <section className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Hiệu năng
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maxUploadSize">Kích thước tải lên tối đa (MB)</Label>
                    <Input
                      id="maxUploadSize"
                      type="number"
                      value={settings.maxUploadSize}
                      onChange={(e) => handleChange('maxUploadSize', parseInt(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionTimeout">Hết thời gian phiên (phút)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) => handleChange('sessionTimeout', parseInt(e.target.value) || 0)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-border p-4">
            <p className="text-sm text-muted-foreground mb-3">Bạn có thay đổi chưa lưu</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSettings({
                    siteName: 'KnockKnock - Tìm phòng cho thuê',
                    siteDescription: 'Nền tảng tìm kiếm phòng cho thuê và bạn ở ghép hàng đầu',
                    supportEmail: 'support@knockknock.local',
                    supportPhone: '+84 24 1234 5678',
                    maintenanceMode: false,
                    enableRegistration: true,
                    enablePayment: true,
                    maxUploadSize: 10,
                    sessionTimeout: 30,
                    emailNotifications: true,
                    smsNotifications: false,
                    maintenanceMessage: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
                  });
                  setHasChanges(false);
                }}
              >
                Hủy
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
