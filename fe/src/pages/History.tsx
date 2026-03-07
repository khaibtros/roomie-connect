import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, MapPin, DollarSign } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ViewedRoom {
  id: string;
  title: string;
  price: number;
  location: string;
  image?: string;
  viewedAt: string;
}

export default function History() {
  const navigate = useNavigate();
  const [viewedRooms, setViewedRooms] = useState<ViewedRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem('viewedRoomsDetail') || '[]';
      const rooms = JSON.parse(stored);
      setViewedRooms(rooms.reverse());
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử xem?')) {
      localStorage.removeItem('viewedRoomsDetail');
      setViewedRooms([]);
    }
  };

  const removeFromHistory = (id: string) => {
    const updated = viewedRooms.filter(room => room.id !== id);
    setViewedRooms(updated);
    localStorage.setItem('viewedRoomsDetail', JSON.stringify(updated));
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <button
            onClick={() => navigate('/profile')}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Lịch Sử Xem</h1>
            <p className="text-muted-foreground">Những phòng bạn đã xem gần đây</p>
          </div>
        </motion.div>

        {/* Actions */}
        {viewedRooms.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end gap-2 mb-6"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadHistory()}
            >
              🔄 Làm mới
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearHistory}
            >
              🗑️ Xóa tất cả
            </Button>
          </motion.div>
        )}

        {/* Empty State */}
        {viewedRooms.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-gray-500 text-lg mb-4">Chưa có phòng nào được xem</p>
            <Button onClick={() => navigate('/find-room')}>
              Bắt đầu tìm phòng
            </Button>
          </motion.div>
        )}

        {/* Rooms List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
          {viewedRooms.map((room, idx) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 p-4 rounded-lg bg-card hover:shadow-md transition-shadow group"
            >
              {/* Image */}
              {room.image && (
                <img
                  src={room.image}
                  alt={room.title}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{room.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{room.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>{room.price.toLocaleString()} VNĐ/tháng</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Xem vào: {new Date(room.viewedAt).toLocaleDateString('vi-VN')}
                </p>
              </div>

              {/* Delete Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => removeFromHistory(room.id)}
                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 hover:bg-red-100"
              >
                <Trash2 className="h-5 w-5 text-red-600" />
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Layout>
  );
}
