import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Trash2, Bell } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'message' | 'match' | 'room' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'Tin nhắn mới từ Linh',
    description: 'Phòng này còn trống không ạ?',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'match',
    title: 'Bạn ở ghép mới!',
    description: 'Bạn khớp được 95% với Minh - người tìm ở ghép gần bạn',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'room',
    title: 'Phòng yêu thích được cập nhật',
    description: 'Phòng K1-302 tại Lạc Long Quân giảm giá 500k/tháng',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    toast.success('Đã đánh dấu tất cả là đã đọc');
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    toast.success('Đã xóa thông báo');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-800';
      case 'match': return 'bg-red-100 text-red-800';
      case 'room': return 'bg-yellow-100 text-yellow-800';
      case 'alert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Thông Báo</h1>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} thông báo mới</Badge>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllAsRead}>
              Đánh dấu tất cả là đã đọc
            </Button>
          )}
        </motion.div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Không có thông báo nào</p>
          </motion.div>
        )}

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {notifications.map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => markAsRead(notif.id)}
              className={`p-4 rounded-lg transition-all cursor-pointer group ${
                notif.read ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTypeColor(notif.type)}>
                      {notif.type === 'message' && '💬'}
                      {notif.type === 'match' && '❤️'}
                      {notif.type === 'room' && '🔔'}
                      {notif.type === 'alert' && '⚠️'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900">{notif.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notif.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.timestamp).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.id);
                  }}
                  className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}
