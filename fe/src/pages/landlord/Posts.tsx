import { useState, useEffect } from 'react';
import React from "react";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  Edit,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Copy,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LandlordLayout from '@/components/layouts/LandlordLayout';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api';
import { mapApiRoomToRoom, type LandlordRoom } from '@/utils/mappers/roomMapper';

type RoomStatus = 'pending' | 'active' | 'rejected' | 'expired';

type Room = LandlordRoom & { status: RoomStatus };

const statusConfig = {
  pending: {
    label: 'Chờ duyệt',
    color: 'bg-amber-100 text-amber-700',
    icon: Clock,
  },
  active: {
    label: 'Đang hiển thị',
    color: 'bg-emerald-100 text-emerald-700',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Bị từ chối',
    color: 'bg-rose-100 text-rose-700',
    icon: XCircle,
  },
  expired: {
    label: 'Hết hạn',
    color: 'bg-gray-100 text-gray-700',
    icon: AlertCircle,
  },
};

export default function LandlordPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getMyRooms();

      if (error) {
        throw new Error(error);
      }
      const mappedRooms = (data?.rooms || []).map(mapApiRoomToRoom) as Room[];
      setPosts(mappedRooms);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Không thể tải danh sách tin đăng');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await apiClient.deleteRoom(id);

      if (error) {
        throw new Error(error);
      }

      toast.success('Đã xóa tin đăng');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Không thể xóa tin đăng');
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = async (post: Room) => {
    try {
      const { id, created_at, expires_at, status, rejection_reason, ...postData } = post;
      const { error } = await apiClient.createRoom({
        ...postData,
        title: `${postData.title} (Copy)`,
      });

      if (error) {
        throw new Error(error);
      }

      toast.success('Đã sao chép tin đăng');
      fetchPosts();
    } catch (error) {
      console.error('Error duplicating post:', error);
      toast.error('Không thể sao chép tin đăng');
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = activeTab === 'all' || post.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    all: posts.length,
    active: posts.filter(p => p.status === 'active').length,
    pending: posts.filter(p => p.status === 'pending').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
    expired: posts.filter(p => p.status === 'expired').length,
  };

  if (loading) {
    return (
      <LandlordLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </LandlordLayout>
    );
  }

  return (
    <LandlordLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Quản lý tin đăng</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý tất cả tin đăng cho thuê của bạn
            </p>
          </div>
          <Button
            onClick={() => navigate('/landlord/create-post')}
            className="rounded-full shadow-card"
          >
            <Plus className="h-4 w-4 mr-2" />
            Đăng tin mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card className={activeTab === 'all' ? 'border-primary shadow-card' : ''}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.all}</div>
                <div className="text-sm text-muted-foreground">Tất cả</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={activeTab === 'active' ? 'border-emerald-500 shadow-card' : ''}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Đang hiển thị</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={activeTab === 'pending' ? 'border-amber-500 shadow-card' : ''}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Chờ duyệt</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={activeTab === 'rejected' ? 'border-rose-500 shadow-card' : ''}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-rose-600">{stats.rejected}</div>
                <div className="text-sm text-muted-foreground">Bị từ chối</div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={activeTab === 'expired' ? 'border-gray-500 shadow-card' : ''}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
                <div className="text-sm text-muted-foreground">Hết hạn</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tiêu đề, địa chỉ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full lg:w-auto">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="active">Đang hiển thị</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Bị từ chối</TabsTrigger>
            <TabsTrigger value="expired">Hết hạn</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Chưa có tin đăng</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery ? 'Không tìm thấy tin đăng nào phù hợp' : 'Bạn chưa đăng tin cho thuê nào'}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate('/landlord/create-post')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Đăng tin đầu tiên
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-4 p-4">
                      {/* Image */}
                      <div className="w-full sm:w-48 h-32 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                        {post.images && post.images.length > 0 ? (
                          <img
                            src={post.images[0]}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Eye className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/rooms/${post.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Xem tin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/landlord/edit-post/${post.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(post)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Sao chép
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteId(post.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa tin
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                          <span>{post.district}</span>
                          <span>•</span>
                          <span>{post.area ? `${post.area}m²` : 'Chưa rõ diện tích'}</span>
                          <span>•</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(post.price)}/tháng
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={statusConfig[post.status].color}>
                            {React.createElement(statusConfig[post.status].icon, { className: 'h-3 w-3 mr-1' })}
                            {statusConfig[post.status].label}
                          </Badge>

                          {post.status === 'rejected' && post.rejection_reason && (
                            <Badge variant="outline" className="text-rose-600 border-rose-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {post.rejection_reason}
                            </Badge>
                          )}

                          {post.expires_at && (
                            <span className="text-xs text-muted-foreground">
                              Hết hạn: {new Date(post.expires_at).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tin đăng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tin đăng này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Xóa tin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LandlordLayout>
  );
}
