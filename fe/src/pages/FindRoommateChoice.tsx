import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Sparkles, ClipboardList, ClipboardCheck, Users, Home, MessageCircle, CalendarCheck, Lightbulb, CheckCircle2, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import { QuizResults } from "@/types";

const TRAIT_DESCRIPTIONS: Record<string, string> = {
  E: "Hướng ngoại — bạn có xu hướng nạp năng lượng qua giao tiếp, kết nối và các hoạt động chung.",
  I: "Hướng nội — bạn cần không gian riêng, sự yên tĩnh và thời gian cá nhân để nạp lại năng lượng.",
  S: "Giác quan — bạn chú ý đến chi tiết thực tế, trải nghiệm cụ thể và những điều có thể kiểm chứng.",
  N: "Trực giác — bạn quan tâm đến ý tưởng, khả năng, vibe tổng thể và ý nghĩa phía sau sự việc.",
  T: "Lý trí — bạn ưu tiên logic, sự công bằng, tính rõ ràng và hiệu quả khi ra quyết định.",
  F: "Cảm xúc — bạn ưu tiên cảm xúc, sự hài hòa, tinh tế và cảm giác của người liên quan.",
  J: "Nguyên tắc — bạn thích kế hoạch, trật tự, lịch trình rõ ràng và sự ổn định.",
  P: "Linh hoạt — bạn thích sự thoải mái, tự do, dễ thích nghi và không muốn bị ràng buộc quá nhiều.",
  X: "Cân bằng — bạn có thể linh hoạt giữa hai xu hướng tùy hoàn cảnh."
};

const SUGGESTIONS = {
  OPPOSITE: {
    title: "Người đối lập có kiểm soát",
    desc: "Khác biệt ở xu hướng năng lượng (E/I) hoặc tổ chức (J/P) để cân bằng, nhưng tương đồng ở trục quyết định (T/F) để tránh hiểu lầm."
  },
  SYNC: {
    title: "Người đồng hành cùng nhịp",
    desc: "Tương đồng phần lớn các trục, dễ hiểu nhau và ít xung đột trong thói quen sinh hoạt hàng ngày."
  },
  EXPAND: {
    title: "Người mở rộng thế giới",
    desc: "Khác biệt ở trục tiếp nhận thông tin (S/N), mang lại góc nhìn mới, phù hợp nếu bạn thích học hỏi và phát triển bản thân."
  }
};

