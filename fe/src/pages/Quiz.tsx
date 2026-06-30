import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Lightbulb, ClipboardList, Check, RotateCcw, HeartHandshake, ShieldCheck, Zap } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { QUIZ_QUESTIONS, QuizOption } from '@/data/quizQuestions';
import { QuizAnswer, PersonalityScores, QuizResults } from '@/types';

// Keys for sessionStorage
const SS_STEP = 'quiz_step';
const SS_ANSWERS = 'quiz_answers';
const SS_SELECTED = 'quiz_selected';
const SS_RETAKE = 'quiz_retake';
const SS_RESULT = 'quiz_result';

function clearQuizSession() {
  [SS_STEP, SS_ANSWERS, SS_SELECTED, SS_RETAKE, SS_RESULT].forEach(k => sessionStorage.removeItem(k));
}

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

export default function Quiz() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  // Restore state from sessionStorage on mount
  const savedStep = Number(sessionStorage.getItem(SS_STEP) ?? 0);
  const savedAnswers: QuizAnswer[] = JSON.parse(sessionStorage.getItem(SS_ANSWERS) ?? '[]');
  const savedSelected = sessionStorage.getItem(SS_SELECTED);
  const isRetakeMode = sessionStorage.getItem(SS_RETAKE) === 'true';
  const savedResult: QuizResults | null = JSON.parse(sessionStorage.getItem(SS_RESULT) ?? 'null');

  const [currentStep, setCurrentStep] = useState(savedStep);
  const [answers, setAnswers] = useState<QuizAnswer[]>(savedAnswers);
  const [selectedOption, setSelectedOption] = useState<string | null>(savedSelected);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  // Only show saved result if NOT in retake mode
  const [result, setResult] = useState<QuizResults | null>(isRetakeMode ? null : savedResult);
  const [errorMsg, setErrorMsg] = useState("");

  // Persist state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(SS_STEP, String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    sessionStorage.setItem(SS_ANSWERS, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    if (selectedOption !== null) {
      sessionStorage.setItem(SS_SELECTED, selectedOption);
    } else {
      sessionStorage.removeItem(SS_SELECTED);
    }
  }, [selectedOption]);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem(SS_RESULT, JSON.stringify(result));
      // Once result is shown, clear retake flag
      sessionStorage.removeItem(SS_RETAKE);
    }
  }, [result]);

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  // Derive categories from data
  const categories = useMemo(() => {
    const cats = new Set(QUIZ_QUESTIONS.map(q => q.section));
    return Array.from(cats);
  }, []);
  const currentCategory = currentQuestion?.section;
  const categoryIndex = categories.indexOf(currentCategory);

  const calculateResults = (finalAnswers: QuizAnswer[]): QuizResults => {
    const scores: PersonalityScores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
    let conflictScore = 0;

    finalAnswers.forEach(ans => {
      if (ans.dimension && ans.dimension !== "CONFLICT") {
        const firstPole = ans.dimension.split("_")[0] as keyof PersonalityScores;
        const secondPole = ans.dimension.split("_")[1] as keyof PersonalityScores;
        scores[firstPole] += ans.firstPoleScore || 0;
        scores[secondPole] += ans.secondPoleScore || 0;
      } else if (ans.dimension === "CONFLICT") {
        conflictScore += ans.conflictScore || 0;
      }
    });

    const getDimensionType = (first: number, second: number, firstChar: string, secondChar: string) => {
      const diff = Math.abs(first - second);
      if (diff < 2) return "X";
      return first >= second ? firstChar : secondChar;
    };

    const E_I = getDimensionType(scores.E, scores.I, "E", "I");
    const S_N = getDimensionType(scores.S, scores.N, "S", "N");
    const T_F = getDimensionType(scores.T, scores.F, "T", "F");
    const J_P = getDimensionType(scores.J, scores.P, "J", "P");
    
    const personalityType = `${E_I}${S_N}${T_F}${J_P}`;

    const getStrength = (first: number, second: number): "strong" | "light" | "balanced" => {
      const diff = Math.abs(first - second);
      if (diff >= 4) return "strong";
      if (diff >= 2) return "light";
      return "balanced";
    };

    const dimensionStrength = {
      E_I: getStrength(scores.E, scores.I),
      S_N: getStrength(scores.S, scores.N),
      T_F: getStrength(scores.T, scores.F),
      J_P: getStrength(scores.J, scores.P)
    };

    let conflictProfileType: "DIRECT" | "BALANCED_FLEXIBLE" | "NEEDS_SPACE" = "BALANCED_FLEXIBLE";
    let conflictProfileTitle = "Tuýp Cân bằng linh hoạt";
    let conflictProfileDesc = "Bạn có thể thích nghi với nhiều kiểu giao tiếp, miễn hai bên biết tôn trọng và thỏa hiệp.";

    if (conflictScore >= 9) {
      conflictProfileType = "DIRECT";
      conflictProfileTitle = "Tuýp Đối mặt trực tiếp";
      conflictProfileDesc = "Bạn phù hợp với người sẵn sàng trò chuyện thẳng thắn, rõ ràng và không né tránh xung đột.";
    } else if (conflictScore <= 4) {
      conflictProfileType = "NEEDS_SPACE";
      conflictProfileTitle = "Tuýp Cần không gian xử lý";
      conflictProfileDesc = "Bạn phù hợp với người kiên nhẫn, tinh tế, không thúc ép bạn phải giải quyết mâu thuẫn ngay lập tức.";
    }

    return {
      quizAnswers: finalAnswers,
      personalityScores: scores,
      personalityType,
      dimensionStrength,
      conflictScore,
      conflictProfile: {
        type: conflictProfileType,
        title: conflictProfileTitle,
        description: conflictProfileDesc
      },
      quizCompletedAt: new Date(),
    };
  };

  const handleSelect = (option: QuizOption) => {
    setSelectedOption(option.label);
    setErrorMsg("");
    
    const newAnswer: QuizAnswer = {
      questionId: currentQuestion.id,
      selectedOption: option.label,
      dimension: currentQuestion.dimension,
      firstPoleScore: option.firstPoleScore,
      secondPoleScore: option.secondPoleScore,
      conflictScore: option.conflictScore
    };

    const updatedAnswers = [...answers];
    const existingIdx = updatedAnswers.findIndex(a => a.questionId === currentQuestion.id);
    if (existingIdx >= 0) {
      updatedAnswers[existingIdx] = newAnswer;
    } else {
      updatedAnswers.push(newAnswer);
    }
    setAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (!selectedOption) {
      setErrorMsg("Vui lòng chọn một đáp án để tiếp tục.");
      return;
    }

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
      const nextAnswer = answers.find(a => a.questionId === QUIZ_QUESTIONS[currentStep + 1].id);
      setSelectedOption(nextAnswer ? nextAnswer.selectedOption : null);
    } else {
      // Quiz complete — clear in-progress keys, result will be saved by the useEffect
      sessionStorage.removeItem(SS_STEP);
      sessionStorage.removeItem(SS_ANSWERS);
      sessionStorage.removeItem(SS_SELECTED);
      setIsSubmitting(true);
      const finalResults = calculateResults(answers);
      setResult(finalResults);
      
      apiClient
        .updateMyRoommateProfile({ preferences: finalResults })
        .then(() => {
          setIsSubmitting(false);
        })
        .catch((err) => {
          console.error("Failed to save quiz results:", err);
          setIsSubmitting(false);
        });
    }
  };

  const handleBack = () => {
    if (result) {
      setResult(null); // Quay lại quiz nếu đang ở trang kết quả
      return;
    }
    setErrorMsg("");
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const prevAnswer = answers.find(a => a.questionId === QUIZ_QUESTIONS[currentStep - 1].id);
      setSelectedOption(prevAnswer ? prevAnswer.selectedOption : null);
    } else {
      navigate('/find-roommate');
    }
  };

  const handleRetake = async () => {
    // Check KnockCoin before allowing retake
    if ((user?.knockCoin ?? 0) < 50) {
      toast.error('Bạn không đủ Knock Coin. Vui lòng nạp thêm để làm lại quiz!', {
        action: {
          label: 'Nạp ngay',
          onClick: () => navigate('/tenant/ai-payment'),
        },
      });
      return;
    }

    setIsRetaking(true);
    try {
      const { data, error } = await apiClient.payForQuizRetake();
      if (error) {
        if (error.includes('HTTP 402') || error.includes('Not enough')) {
          toast.error('Bạn không đủ Knock Coin. Hãy nạp thêm để tiếp tục!', {
            action: {
              label: 'Nạp ngay',
              onClick: () => navigate('/tenant/ai-payment'),
            },
          });
        } else {
          toast.error('Lỗi khi thực hiện giao dịch: ' + error);
        }
        return;
      }
      if (data) {
        toast.success('Giao dịch thành công!');
        refreshUser();
        // Clear all quiz session data and start fresh
        clearQuizSession();
        sessionStorage.setItem(SS_RETAKE, 'true');
        setResult(null);
        setCurrentStep(0);
        setAnswers([]);
        setSelectedOption(null);
        setErrorMsg('');
      }
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsRetaking(false);
    }
  };

  if (result) {
    const { personalityType, conflictProfile } = result;
    const E_I = personalityType.charAt(0);
    const S_N = personalityType.charAt(1);
    const T_F = personalityType.charAt(2);
    const J_P = personalityType.charAt(3);

    return (
      <Layout showNav={true}>
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
                 onClick={() => navigate("/matches", { state: { preferences: result } })} 
                 className="rounded-full px-8 py-6 text-lg shadow-sm"
               >
                  Xem danh sách roommate phù hợp
               </Button>
               <Button 
                 variant="outline" 
                 onClick={handleRetake}
                 disabled={isRetaking}
                 className="rounded-full px-8 py-6 text-lg border-gray-300 text-gray-700 hover:bg-gray-50"
               >
                 <RotateCcw className="h-4 w-4 mr-2" />
                 {isRetaking ? 'Đang xử lý...' : 'Làm lại quiz (50 KnockCoin)'}
               </Button>
            </div>

          </div>
        </div>
      </Layout>
    );
  }

  if (!currentQuestion) return null;

  return (
    <Layout showNav={true}>
      <div className="bg-[#F8FAFC] min-h-screen pt-4 pb-10 font-vietnam text-gray-900">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-[#EEF6FF] to-[#F8FBFF] rounded-[20px] shadow-sm p-4 md:p-6 mb-5 flex items-center justify-between">
             <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-3">
                   <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                      <ClipboardList className="h-4 w-4" />
                   </div>
                   <h1 className="text-xl md:text-2xl font-bold text-gray-900">Trắc nghiệm phong cách sống</h1>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">
                   Hiểu rõ thói quen, cách giao tiếp và lối sống của bạn để tìm người ở ghép phù hợp nhất.
                </p>
             </div>
             <div className="hidden lg:block opacity-80">
                <Sparkles className="w-24 h-24 text-primary/20" />
             </div>
          </div>

          {/* Main Quiz Layout */}
          <div className="flex flex-col lg:flex-row gap-8">
             {/* Left Sidebar */}
             <div className="w-full lg:w-[32%] lg:sticky lg:top-[100px] self-start space-y-6">
                <div className="bg-white border border-gray-200 rounded-[20px] shadow-sm p-5">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                         <ClipboardList className="h-4 w-4" />
                      </div>
                      <h2 className="text-base font-bold text-gray-900">Trắc nghiệm phong cách sống</h2>
                   </div>
                   
                   <ul className="space-y-2 mb-4 text-sm text-gray-600 font-medium">
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> 
                        {QUIZ_QUESTIONS.length} câu hỏi
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> 
                        {categories.length} phần đánh giá
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> 
                        Thời gian: 3–5 phút
                      </li>
                   </ul>
                   
                   <hr className="border-gray-100 mb-6" />
                   
                   <div className="mb-4">
                      <div className="flex items-center justify-between mb-2 text-xs font-semibold">
                         <span className="text-gray-900">Câu {currentStep + 1}/{QUIZ_QUESTIONS.length}</span>
                         <span className="text-primary">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5 bg-gray-100" />
                   </div>

                   <hr className="border-gray-100 mb-6" />

                   <div className="mb-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Phần hiện tại:</p>
                      <p className="text-gray-900 text-sm font-medium leading-snug">{currentCategory}</p>
                   </div>

                   <div className="bg-blue-50/50 rounded-xl p-3 flex gap-2 items-start border border-blue-100/50">
                      <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800/80 leading-relaxed">
                         Hãy chọn đáp án gần với bạn nhất. Không có đáp án đúng hoặc sai.
                      </p>
                   </div>
                </div>
             </div>

             {/* Right Question Card */}
             <div className="w-full lg:w-[68%]">
                <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm p-6 md:p-8 min-h-[420px] flex flex-col relative">
                   
                   <div className="mb-5">
                      <div className="flex items-center flex-wrap gap-3 mb-3">
                         <span className="inline-block px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-bold tracking-wider uppercase">
                            Phần {categoryIndex + 1}/{categories.length}
                         </span>
                         {currentQuestion.type && (
                           <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold tracking-wider uppercase">
                              {currentQuestion.type}
                           </span>
                         )}
                         <span className="text-xs font-semibold text-primary ml-auto">Câu {currentStep + 1}/{QUIZ_QUESTIONS.length}</span>
                      </div>
                      <h3 className="text-[20px] md:text-[24px] font-bold text-gray-900 leading-[1.35]">
                         {currentQuestion.question}
                      </h3>
                   </div>

                   <div className="space-y-4 flex-1">
                      {currentQuestion.options.map((option, index) => {
                         const isSelected = selectedOption === option.label;
                         return (
                           <div 
                             key={index}
                             onClick={() => handleSelect(option)}
                             className={cn(
                                "w-full p-3.5 md:px-5 rounded-[14px] border-[1.5px] flex items-center gap-3 cursor-pointer transition-all duration-200",
                                isSelected ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                             )}
                           >
                              <div className={cn(
                                 "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
                                 isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                              )}>
                                 {option.label}
                              </div>
                              <div className="flex-1">
                                 <p className="text-sm md:text-base font-medium text-gray-800 leading-relaxed">{option.text}</p>
                              </div>
                              {isSelected && (
                                 <div className="flex-shrink-0">
                                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                       <Check className="w-3 h-3 text-white" />
                                    </div>
                                 </div>
                              )}
                           </div>
                         )
                      })}
                   </div>

                   {errorMsg && (
                      <p className="text-red-500 text-sm font-medium mt-4">{errorMsg}</p>
                   )}

                   <hr className="border-gray-100 my-5" />

                   <div className="flex items-center justify-between">
                      <Button 
                        variant="outline" 
                        onClick={handleBack}
                        className="rounded-full px-5 h-10 text-sm font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Quay lại
                      </Button>
                      
                      <Button 
                        onClick={handleNext}
                        disabled={isSubmitting}
                        className="rounded-full px-6 h-10 text-sm font-semibold shadow-sm"
                      >
                        {currentStep === QUIZ_QUESTIONS.length - 1 ? (
                           isSubmitting ? "Đang xử lý..." : "Xem kết quả"
                        ) : (
                           <>
                             Tiếp tục
                             <ArrowRight className="w-4 h-4 ml-1.5" />
                           </>
                        )}
                      </Button>
                   </div>

                </div>
             </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
