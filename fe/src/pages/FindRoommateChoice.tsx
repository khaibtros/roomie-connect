import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";

export default function FindRoommateChoice() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [hasPreferences, setHasPreferences] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      // Reset state on each run to prevent session leakage
      setHasPreferences(false);
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
          setHasPreferences(true);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
      } finally {
        setLoading(false);
      }
    };
    checkProfile();
  }, [isAuthenticated]);

  const goQuiz = () => navigate("/quiz");
  const goMatches = () => navigate("/matches");

  const handleStartQuiz = () => {
    if (!isAuthenticated) {
      navigate("/auth/login?returnTo=/find-roommate");
      return;
    }
    if (hasPreferences) {
      goMatches();
    } else {
      goQuiz();
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4">
        <div className="container max-w-3xl">
          <div className="flex justify-center">
            <div className="glass-card p-8 rounded-3xl border-primary/20 bg-primary/5 max-w-md w-full shadow-xl backdrop-blur-sm">
              <div className="flex items-center gap-5 mb-6">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-2xl">
                    Bộ câu hỏi trắc nghiệm
                  </h2>
                  <p className="text-muted-foreground">
                    Sử dụng bộ câu hỏi được biên soạn để tìm roommate phù hợp.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleStartQuiz}
                className="w-full rounded-full h-12 text-lg font-medium shadow-lg hover:shadow-primary/20 transition-all"
                size="lg"
                disabled={loading}
              >
                {loading
                  ? "Đang tải..."
                  : hasPreferences
                    ? "Xem kết quả Match"
                    : "Trả lời bộ câu hỏi"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
