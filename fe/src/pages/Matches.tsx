import { useMemo, useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle,
  ArrowLeft,
  Users,
  UserPlus,
  Share2,
  Lock,
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
import { useAuth } from "@/contexts/AuthContext";
import { LoginDialog } from "@/components/auth/LoginDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function MatchCard({
  match,
  index,
  locked,
  onUnlock,
  unlocking,
}: {
  match: MatchResult;
  index: number;
  locked: boolean;
  onUnlock?: () => void;
  unlocking: boolean;
}) {
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
      transition={{ delay: index * 0.05 }}
      onClick={locked ? onUnlock : undefined}
      role={locked ? "button" : undefined}
      tabIndex={locked ? 0 : undefined}
      className={cn(
        "relative glass-card rounded-3xl p-5 transition-shadow",
        locked
          ? "cursor-pointer hover:shadow-elevated"
          : "hover:shadow-elevated",
      )}
    >
      <div className="flex gap-4">
        {/* Avatar with Score Ring */}
        <div
          className={cn(
            "relative flex-shrink-0",
            locked && "blur-md select-none",
          )}
        >
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
        <div className={cn("flex-1 min-w-0", locked && "blur-md select-none")}>
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
              disabled={locked}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Kết nối Zalo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={locked}
            >
              Xem thêm
            </Button>
          </div>
        </div>
      </div>

      {locked && (
        <div className="absolute inset-0 rounded-3xl flex items-center justify-center">
          <div className="mx-4 w-full max-w-sm bg-background/70 backdrop-blur-md border border-border rounded-2xl p-4 text-center shadow-lg">
            <div className="flex items-center justify-center gap-2 font-semibold">
              <Lock className="h-4 w-4" />
              Ứng viên bị khóa
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Click để mở khóa với{" "}
              <span className="font-semibold text-foreground">
                50 Knock Coin
              </span>
            </p>
            <div className="mt-3">
              <Button
                type="button"
                className="rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnlock?.();
                }}
                disabled={unlocking}
              >
                {unlocking ? "Đang mở..." : "Mở khóa"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function Matches() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const [preferences, setPreferences] = useState<QuizPreferences>(
    (location.state?.preferences as QuizPreferences) ||
      DEFAULT_USER_PREFERENCES,
  );
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockedUserIds, setUnlockedUserIds] = useState<Set<string>>(
    new Set(),
  );
  const [coinBalance, setCoinBalance] = useState<number>(user?.knockCoin ?? 0);
  const [loginOpen, setLoginOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const loadPreferences = async () => {
          // If we have state, use it
          if (location.state?.preferences) {
            setPreferences(location.state.preferences);
            return;
          }

          // If not authenticated, reset to defaults
          if (!isAuthenticated) {
            setPreferences(DEFAULT_USER_PREFERENCES);
            return;
          }

          const { data } = await apiClient.getMyRoommateProfile();
          if (
            data?.profile?.preferences &&
            Object.keys(data.profile.preferences).length > 0
          ) {
            setPreferences(data.profile.preferences as QuizPreferences);
          } else {
            setPreferences(DEFAULT_USER_PREFERENCES);
          }
        };

        await Promise.all([loadPreferences(), fetchUsers(), fetchUnlocks()]);
      } catch (error) {
        console.error("Error initializing matches data:", error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [isAuthenticated, location.state?.preferences]);

  useEffect(() => {
    // Only update balance from auth context if we don't have a value yet
    // or if the balance in context is actually non-zero (initial login sync)
    if (user?.knockCoin !== undefined && (coinBalance === 0 || user.knockCoin > 0)) {
      setCoinBalance(user.knockCoin);
    }
  }, [user?.knockCoin]);

  const fetchUnlocks = async () => {
    if (!isAuthenticated) {
      setUnlockedUserIds(new Set());
      return;
    }

    try {
      const { data, error } = await apiClient.getRoommateUnlocks();
      if (error || !data) return;

      setUnlockedUserIds(new Set(data.unlockedUserIds || []));
      // Only set if we actually got a value back
      if (data.knockCoin !== undefined) {
        setCoinBalance(data.knockCoin);
      } else if (user?.knockCoin !== undefined) {
        setCoinBalance(user.knockCoin);
      }
    } catch (err) {
      console.error("Error fetching unlocks:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await apiClient.getRoommateProfiles();
      if (error) throw new Error(error);

      const mappedUsers = (data?.profiles || [])
        .map((profile) => {
          const u = typeof profile.userId === "object" ? profile.userId : null;
          return {
            id: u?._id || profile._id,
            name: u?.fullName || "Người dùng",
            avatar: u?.avatarUrl || "https://github.com/shadcn.png",
            age: 20,
            university: profile.university || u?.university || "Đại học FPT",
            bio: profile.bio || "Chưa có giới thiệu",
            preferences: profile.preferences || {},
            verified: u?.isVerified || false,
          };
        })
        .filter(
          (mappedUser) =>
            mappedUser.id !== user?._id && mappedUser.id !== user?.id,
        );
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

  const defaultUnlockedId = useMemo(() => {
    return matches[0]?.user?.id;
  }, [matches]);

  const isUnlocked = (id: string) => {
    if (defaultUnlockedId && id === defaultUnlockedId) return true;
    return unlockedUserIds.has(id);
  };

  const handleUnlock = async (targetUserId: string) => {
    if (!isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    if (unlockingId === targetUserId) return;
    if (isUnlocked(targetUserId)) return;

    if ((coinBalance ?? 0) < 50) {
      setTopUpOpen(true);
      return;
    }

    setUnlockingId(targetUserId);
    try {
      const { data, error } = await apiClient.unlockRoommate(targetUserId);
      if (error || !data) {
        if ((error || "").toLowerCase().includes("not enough")) {
          setTopUpOpen(true);
        } else {
          toast.error(error || "Không thể mở khóa");
        }
        return;
      }
      setUnlockedUserIds(new Set(data.unlockedUserIds || []));
      setCoinBalance(data.knockCoin ?? 0);
      toast.success(`Đã mở khóa (-${data.cost} Knock Coin)`);
      refreshUser();
    } finally {
      setUnlockingId(null);
    }
  };

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
            to="/find-roommate"
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
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Knock Coin</p>
            <p className="font-bold">{coinBalance ?? 0}</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="glass-card rounded-2xl p-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Đăng nhập để mở khóa đầy đủ</p>
              <p className="text-sm text-muted-foreground">
                Bạn vẫn thấy 1 ứng viên gợi ý, nhưng cần đăng nhập để mở khóa
                thêm.
              </p>
            </div>
            <Button className="rounded-full" onClick={() => setLoginOpen(true)}>
              Đăng nhập
            </Button>
          </div>
        )}

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
                <MatchCard
                  key={match.user.id}
                  match={match}
                  index={index}
                  locked={!isUnlocked(match.user.id)}
                  onUnlock={() => handleUnlock(match.user.id)}
                  unlocking={unlockingId === match.user.id}
                />
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
                <MatchCard
                  key={match.user.id}
                  match={match}
                  index={index}
                  locked={!isUnlocked(match.user.id)}
                  onUnlock={() => handleUnlock(match.user.id)}
                  unlocking={unlockingId === match.user.id}
                />
              ))}
          </div>
        )}

        {/* Retake Quiz CTA */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Kết quả chưa chính xác?
          </p>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={unlockingId === "retake"}
            onClick={async () => {
              if (coinBalance < 50) {
                toast.error("Bạn không đủ Knock Coin. Vui lòng nạp thêm!", {
                  action: {
                    label: "Nạp ngay",
                    onClick: () => navigate("/tenant/ai-payment"),
                  },
                });
                return;
              }

              setUnlockingId("retake");
              try {
                const { data, error } = await apiClient.payForQuizRetake();
                if (error) {
                  if (
                    error.includes("HTTP 402") ||
                    error.includes("Not enough")
                  ) {
                    toast.error(
                      "Bạn không đủ Knock Coin. Hãy nạp thêm để tiếp tục!",
                      {
                        action: {
                          label: "Nạp ngay",
                          onClick: () => navigate("/tenant/ai-payment"),
                        },
                      },
                    );
                  } else {
                    toast.error("Lỗi khi thực hiện giao dịch: " + error);
                  }
                  return;
                }

                if (data) {
                  toast.success("Giao dịch thành công! Đang chuyển hướng...");
                  refreshUser(); // Update coin balance in context
                  setTimeout(() => navigate("/quiz"), 1500);
                }
              } catch (err) {
                toast.error("Có lỗi xảy ra, vui lòng thử lại sau.");
              } finally {
                setUnlockingId(null);
              }
            }}
          >
            {unlockingId === "retake"
              ? "Đang xử lý..."
              : "Làm lại bài test (50 KnockCoin)"}
          </Button>
        </div>
      </div>

      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={() => {
          // refresh unlocks after login
          apiClient.getRoommateUnlocks().then(({ data }) => {
            if (data) {
              setUnlockedUserIds(new Set(data.unlockedUserIds || []));
              setCoinBalance(data.knockCoin ?? 0);
            }
          });
        }}
      />

      <AlertDialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Không đủ Knock Coin</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn cần ít nhất 50 Knock Coin để mở khóa ứng viên này. Đi tới
              trang nạp coin ngay?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Để sau</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/tenant/ai-payment")}>
              Nạp coin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
