/**
 * AI Chat Screen — Tenant AI Chatbot (Smart Search)
 *
 * Integrates with Google Gemini 2.0 Flash via backend endpoint POST /api/ai/chat.
 * Features:
 *  - Vietnamese filter extraction (price, district, amenities)
 *  - Room card display from real MongoDB results
 *  - Chat message history (user / bot styled differently)
 *  - Loading / typing animation while waiting for response
 *  - Auto scroll-to-bottom
 *  - Token balance display & enforcement
 *  - Error handling with toast notifications
 *  - Responsive design matching KnockKnock theme
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  ArrowLeft,
  Coins,
  AlertCircle,
  Loader2,
  MapPin,
  DollarSign,
  Home,
  Check,
  Zap,
  Users,
  BookOpen,
  Trash2,
} from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
  results?: Record<string, unknown>[]; // room results
  roommates?: Record<string, unknown>[]; // roommate profile results
  filters?: {
    intent: string;
    max_price: number | null;
    district: string | null;
    amenities: string[];
  };
}

// ---------------------------------------------------------------------------
// Amenity labels for Vietnamese display
// ---------------------------------------------------------------------------
const AMENITY_LABELS: Record<string, string> = {
  hasAirConditioner: "Máy lạnh",
  hasBed: "Giường",
  hasWardrobe: "Tủ quần áo",
  hasWaterHeater: "Nóng lạnh",
  hasKitchen: "Bếp",
  hasFridge: "Tủ lạnh",
  hasPrivateWashing: "Máy giặt riêng",
  hasSharedWashing: "Máy giặt chung",
  hasParking: "Chỗ để xe",
  hasElevator: "Thang máy",
  hasSecurityCamera: "Camera an ninh",
  hasFireSafety: "PCCC",
  hasPetFriendly: "Thú cưng",
  hasDryingArea: "Sân phơi",
  hasSharedOwner: "Chung chủ",
  isFullyFurnished: "Nội thất đầy đủ",
};

// ---------------------------------------------------------------------------
// Helper: format price in VND
// ---------------------------------------------------------------------------
function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `${millions % 1 === 0 ? millions : millions.toFixed(1)} triệu/tháng`;
  }
  if (price >= 1_000) {
    return `${(price / 1_000).toFixed(0)}k/tháng`;
  }
  return `${price.toLocaleString("vi-VN")}đ/tháng`;
}

// ---------------------------------------------------------------------------
// Helper: get list of active amenities from room document
// ---------------------------------------------------------------------------
function getActiveAmenities(room: Record<string, unknown>): string[] {
  return Object.entries(AMENITY_LABELS)
    .filter(([key]) => room[key] === true)
    .map(([, label]) => label);
}

// Defined outside the component so it is not recreated on each render
const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "bot",
  content:
    'Xin chào! Tôi là **KnockBot** — trợ lý AI của KnockKnock.\n\nTôi có thể giúp bạn:\n•  **Tìm phòng**: "Tìm phòng dưới 3 triệu ở Hòa Lạc"\n•  **Tìm bạn cùng phòng**: "Tìm bạn phòng ngủ sớm, không hút thuốc,.. "\n\n**Lưu ý**: Bạn có 2 tin nhắn miễn phí ban đầu. Sau đó, mỗi tin nhắn sẽ tốn 5 KnockCoin.',
  timestamp: new Date(),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function TenantAIChat() {
  const navigate = useNavigate();
  const {
    user,
    refreshUser,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  // Use knockCoin from user object
  const knockCoin = user?.knockCoin ?? 0;

  // Chat state — prefilled from persisted history on mount
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng AI Chat");
      navigate("/auth/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Restore chat history from backend on mount
  const loadHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const { data, error } = await apiClient.getAiHistory(1, 100);

      // If no history or error, we just keep the welcome message
      if (error || !data || !Array.isArray(data.history)) {
        setIsHistoryLoading(false);
        return;
      }

      if (data.history.length === 0) {
        setIsHistoryLoading(false);
        return;
      }

      // API returns newest-first; reverse so oldest appears at top
      const sorted = [...data.history].reverse();
      const historyMessages: ChatMessage[] = [];

      for (const item of sorted) {
        // Each AiUsage record maps to one user + one bot bubble
        if (item.prompt) {
          historyMessages.push({
            id: `hist-user-${item._id as string}`,
            role: "user",
            content: item.prompt as string,
            timestamp: new Date(item.createdAt as string),
          });
        }
        if (item.response) {
          historyMessages.push({
            id: `hist-bot-${item._id as string}`,
            role: "bot",
            content: item.response as string,
            timestamp: new Date(item.createdAt as string),
            // Restore room cards that were returned with this message
            results: Array.isArray(item.roomResults) ? item.roomResults : [],
            // Restore roommate cards
            roommates: Array.isArray(item.roommateResults)
              ? item.roommateResults
              : [],
          });
        }
      }

      setMessages([WELCOME_MESSAGE, ...historyMessages]);
    } catch (err) {
      console.error("Failed to load AI chat history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  // Fetch user profile (to get latest knockCoin) + restore history when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshUser();
      loadHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ---------------------------------------------------------------------------
  // Send message handler
  // ---------------------------------------------------------------------------
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    // Check free-chat eligibility against persistent backend counter (not local message list)
    const freeChatUsed = user?.aiFreeChatUsed ?? 0;
    const FREE_CHAT_LIMIT = 2;
    const hasFreeChats = freeChatUsed < FREE_CHAT_LIMIT;
    if (!hasFreeChats && knockCoin < 5) {
      toast.error(
        "Bạn đã hết lượt miễn phí và không đủ KnockCoin. Vui lòng nạp thêm.",
      );
      return;
    }

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setError(null);
    setIsLoading(true);

    try {
      // Backend returns { success: boolean, data: string } | { success: false, error: string }
      const { data: responseBody, error: networkError } =
        await apiClient.sendAiMessage(trimmed);

      // Network / fetch-level error (e.g. server unreachable)
      if (networkError) {
        setError(networkError);
        toast.error("Lỗi kết nối: " + networkError);
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "bot",
          content: " Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);
        return;
      }

      // Application-level error returned by backend
      if (!responseBody?.success) {
        const errText = responseBody?.error ?? "Đã xảy ra lỗi không xác định.";
        setError(errText);
        toast.error(errText);
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: "bot",
          content: ` ${errText}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errMsg]);

        // If 402, maybe suggest top up
        if (errText.includes("KnockCoin")) {
          refreshUser(); // Sync balance
        }
        return;
      }

      if (responseBody?.data) {
        // Refresh user after successful message to sync balance
        refreshUser();

        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: "bot",
          content: responseBody.data,
          timestamp: new Date(),
          // Room cards with links rendered by the existing room-card JSX below
          results: responseBody.rooms ?? [],
          // Roommate profile cards
          roommates: responseBody.roommates ?? [],
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error("AI Chat error:", err);
      toast.error("Không thể kết nối với AI. Vui lòng thử lại.");
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "bot",
        content: " Không thể kết nối. Vui lòng kiểm tra mạng và thử lại.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      // Refocus input
      inputRef.current?.focus();
    }
  };

  // Clear chat history
  const handleClearHistory = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn xóa toàn bộ lịch sử chat? Hành động này không thể hoàn tác.",
      )
    )
      return;
    setIsClearingHistory(true);
    try {
      const { data, error: apiError } = await apiClient.clearAiHistory();
      if (apiError || !data?.success) {
        toast.error("Không thể xóa lịch sử. Vui lòng thử lại.");
        return;
      }
      setMessages([WELCOME_MESSAGE]);
      toast.success("Đã xóa lịch sử chat.");
      refreshUser(); // Tokens might be refunded or reset depending on your logic, but good to sync
    } catch {
      toast.error("Không thể xóa lịch sử. Vui lòng thử lại.");
    } finally {
      setIsClearingHistory(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ---------------------------------------------------------------------------
  // Format message content (basic markdown-like rendering)
  // ---------------------------------------------------------------------------
  const formatContent = (text: string) => {
    // Split by newlines and process each line
    return text.split("\n").map((line, i) => {
      // Bold: **text**
      const boldProcessed = line.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>",
      );
      // Bullet points
      const bulletProcessed = boldProcessed.replace(
        /^[•\-]\s/,
        '<span class="text-primary mr-1">•</span>',
      );

      return (
        <span
          key={i}
          dangerouslySetInnerHTML={{ __html: bulletProcessed }}
          className="block"
        />
      );
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (authLoading) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </Layout>
    );
  }

  // Use persistent backend counter for accurate out-of-coins detection
  const freeChatUsed = user?.aiFreeChatUsed ?? 0;
  const isOutofCoins = !isHistoryLoading && freeChatUsed >= 2 && knockCoin < 5;

  return (
    <Layout>
      <div className="container max-w-3xl py-4 flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">KnockBot AI</h1>
                <p className="text-xs text-muted-foreground">
                  Trợ lý tìm phòng & bạn cùng phòng
                </p>
              </div>
            </div>
          </div>

          {/* Token Balance Badge + Recharge + Clear History */}
          <div className="flex items-center gap-2">
            <Badge
              variant={
                knockCoin >= 5
                  ? "default"
                  : knockCoin > 0
                    ? "secondary"
                    : "destructive"
              }
              className="flex items-center gap-1 px-3 py-1"
            >
              <Coins className="h-3.5 w-3.5" />
              <span>{knockCoin} KnockCoin</span>
            </Badge>
            <Button
              onClick={() => navigate("/tenant/ai-payment")}
              size="sm"
              className="rounded-full px-4 bg-accent text-white hover:bg-accent/90"
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Nạp xu
            </Button>
            <Button
              onClick={handleClearHistory}
              disabled={isClearingHistory || isLoading}
              size="sm"
              variant="ghost"
              className="rounded-full px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Xóa lịch sử chat"
            >
              {isClearingHistory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin mb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {/* Bot avatar */}
                {msg.role === "bot" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mt-1">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "glass-card rounded-bl-md"
                  }`}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.role === "bot"
                      ? formatContent(msg.content)
                      : msg.content}
                  </div>

                  {/* Room Result Cards */}
                  {msg.results && msg.results.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.results.map((room) => {
                        const id = room._id as string;
                        const title = room.title as string;
                        const images = room.images as string[] | undefined;
                        const district = room.district as string | undefined;
                        const address = room.address as string | undefined;
                        const price = room.price as number;
                        const area = room.area as number | undefined;
                        return (
                          <Link key={id} to={`/rooms/${id}`} className="block">
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/60">
                              <CardContent className="p-3">
                                {/* Room image + info */}
                                <div className="flex gap-3">
                                  {images?.[0] && (
                                    <img
                                      src={images[0]}
                                      alt={title}
                                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm line-clamp-1">
                                      {title}
                                    </h4>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="line-clamp-1">
                                        {district || address}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1">
                                      <DollarSign className="h-3 w-3 text-primary flex-shrink-0" />
                                      <span className="text-sm font-bold text-primary">
                                        {formatPrice(price)}
                                      </span>
                                    </div>
                                    {area && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <Home className="h-3 w-3 flex-shrink-0" />
                                        <span>{area} m²</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Amenity badges */}
                                {(() => {
                                  const amenities = getActiveAmenities(room);
                                  return amenities.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {amenities.slice(0, 5).map((label) => (
                                        <Badge
                                          key={label}
                                          variant="secondary"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          <Check className="h-2.5 w-2.5 mr-0.5" />
                                          {label}
                                        </Badge>
                                      ))}
                                      {amenities.length > 5 && (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] px-1.5 py-0"
                                        >
                                          +{amenities.length - 5}
                                        </Badge>
                                      )}
                                    </div>
                                  ) : null;
                                })()}
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Roommate Profile Cards */}
                  {msg.roommates && msg.roommates.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.roommates.map((profile: Record<string, unknown>) => {
                        const userObj = profile.userId as Record<
                          string,
                          unknown
                        > | null;
                        const name = (userObj?.fullName as string) ?? "Ẩn danh";
                        const avatar = userObj?.avatarUrl as string | undefined;
                        const initials = name
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase();
                        const budgetMin = profile.budgetMin as
                          | number
                          | undefined;
                        const budgetMax = profile.budgetMax as
                          | number
                          | undefined;
                        const budget =
                          budgetMin && budgetMax
                            ? `${(budgetMin / 1e6).toFixed(1)}–${(budgetMax / 1e6).toFixed(1)} triệu/tháng`
                            : budgetMax
                              ? `Dưới ${(budgetMax / 1e6).toFixed(1)} triệu/tháng`
                              : null;
                        const districts =
                          (profile.preferredDistrict as string[]) ?? [];
                        const bio = profile.bio as string | undefined;
                        const prefs = (profile.preferences ?? {}) as Record<
                          string,
                          unknown
                        >;
                        return (
                          <Link
                            key={profile._id as string}
                            to="/find-roommate"
                            className="block"
                          >
                            <Card className="hover:shadow-md transition-shadow cursor-pointer border-border/60">
                              <CardContent className="p-3">
                                <div className="flex gap-3 items-start">
                                  {/* Avatar */}
                                  <div className="flex-shrink-0 h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                                    {avatar ? (
                                      <img
                                        src={avatar}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-primary-foreground font-bold text-sm">
                                        {initials}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm">
                                      {name}
                                    </h4>
                                    {budget && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <DollarSign className="h-3 w-3 flex-shrink-0" />
                                        <span>{budget}</span>
                                      </div>
                                    )}
                                    {districts.length > 0 && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="line-clamp-1">
                                          {districts.join(", ")}
                                        </span>
                                      </div>
                                    )}
                                    {bio && (
                                      <div className="flex items-start gap-1 text-xs text-muted-foreground mt-0.5">
                                        <BookOpen className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                        <span className="line-clamp-2">
                                          {bio}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    <Users className="h-2.5 w-2.5 mr-0.5" />
                                    Tìm bạn phòng
                                  </Badge>
                                  {prefs.smoking === "no_smoke_ok" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Không hút thuốc
                                    </Badge>
                                  )}
                                  {prefs.pets === "have_pet" && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                    >
                                      Nuôi thú cưng
                                    </Badge>
                                  )}
                                  {prefs.genderPreference &&
                                    prefs.genderPreference !==
                                      "no_preference" && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0"
                                      >
                                        {prefs.genderPreference === "male"
                                          ? "Ưu tiên nam"
                                          : "Ưu tiên nữ"}
                                      </Badge>
                                    )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.role === "user"
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mt-1">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  />
                  <motion.span
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-destructive/10 text-destructive text-sm flex-shrink-0"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-xs underline"
            >
              Đóng
            </button>
          </motion.div>
        )}

        {/* No Tokens Warning */}
        {isOutofCoins && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex items-center gap-2 p-3 mb-3 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm flex-shrink-0"
          >
            <Coins className="h-4 w-4 flex-shrink-0" />
            <span>
              Bạn đã hết lượt miễn phí và không đủ KnockCoin. Vui lòng nạp thêm
              để tiếp tục.
            </span>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 flex items-center gap-2 glass-card rounded-2xl p-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              !isOutofCoins
                ? "Nhập câu hỏi... (Enter để gửi)"
                : "Hết lượt miễn phí/coin — không thể gửi tin nhắn"
            }
            disabled={isLoading || isOutofCoins}
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50"
          />
          <Button
            size="icon"
            className="h-10 w-10 rounded-xl flex-shrink-0"
            onClick={handleSend}
            disabled={isLoading || !inputText.trim() || isOutofCoins}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