export default function FindRoommateChoice() {
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [savedResult, setSavedResult] = useState<QuizResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    // If user is mid-retake, go straight to quiz
    if (sessionStorage.getItem("quiz_retake") === "true") {
      navigate("/quiz", { replace: true });
      return;
    }

    const checkProfile = async () => {
      setLoading(true);
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await apiClient.getMyRoommateProfile();
        if (
          data?.profile?.preferences &&
          Object.keys(data.profile.preferences).length > 0
        ) {
          // Load the stored result from sessionStorage first, fallback to API data
          const storedResult = sessionStorage.getItem("quiz_result");
          if (storedResult) {
            setSavedResult(JSON.parse(storedResult) as QuizResults);
          } else {
            // Construct a minimal result from API data so we can show the result card
            setSavedResult(data.profile.preferences as QuizResults);
          }
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [isAuthenticated]);

  const handleRetake = async () => {
    if (!isAuthenticated) {
      navigate("/auth/login?returnTo=/find-roommate");
      return;
    }
    if ((user?.knockCoin ?? 0) < 50) {
      toast.error("Bạn không đủ Knock Coin. Vui lòng nạp thêm!", {
        action: {
          label: "Nạp ngay",
          onClick: () => navigate("/tenant/ai-payment"),
        },
      });
      return;
    }

    setRetaking(true);
    try {
      const { data, error } = await apiClient.payForQuizRetake();
      if (error) {
        if (error.includes("HTTP 402") || error.includes("Not enough")) {
          toast.error("Bạn không đủ Knock Coin. Hãy nạp thêm để tiếp tục!", {
            action: {
              label: "Nạp ngay",
              onClick: () => navigate("/tenant/ai-payment"),
            },
          });
        } else {
          toast.error("Lỗi khi thực hiện giao dịch: " + error);
        }
        return;
      }
      if (data) {
        toast.success("Giao dịch thành công! Đang chuyển hướng...");
        refreshUser();
        setTimeout(() => {
          ["quiz_step", "quiz_answers", "quiz_selected", "quiz_result"].forEach(
            (k) => sessionStorage.removeItem(k)
          );
          sessionStorage.setItem("quiz_retake", "true");
          navigate("/quiz");
        }, 1500);
      }
    } catch {
      toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
    } finally {
      setRetaking(false);
    }
  };

  // --- Loading state ---
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </Layout>
    );
  }

  // --- Has completed quiz → show MBTI result card ---
  if (savedResult) {
    const personalityType = savedResult.personalityType || "XXXX";
    const E_I = personalityType.charAt(0);
    const S_N = personalityType.charAt(1);
    const T_F = personalityType.charAt(2);
    const J_P = personalityType.charAt(3);
    const conflictProfile = savedResult.conflictProfile;

    return (
      <Layout>
        <div className="bg-[#F8FAFC] min-h-screen pt-8 pb-20 font-vietnam">
          <div className="max-w-[1000px] mx-auto px-4 md:px-8">
            <div className="text-center mb-8">
               <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Bạn đã hoàn thành quiz!</h1>
               <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                 Dưới đây là phân tích chi tiết về phong cách sống của bạn, giúp hệ thống tìm ra những người ở ghép tương thích nhất.
               </p>
            </div>

            <div className="space-y-6">
              {/* Personality Dimensions Card */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Mã phong cách sống: <span className="text-primary">{personalityType}</span></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Nguồn năng lượng</p>
                    <p className="text-gray-900 font-medium leading-relaxed">{TRAIT_DESCRIPTIONS[E_I] || "Chưa xác định"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Cách tiếp nhận thông tin</p>
                    <p className="text-gray-900 font-medium leading-relaxed">{TRAIT_DESCRIPTIONS[S_N] || "Chưa xác định"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Cách ra quyết định</p>
                    <p className="text-gray-900 font-medium leading-relaxed">{TRAIT_DESCRIPTIONS[T_F] || "Chưa xác định"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Cách tổ chức sống</p>
                    <p className="text-gray-900 font-medium leading-relaxed">{TRAIT_DESCRIPTIONS[J_P] || "Chưa xác định"}</p>
                  </div>
                </div>
              </div>

              {/* Conflict Profile Card */}
              {conflictProfile && (
                <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <div className="h-10 w-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Cách bạn xử lý mâu thuẫn</h2>
                  </div>
                  <div className="bg-amber-50/50 rounded-xl p-5 border border-amber-100">
                    <h3 className="text-lg font-bold text-amber-900 mb-2">{conflictProfile.title}</h3>
                    <p className="text-amber-800/80 leading-relaxed">{conflictProfile.description}</p>
                  </div>
                </div>
              )}

              {/* Suggestions Card */}
              <div className="bg-white rounded-[24px] p-6 md:p-8 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Gợi ý kết nối roommate</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{SUGGESTIONS.SYNC.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{SUGGESTIONS.SYNC.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{SUGGESTIONS.OPPOSITE.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{SUGGESTIONS.OPPOSITE.desc}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 h-2 w-2 rounded-full bg-purple-400 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{SUGGESTIONS.EXPAND.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{SUGGESTIONS.EXPAND.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
               <Button 
                 onClick={() => navigate("/matches", { state: { preferences: savedResult } })} 
                 className="rounded-full px-8 py-6 text-lg shadow-sm"
               >
                  Xem danh sách roommate phù hợp
               </Button>
               <Button 
                 variant="outline" 
                 onClick={handleRetake}
                 disabled={retaking}
                 className="rounded-full px-8 py-6 text-lg border-gray-300 text-gray-700 hover:bg-gray-50"
               >
                 <RotateCcw className="h-4 w-4 mr-2" />
                 {retaking ? "Đang xử lý..." : "Làm lại bài test (50 KnockCoin)"}
               </Button>
            </div>

          </div>
        </div>
      </Layout>
    );
  }

  // --- Not done quiz yet → show intro screen ---
  return (
    <Layout>
      <div className="bg-[#F3FBF6] min-h-[calc(100vh-80px)] pt-10 pb-20 font-vietnam">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          {/* 2. Hero Section */}
          <div className="bg-gradient-to-r from-[#F3FBF7] to-[#EEF9F2] border border-[#22c55e1f] rounded-[28px] p-8 md:px-16 md:py-12 shadow-[0_18px_45px_rgba(15,23,42,0.08)] flex flex-col lg:flex-row items-center justify-between gap-8">
            
            {/* Left illustration */}
            <div className="hidden lg:flex w-[25%] justify-center relative">
               <div className="absolute inset-0 bg-green-100 rounded-full blur-3xl opacity-50"></div>
               <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-green-50 transform -rotate-6">
                 <ClipboardCheck className="w-24 h-24 text-green-500" />
                 <div className="absolute -right-4 -bottom-4 bg-green-500 rounded-full p-2 shadow-lg">
                   <CheckCircle2 className="w-8 h-8 text-white" />
                 </div>
               </div>
            </div>

            {/* Center text area */}
            <div className="w-full lg:w-[42%] text-center lg:text-left">
              <h1 className="text-3xl md:text-[40px] font-extrabold text-[#103B26] mb-4 leading-tight">
                Trắc nghiệm phong cách sống
              </h1>
              <p className="text-[18px] md:text-[20px] font-medium text-[#103B26] mb-4 leading-relaxed">
                Hiểu rõ thói quen, cách giao tiếp và lối sống của bạn để tìm người ở ghép phù hợp nhất.
              </p>
              <p className="text-[16px] text-[#4B6356] mb-8 leading-[1.6]">
                Bài trắc nghiệm gồm 20 câu hỏi, được xây dựng dựa trên khung tham chiếu tính cách MBTI và các tình huống thực tế khi sống chung. Kết quả sẽ giúp hệ thống hiểu bạn phù hợp với kiểu roommate như thế nào.
              </p>
              <Button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate("/auth/login?returnTo=/find-roommate");
                    return;
                  }
                  // Clear old quiz session data before starting fresh
                  ["quiz_step", "quiz_answers", "quiz_selected", "quiz_result", "quiz_retake"].forEach(k => sessionStorage.removeItem(k));
                  navigate("/quiz");
                }}
                className="w-full sm:w-auto bg-[#16A34A] hover:bg-[#15803d] text-white rounded-full px-8 py-7 text-[18px] font-bold shadow-[0_12px_24px_rgba(22,163,74,0.25)] hover:translate-y-[-1px] transition-all"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Trả lời bộ câu hỏi ngay!
              </Button>
            </div>

            {/* Right illustration */}
            <div className="hidden lg:flex w-[33%] justify-center relative">
               <div className="absolute inset-0 bg-blue-100 rounded-full blur-3xl opacity-40"></div>
               <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white transform hover:scale-105 transition-transform duration-500">
                 <HeartHandshake className="w-32 h-32 text-emerald-600" />
                 <div className="mt-4 flex justify-center gap-2">
                    <div className="w-12 h-3 bg-emerald-100 rounded-full"></div>
                    <div className="w-8 h-3 bg-emerald-200 rounded-full"></div>
                 </div>
               </div>
            </div>
          </div>

          {/* 3. Section Title */}
          <div className="mt-14 mb-8 flex items-center justify-center gap-4">
             <div className="h-[2px] w-12 bg-green-200"></div>
             <h2 className="text-[24px] md:text-[28px] font-extrabold text-[#103B26]">
               Quiz này đánh giá điều gì?
             </h2>
             <div className="h-[2px] w-12 bg-green-200"></div>
          </div>

          {/* 4. 4 Cards MBTI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-white rounded-[22px] p-6 md:p-7 border border-[#E5F3EA] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:-translate-y-[3px] hover:border-green-300 transition-all min-h-[170px] flex flex-col">
               <div className="flex gap-4 items-start mb-3">
                 <div className="bg-[#DCFCE7] p-3 rounded-full shrink-0">
                   <Users className="w-7 h-7 text-[#16A34A]" />
                 </div>
                 <div>
                   <h3 className="text-[19px] font-extrabold text-[#103B26]">Năng lượng sống</h3>
                   <span className="text-[18px] font-extrabold text-[#103B26]">E / I</span>
                 </div>
               </div>
               <p className="text-[15px] text-[#5F6F65] leading-[1.55] mt-auto">
                 Bạn thích tương tác thường xuyên hay cần nhiều không gian riêng?
               </p>
             </div>

             <div className="bg-white rounded-[22px] p-6 md:p-7 border border-[#E5F3EA] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:-translate-y-[3px] hover:border-green-300 transition-all min-h-[170px] flex flex-col">
               <div className="flex gap-4 items-start mb-3">
                 <div className="bg-[#E0F2FE] p-3 rounded-full shrink-0">
                   <Home className="w-7 h-7 text-[#0284C7]" />
                 </div>
                 <div>
                   <h3 className="text-[19px] font-extrabold text-[#103B26]">Cách nhìn nhận</h3>
                   <span className="text-[18px] font-extrabold text-[#103B26]">S / N</span>
                 </div>
               </div>
               <p className="text-[15px] text-[#5F6F65] leading-[1.55] mt-auto">
                 Bạn ưu tiên chi tiết thực tế hay cảm giác tổng thể khi sống chung?
               </p>
             </div>

             <div className="bg-white rounded-[22px] p-6 md:p-7 border border-[#E5F3EA] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:-translate-y-[3px] hover:border-green-300 transition-all min-h-[170px] flex flex-col">
               <div className="flex gap-4 items-start mb-3">
                 <div className="bg-[#F3E8FF] p-3 rounded-full shrink-0">
                   <MessageCircle className="w-7 h-7 text-[#8B5CF6]" />
                 </div>
                 <div>
                   <h3 className="text-[19px] font-extrabold text-[#103B26]">Xử lý vấn đề</h3>
                   <span className="text-[18px] font-extrabold text-[#103B26]">T / F</span>
                 </div>
               </div>
               <p className="text-[15px] text-[#5F6F65] leading-[1.55] mt-auto">
                 Bạn thiên về trao đổi rõ ràng hay giữ hòa khí khi có mâu thuẫn?
               </p>
             </div>

             <div className="bg-white rounded-[22px] p-6 md:p-7 border border-[#E5F3EA] shadow-[0_12px_35px_rgba(15,23,42,0.06)] hover:-translate-y-[3px] hover:border-green-300 transition-all min-h-[170px] flex flex-col">
               <div className="flex gap-4 items-start mb-3">
                 <div className="bg-[#FEF3C7] p-3 rounded-full shrink-0">
                   <CalendarCheck className="w-7 h-7 text-[#D97706]" />
                 </div>
                 <div>
                   <h3 className="text-[19px] font-extrabold text-[#103B26]">Tổ chức cuộc sống</h3>
                   <span className="text-[18px] font-extrabold text-[#103B26]">J / P</span>
                 </div>
               </div>
               <p className="text-[15px] text-[#5F6F65] leading-[1.55] mt-auto">
                 Bạn thích nề nếp, kế hoạch hay sự linh hoạt, thoải mái?
               </p>
             </div>
          </div>

          {/* 5. Card hướng dẫn trả lời */}
          <div className="mt-8 bg-[#F0FDF4]/70 border-[1.5px] border-dashed border-[#22C55E] rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
             <div className="md:w-[12%] flex justify-center shrink-0">
                <div className="bg-white rounded-full p-5 shadow-sm border border-green-100">
                   <Lightbulb className="w-10 h-10 text-green-500" />
                </div>
             </div>
             
             <div className="md:w-[88%] w-full">
                <h3 className="text-[20px] font-bold text-[#103B26] mb-5 text-center md:text-left">
                  Trả lời thế nào để kết quả chính xác?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                   <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-[2px]" />
                      <p className="text-[16px] text-[#374151] leading-[1.55]">
                        Chọn đáp án đúng với thói quen thật của bạn, không chọn theo hình mẫu lý tưởng.
                      </p>
                   </div>
                   <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-[2px]" />
                      <p className="text-[16px] text-[#374151] leading-[1.55]">
                        Nếu cả hai đáp án đều đúng, hãy chọn phương án xảy ra thường xuyên hơn.
                      </p>
                   </div>
                   <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-[2px]" />
                      <p className="text-[16px] text-[#374151] leading-[1.55]">
                        Hãy nghĩ đến cách bạn cư xử trong đời sống hằng ngày khi ở chung phòng.
                      </p>
                   </div>
                   <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0 mt-[2px]" />
                      <p className="text-[16px] text-[#374151] leading-[1.55]">
                        Không có đáp án tốt hay xấu. Mục tiêu là tìm người phù hợp, không phải đánh giá tính cách.
                      </p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
