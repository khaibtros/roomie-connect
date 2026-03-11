import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Mail, MessageSquare, Phone, ChevronDown } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    id: '1',
    category: 'Tài Khoản',
    question: 'Làm cách nào để thay đổi mật khẩu?',
    answer: 'Hãy vào Hồ sơ > Bảo mật > Thay đổi mật khẩu. Bạn sẽ cần xác minh email của mình.',
  },
  {
    id: '2',
    category: 'Tài Khoản',
    question: 'Làm cách nào để kích hoạt xác minh hai yếu tố?',
    answer: 'Tùy chọn xác minh hai yếu tố có sẵn trong cài đặt bảo mật. Bạn có thể sử dụng ứng dụng xác thực hoặc SMS.',
  },
  {
    id: '3',
    category: 'Phòng',
    question: 'Tôi có thể tìm kiếm phòng ở thành phố nào?',
    answer: 'Hiện tại, chúng tôi có phòng ở Hà Nội, TP.HCM, Đà Nẵng, Hải Phòng và Cần Thơ. Chúng tôi sắp mở rộng sang các thành phố khác.',
  },
  {
    id: '4',
    category: 'Phòng',
    question: 'Chi phí danh sách phòng bao nhiêu?',
    answer: 'Danh sách phòng là miễn phí. Chúng tôi chỉ tính phí cho các dịch vụ tiêu đề cao như nâng cấp hoặc quảng cáo.',
  },
  {
    id: '5',
    category: 'AI',
    question: 'Dịch vụ AI Matching hoạt động như thế nào?',
    answer: 'AI Analysis sử dụng trí tuệ nhân tạo để phân tích sở thích của bạn và gợi ý ứng viên phòng hoặc bạn cùng phòng tương thích nhất.',
  },
  {
    id: '6',
    category: 'AI',
    question: 'Tôi có thể hủy đăng ký DịchVụ AI không?',
    answer: 'Có, bạn có thể hủy đăng ký bất cứ lúc nào từ Bảng giá. Bạn sẽ giữ quyền truy cập cho đến cuối chu kỳ thanh toán của mình.',
  },
];

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function Support() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = Array.from(new Set(FAQS.map(f => f.category)));
  const filteredFAQs = FAQS;

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Vui lòng điền tất cả các trường');
      return;
    }
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Tin nhắn đã được gửi! Chúng tôi sẽ trả lời trong 24 giờ.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-6">
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
            <h1 className="text-3xl font-bold">Trung Tâm Hỗ Trợ</h1>
            <p className="text-muted-foreground">Chúng tôi ở đây để giúp bạn</p>
          </div>
        </motion.div>

        {/* Quick Support Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-blue-50 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
            <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold">Chat Trực Tiếp</h3>
            <p className="text-sm text-gray-600 mt-1">Phản hồi trong vòng 1 giờ</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Bắt Đầu Chat
            </Button>
          </div>
          <div className="bg-green-50 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
            <Mail className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold">Email Hỗ Trợ</h3>
            <p className="text-sm text-gray-600 mt-1">support@roomie.io</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Gửi Email
            </Button>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg text-center hover:shadow-md transition-shadow">
            <Phone className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold">Gọi Chúng Tôi</h3>
            <p className="text-sm text-gray-600 mt-1">1900 1234 (Miễn phí)</p>
            <Button variant="outline" size="sm" className="mt-3 w-full">
              Gọi Ngay
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-4 mb-8 border-b"
        >
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 font-semibold transition-colors ${
              activeTab === 'faq'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🞘 FAQ Phổ Biến
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`pb-3 font-semibold transition-colors ${
              activeTab === 'contact'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✉️ Liên Hệ Chúng Tôi
          </button>
        </motion.div>

        {/* Content */}
        {activeTab === 'faq' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <Badge key={cat} variant="outline">
                  {cat}
                </Badge>
              ))}
            </div>

            {filteredFAQs.map((faq, idx) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted transition-colors text-left"
                >
                  <div>
                    <Badge variant="secondary">{faq.category}</Badge>
                    <h3 className="font-semibold mt-2">{faq.question}</h3>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 transition-transform ${
                      expandedFAQ === faq.id ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {expandedFAQ === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t px-4 py-3 bg-muted/50"
                  >
                    <p className="text-gray-700">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}

        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl"
          >
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên của bạn</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Nhập tên của bạn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Chủ Đề</label>
                <Input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleFormChange}
                  placeholder="Chủ đề của tin nhắn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tin Nhắn</label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  placeholder="Nội dung tin nhắn của bạn..."
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Đang Gửi...' : '📤 Gửi Tin Nhắn'}
              </Button>
            </form>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
