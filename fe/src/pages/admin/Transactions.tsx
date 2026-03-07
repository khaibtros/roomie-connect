import React, { useState } from 'react';
import AdminLayout from '@/layouts/AdminLayout';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Download, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'deposit' | 'withdrawal';
  userId: string;
  userName: string;
  amount: number;
  balance: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  description: string;
  relatedRoom?: string;
  createdAt: string;
  transactionDate: string;
}

const mockTransactions: Transaction[] = [
  {
    id: 'TXN001',
    type: 'payment',
    userId: 'U001',
    userName: 'Nguyễn Văn A',
    amount: 1500000,
    balance: 8500000,
    status: 'completed',
    paymentMethod: 'Debit Card',
    description: 'Thanh toán tiền đăng tin phòng cho thuê',
    relatedRoom: 'Phòng đẹp gần FPT',
    createdAt: '2026-02-28 14:30',
    transactionDate: '2026-02-28'
  },
  {
    id: 'TXN002',
    type: 'refund',
    userId: 'U002',
    userName: 'Trần Thị B',
    amount: 500000,
    balance: 4500000,
    status: 'completed',
    paymentMethod: 'Bank Transfer',
    description: 'Hoàn tiền hủy tin đăng',
    relatedRoom: 'Ký túc xá sinh viên',
    createdAt: '2026-02-28 10:15',
    transactionDate: '2026-02-28'
  },
  {
    id: 'TXN003',
    type: 'deposit',
    userId: 'U003',
    userName: 'Lê Văn C',
    amount: 5000000,
    balance: 5000000,
    status: 'completed',
    paymentMethod: 'Vietcombank',
    description: 'Nạp tiền vào tài khoản',
    createdAt: '2026-02-27 09:45',
    transactionDate: '2026-02-27'
  },
  {
    id: 'TXN004',
    type: 'payment',
    userId: 'U004',
    userName: 'Phạm Minh D',
    amount: 2000000,
    balance: 3000000,
    status: 'pending',
    paymentMethod: 'Credit Card',
    description: 'Thanh toán gói VIP quản lý phòng',
    createdAt: '2026-02-27 16:20',
    transactionDate: '2026-02-27'
  },
  {
    id: 'TXN005',
    type: 'withdrawal',
    userId: 'U005',
    userName: 'Vũ Thị E',
    amount: 3000000,
    balance: 2000000,
    status: 'failed',
    paymentMethod: 'MBBank',
    description: 'Rút tiền thu chi từ cho thuê phòng',
    createdAt: '2026-02-26 13:00',
    transactionDate: '2026-02-26'
  }
];

const typeConfig = {
  payment: { icon: ArrowUpRight, label: 'Thanh toán', color: 'text-red-600' },
  refund: { icon: ArrowDownLeft, label: 'Hoàn tiền', color: 'text-green-600' },
  deposit: { icon: ArrowDownLeft, label: 'Nạp tiền', color: 'text-green-600' },
  withdrawal: { icon: ArrowUpRight, label: 'Rút tiền', color: 'text-red-600' },
};

const statusConfig = {
  completed: { bg: 'bg-green-50', color: 'text-green-700', border: 'border-green-200', label: 'Hoàn tất' },
  pending: { bg: 'bg-yellow-50', color: 'text-yellow-700', border: 'border-yellow-200', label: 'Chưa xử lý' },
  failed: { bg: 'bg-red-50', color: 'text-red-700', border: 'border-red-200', label: 'Thất bại' },
};

const currency = (val: number) => val.toLocaleString('vi-VN') + '₫';

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTransactions = mockTransactions.filter((txn) => {
    const matchSearch = 
      txn.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchType = filterType === 'all' || txn.type === filterType;
    const matchStatus = filterStatus === 'all' || txn.status === filterStatus;
    
    return matchSearch && matchType && matchStatus;
  });

  const totalRevenue = mockTransactions
    .filter(t => t.type === 'payment' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRefunds = mockTransactions
    .filter(t => (t.type === 'refund' || t.type === 'withdrawal') && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingAmount = mockTransactions
    .filter(t => t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-green-600" />
            Quản lý Giao dịch
          </h1>
          <p className="text-muted-foreground mt-2">Theo dõi tất cả giao dịch thanh toán trong hệ thống</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
            <div className="text-sm text-muted-foreground">Tổng doanh thu</div>
            <div className="text-2xl font-bold mt-1 text-green-600">{currency(totalRevenue)}</div>
            <div className="text-xs text-muted-foreground mt-2">Từ thanh toán đã hoàn tất</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
            <div className="text-sm text-muted-foreground">Tổng hoàn tiền</div>
            <div className="text-2xl font-bold mt-1 text-red-600">{currency(totalRefunds)}</div>
            <div className="text-xs text-muted-foreground mt-2">Hoàn tiền + Rút tiền</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
            <div className="text-sm text-muted-foreground">Chờ xử lý</div>
            <div className="text-2xl font-bold mt-1 text-yellow-600">{currency(pendingAmount)}</div>
            <div className="text-xs text-muted-foreground mt-2">Giao dịch chưa hoàn tất</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-border">
            <div className="text-sm text-muted-foreground">Tổng giao dịch</div>
            <div className="text-2xl font-bold mt-1">{mockTransactions.length}</div>
            <div className="text-xs text-muted-foreground mt-2">Tất cả các giao dịch</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-border space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, mô tả, ID giao dịch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Loại giao dịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="payment">Thanh toán</SelectItem>
                  <SelectItem value="refund">Hoàn tiền</SelectItem>
                  <SelectItem value="deposit">Nạp tiền</SelectItem>
                  <SelectItem value="withdrawal">Rút tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="completed">Hoàn tất</SelectItem>
                  <SelectItem value="pending">Chưa xử lý</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full md:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Người dùng</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Loại</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Số tiền</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phương thức</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Trạng thái</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Không tìm thấy giao dịch nào
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => {
                  const TypeIcon = typeConfig[txn.type].icon;
                  const statusInfo = statusConfig[txn.status];
                  
                  return (
                    <tr key={txn.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{txn.id}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium">{txn.userName}</div>
                        <div className="text-xs text-muted-foreground">{txn.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className={`h-4 w-4 ${typeConfig[txn.type].color}`} />
                          <span className="text-sm font-medium">{typeConfig[txn.type].label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">
                        <span className={txn.type === 'payment' || txn.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}>
                          {txn.type === 'payment' || txn.type === 'withdrawal' ? '-' : '+'}{currency(txn.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{txn.paymentMethod}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={`${statusInfo.color} border-current`}>
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{txn.transactionDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Recent transactions */}
        <div className="text-sm text-muted-foreground">
          Hiển thị {filteredTransactions.length} trong {mockTransactions.length} giao dịch
        </div>
      </div>
    </AdminLayout>
  );
}
