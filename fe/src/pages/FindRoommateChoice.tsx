import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';

export default function FindRoommateChoice() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goQuiz = () => navigate('/quiz');

  const handleStartQuiz = () => {
    if (!isAuthenticated) {
      navigate('/auth/login?returnTo=/quiz');
      return;
    }
    goQuiz();
  };

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <h1 className="text-2xl font-bold mb-4">Bạn muốn tìm bạn ở ghép bằng cách nào?</h1>
        <p className="text-muted-foreground mb-6">Chọn một trong hai phương pháp dưới đây để tiếp tục.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <div>
                <h2 className="font-semibold">Bộ câu hỏi trắc nghiệm tính cách</h2>
                <p className="text-sm text-muted-foreground">Sử dụng bộ câu hỏi được biên soạn để tìm roommate phù hợp.</p>
              </div>
            </div>
            <Button onClick={handleStartQuiz} className="w-full">Trả lời bộ câu hỏi</Button>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <Bot className="h-8 w-8 text-amber-500" />
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  Sử dụng AI Chatbot
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-semibold">VIP</span>
                </h2>
                <p className="text-sm text-muted-foreground">AI sẽ gợi ý nhanh các ứng viên phù hợp. (Dịch vụ VIP)</p>
              </div>
            </div>
            <Button onClick={() => navigate('/tenant/ai-chat')} className="w-full">Mở AI Chatbot (VIP)</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}