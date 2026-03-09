import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Phone,
  MessageCircle,
  ArrowLeft,
  Users,
  UserPlus,
  Share2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizPreferences, MatchResult } from "@/types";
import { DEFAULT_USER_PREFERENCES } from "@/data/mockData";
import { findMatches, getMatchLevel } from "@/utils/matching";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

function MatchCard({ match, index }: { match: MatchResult; index: number }) {
  const level = getMatchLevel(match.score);

  const levelColors = {
    high: "text-match-high border-match-high",
    good: "text-match-good border-match-good",
    average: "text-match-average border-match-average",
    low: "text-match-low border-match-low",
  };

  const levelBg = {
    high: "bg-match-high",
    good: "bg-match-good",
    average: "bg-match-average",
    low: "bg-match-low",
  };

  const handleContactZalo = () => {
    window.open(
      `https://zalo.me/${match.user.zaloId || "0912345678"}`,
      "_blank",
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card rounded-3xl p-5 hover:shadow-elevated transition-shadow"
    >
      <div className="flex gap-4">
        {/* Avatar with Score Ring */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              "absolute inset-0 rounded-full border-4",
              levelColors[level],
            )}
            style={{
              background: `conic-gradient(${
                level === "high"
                  ? "hsl(var(--match-high))"
                  : level === "good"
                    ? "hsl(var(--match-good))"
                    : level === "average"
                      ? "hsl(var(--match-average))"
                      : "hsl(var(--match-low))"
              } ${match.score}%, transparent 0)`,
            }}
          />
          <div className="relative m-1">
            <img
              src={match.user.avatar}
              alt={match.user.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-background"
            />
          </div>
          <div
            className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold text-white",
              levelBg[level],
            )}
          >
            {match.score}%
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {match.user.name}
                {match.user.verified && (
                  <Badge variant="secondary" className="text-xs">
                    ✓ Xác thực
                  </Badge>
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {match.user.age} tuổi • {match.user.university}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {match.user.bio}
          </p>

          {/* Matching Traits */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {match.matchingTraits.map((trait) => (
              <span
                key={trait}
                className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {trait}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleContactZalo}
              className="flex-1 rounded-full"
              size="sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Kết nối Zalo
            </Button>
            <Button variant="outline" size="sm" className="rounded-full">
              Xem thêm
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Matches() {
  const location = useLocation();
  const preferences =
    (location.state?.preferences as QuizPreferences) ||
    DEFAULT_USER_PREFERENCES;
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getRoommateProfiles();

      if (error) {
        throw new Error(error);
      }
      const mappedUsers = (data?.profiles || []).map((profile) => {
        const user = typeof profile.userId === 'object' ? profile.userId : null;
        return {
          id: user?._id || profile._id,
          name: user?.fullName || "Người dùng",
          avatar: user?.avatarUrl || "https://github.com/shadcn.png",
          age: 20, // Tuổi mặc định vì backend chưa có
          university:
            profile.university || user?.university || "Đại học FPT",
          major: "Dữ liệu chưa có",
          year: 2,
          bio: profile.bio || "Chưa có giới thiệu",
          preferences: profile.preferences || {},
          verified: user?.isVerified || false,
        };
      });
      setUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching roommate profiles:", error);
      toast.error("Không thể tải danh sách bạn ở ghép");
    } finally {
      setLoading(false);
    }
  };

  const matches = findMatches(preferences, users);
  const goodMatches = matches.filter((m) => m.score >= 60);
  const hasGoodMatches = goodMatches.length > 0;

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/quiz"
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Kết quả Match</h1>
            <p className="text-muted-foreground text-sm">
              Tìm thấy {matches.length} bạn ở ghép tiềm năng
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-match-high">
              {matches.filter((m) => m.score >= 90).length}
            </p>
            <p className="text-xs text-muted-foreground">Match cao</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-match-good">
              {matches.filter((m) => m.score >= 80 && m.score < 90).length}
            </p>
            <p className="text-xs text-muted-foreground">Match tốt</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-match-average">
              {matches.filter((m) => m.score >= 60 && m.score < 80).length}
            </p>
            <p className="text-xs text-muted-foreground">Khá ổn</p>
          </div>
        </div>

        {/* Match List */}
        {hasGoodMatches ? (
          <div className="space-y-4">
            {matches
              .filter((m) => m.score >= 60)
              .map((match, index) => (
                <MatchCard key={match.user.id} match={match} index={index} />
              ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-8 text-center"
          >
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Đang mở rộng tìm kiếm...</h3>
            <p className="text-muted-foreground mb-6">
              Chưa tìm thấy bạn ở ghép phù hợp trên 60%. Hãy mời bạn bè tham
              gia!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="rounded-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Mời bạn bè
              </Button>
              <Button variant="outline" className="rounded-full">
                <Share2 className="h-4 w-4 mr-2" />
                Chia sẻ link
              </Button>
            </div>
          </motion.div>
        )}

        {/* Lower Score Matches */}
        {matches.filter((m) => m.score < 60).length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">
              Các bạn khác ({matches.filter((m) => m.score < 60).length})
            </h2>
            {matches
              .filter((m) => m.score < 60)
              .map((match, index) => (
                <MatchCard key={match.user.id} match={match} index={index} />
              ))}
          </div>
        )}

        {/* Retake Quiz CTA */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Kết quả chưa chính xác?
          </p>
          <Button variant="outline" asChild className="rounded-full">
            <Link to="/quiz">Làm lại bài test</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
