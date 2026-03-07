import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { AlertCircle, Filter, Search, Eye, Trash2, Check, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Report {
  id: string;
  type: 'complaint' | 'report';
  userId: string;
  userName: string;
  email: string;
  roomId?: string;
  roomTitle?: string;
  subject: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  note?: string;
}

const mockReports: Report[] = [
  {
    id: 'RPT001',
    type: 'complaint',
    userId: 'U001',
    userName: 'Nguyễn Văn A',
    email: 'nguyen.a@email.com',
    roomId: 'R001',
    roomTitle: 'Phòng đẹp gần FPT',
    subject: 'Chủ trọ không trả tiền cọc',
    description: 'Tôi đã thanh toán tiền cọc 5 triệu nhưng chủ không hoàn trả sau khi tôi chuyển đi.',
    status: 'reviewing',
    priority: 'high',
    createdAt: '2026-02-28',
    note: 'Đang liên hệ chủ trọ để xác minh'
  },
  {
    id: 'RPT002',
    type: 'report',
    userId: 'U002',
    userName: 'Trần Thị B',
    email: 'tran.b@email.com',
    roomId: 'R002',
    roomTitle: 'Ký túc xá sinh viên',
    subject: 'Hình ảnh chứa nội dung không phù hợp',
    description: 'Bài đăng có chứa hình ảnh vi phạm tiêu chuẩn cộng đồng.',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2026-02-27',
    resolvedAt: '2026-02-28',
    note: 'Đã xóa bài đăng không phù hợp'
  },
  {
    id: 'RPT003',
    type: 'complaint',
    userId: 'U003',
    userName: 'Lê Văn C',
    email: 'le.c@email.com',
    subject: 'Gặp vấn đề khi thanh toán',
    description: 'Hệ thống thanh toán bị lỗi, tiền bị trừ nhưng không xác nhận đăng phòng.',
    status: 'pending',
    priority: 'critical',
    createdAt: '2026-02-28'
  },
  {
    id: 'RPT004',
    type: 'report',
    userId: 'U004',
    userName: 'Phạm Minh D',
    email: 'pham.d@email.com',
    roomId: 'R004',
    roomTitle: 'Phòng cho nữ sinh viên',
    subject: 'Spam - Bài đăng lặp lại',
    description: 'Người dùng này đã đăng nhiều bài giống nhau, làm ảnh hưởng đến chất lượng tìm kiếm.',
    status: 'resolved',
    priority: 'low',
    createdAt: '2026-02-26',
    resolvedAt: '2026-02-27'
  }
];

const statusConfig = {
  pending: { bg: 'bg-yellow-50', color: 'text-yellow-700', border: 'border-yellow-200', label: 'Chưa xử lý' },
  reviewing: { bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200', label: 'Đang xem xét' },
  resolved: { bg: 'bg-green-50', color: 'text-green-700', border: 'border-green-200', label: 'Đã giải quyết' },
  rejected: { bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-200', label: 'Bị từ chối' },
};

const priorityConfig = {
  low: { label: 'Thấp', color: 'bg-gray-100 text-gray-700' },
  medium: { label: 'Trung bình', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Rất cao', color: 'bg-red-100 text-red-700' },
};

export default function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filteredReports = mockReports.filter((report) => {
    const matchSearch = 
      report.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchPriority = filterPriority === 'all' || report.priority === filterPriority;
    
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            Báo cáo & Khiếu nại
          </h1>
          <p className="text-muted-foreground mt-2">Quản lý các khiếu nại và báo cáo từ người dùng</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
            <div className="text-sm text-muted-foreground">Tổng khiếu nại</div>
            <div className="text-2xl font-bold mt-1">
              {mockReports.filter(r => r.type === 'complaint').length}
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
            <div className="text-sm text-yellow-700">Chưa xử lý</div>
            <div className="text-2xl font-bold mt-1 text-yellow-900">
              {mockReports.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
            <div className="text-sm text-blue-700">Đang xem xét</div>
            <div className="text-2xl font-bold mt-1 text-blue-900">
              {mockReports.filter(r => r.status === 'reviewing').length}
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
            <div className="text-sm text-green-700">Đã giải quyết</div>
            <div className="text-2xl font-bold mt-1 text-green-900">
              {mockReports.filter(r => r.status === 'resolved').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, email, tiêu đề..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chưa xử lý</SelectItem>
                  <SelectItem value="reviewing">Đang xem xét</SelectItem>
                  <SelectItem value="resolved">Đã giải quyết</SelectItem>
                  <SelectItem value="rejected">Bị từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Mức độ ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả mức độ</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="critical">Rất cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Người báo cáo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ưu tiên</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Trạng thái</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Không tìm thấy báo cáo nào
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const statusInfo = statusConfig[report.status];
                  const priorityInfo = priorityConfig[report.priority];
                  
                  return (
                    <tr key={report.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{report.id}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium">{report.userName}</div>
                        <div className="text-xs text-muted-foreground">{report.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium line-clamp-2">{report.subject}</div>
                        {report.roomTitle && (
                          <div className="text-xs text-muted-foreground">{report.roomTitle}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`${statusInfo.color} border-current`}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{report.createdAt}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold">Chi tiết báo cáo</h2>
                <button onClick={() => setSelectedReport(null)} className="text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">ID</div>
                    <div className="font-medium">{selectedReport.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Ngày tạo</div>
                    <div className="font-medium">{selectedReport.createdAt}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Người báo cáo</div>
                    <div className="font-medium">{selectedReport.userName}</div>
                    <div className="text-sm text-muted-foreground">{selectedReport.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Loại</div>
                    <Badge variant={selectedReport.type === 'complaint' ? 'default' : 'secondary'}>
                      {selectedReport.type === 'complaint' ? 'Khiếu nại' : 'Báo cáo'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Ưu tiên</div>
                    <Badge className={priorityConfig[selectedReport.priority].color}>
                      {priorityConfig[selectedReport.priority].label}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Trạng thái</div>
                    <Badge variant="outline" className={`${statusConfig[selectedReport.status].color} border-current`}>
                      {statusConfig[selectedReport.status].label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Tiêu đề</div>
                  <div className="font-medium text-base">{selectedReport.subject}</div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Mô tả</div>
                  <div className="text-base bg-muted/50 p-4 rounded-lg">{selectedReport.description}</div>
                </div>

                {selectedReport.roomTitle && (
                  <div>
                    <div className="text-sm text-muted-foreground">Tin đăng liên quan</div>
                    <div className="font-medium">{selectedReport.roomTitle}</div>
                  </div>
                )}

                {selectedReport.note && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Ghi chú</div>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm">{selectedReport.note}</div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button className="flex-1" onClick={() => setSelectedReport(null)}>
                    <Check className="h-4 w-4 mr-2" />
                    Đã giải quyết
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedReport(null)}>
                    <Clock className="h-4 w-4 mr-2" />
                    Đang xem xét
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setSelectedReport(null)}>
                    <X className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
