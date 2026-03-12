import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type Rating = 1 | 2 | 3 | 4 | 5;

const sentimentText: Record<Rating, string> = {
  1: '😞 Rất không hài lòng',
  2: '😕 Chưa hài lòng',
  3: '😐 Bình thường',
  4: '😊 Hài lòng',
  5: '🥰 Rất hài lòng',
};

export default function AppRating() {
  const navigate = useNavigate();
  const [rating, setRating] = useState<Rating | null>(null);
  const [hoveredRating, setHoveredRating] = useState<Rating | null>(null);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Vui lòng chọn đánh giá sao');
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success('Cảm ơn đánh giá của bạn!');
    setSubmitted(true);

    // Redirect after 2 seconds
    setTimeout(() => {
      navigate('/profile');
    }, 2000);
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container max-w-2xl py-20 flex items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="text-6xl mb-4"
            >
              ✨
            </motion.div>
            <h2 className="text-3xl font-bold mb-2">Cảm Ơn!</h2>
            <p className="text-gray-600 mb-4">
              Đánh giá của bạn giúp chúng tôi cải thiện dịch vụ
            </p>
            <p className="text-sm text-gray-500">Quay trở lại trong 2 giây...</p>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-6">
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
            <h1 className="text-3xl font-bold">Đánh Giá Ứng Dụng</h1>
            <p className="text-muted-foreground">Cho chúng tôi biết bạn nghĩ gì về Roomie Connect</p>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 text-center max-w-md mx-auto"
        >
          {/* Star Rating */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Bạn cảm thấy thế nào về ứng dụng?</h2>
            <div className="flex justify-center gap-3 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star as Rating)}
                  onMouseEnter={() => setHoveredRating(star as Rating)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="transition-all"
                >
                  <Star
                    size={48}
                    className={`transition-all ${
                      (hoveredRating ? hoveredRating >= star : rating && rating >= star)
                        ? 'fill-yellow-400 stroke-yellow-400'
                        : 'stroke-gray-300'
                    }`}
                  />
                </motion.button>
              ))}
            </div>

            {/* Sentiment Text */}
            {(rating || hoveredRating) && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-semibold text-gray-700"
              >
                {sentimentText[hoveredRating || rating!]}
              </motion.p>
            )}
          </div>

          {/* Divider */}
          <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-6 rounded-full" />

          {/* Review Text */}
          <div className="text-left mb-6">
            <label className="block text-sm font-medium mb-3">
              💭 Chia Sẻ Thêm (Tùy Chọn)
            </label>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Những tính năng yêu thích? Cách cải thiện?..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="w-full"
          >
            {isSubmitting ? '⏳ Đang Gửi...' : '✅ Gửi Đánh Giá'}
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            Đánh giá của bạn hoàn toàn bảo mật và giúp chúng tôi phát triển
          </p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12"
        >
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">🚀</div>
            <h3 className="font-semibold text-sm">Cải Thiện Nhanh</h3>
            <p className="text-xs text-gray-600 mt-1">Chúng tôi xem xét mỗi đánh giá</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">🛡️</div>
            <h3 className="font-semibold text-sm">Bảo Mật</h3>
            <p className="text-xs text-gray-600 mt-1">Dữ liệu của bạn được bảo vệ</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-3xl mb-2">💝</div>
            <h3 className="font-semibold text-sm">Cảm Ơn</h3>
            <p className="text-xs text-gray-600 mt-1">Chúng tôi đánh giá cao ý kiến của bạn</p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
