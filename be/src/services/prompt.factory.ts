/**
 * PromptFactory — Scoped prompt builders per intent.
 *
 * Architecture:
 *   Intent → Intent Router → PromptFactory (this module) → LLM
 *
 * Critical design rules:
 * 1. Each intent has its OWN prompt builder — no shared "general" builder.
 * 2. Memory injection is SCOPED by intent:
 *    - FIND_ROOM:      only location + budget (from DB filters, not memory)
 *    - FIND_ROOMMATE:  only roommate preferences (from DB profiles, not memory)
 *    - GENERAL_QA:     minimal context (location + budget only)
 *    - SMALL_TALK:     ZERO memory injection
 * 3. roommatePreferences (sleepTime, smoking, pets…) NEVER appear in
 *    FIND_ROOM, GENERAL_QA, or SMALL_TALK prompts.
 * 4. This prevents "context contamination" e.g. "phòng ngủ sớm" in greetings.
 */

import { IRoom } from "../models/Room";
import { IRoommateProfile } from "../models/RoommateProfile";
import type { RoomComparisonData } from "./compare.service";

// ---------------------------------------------------------------------------
// SMALL_TALK — Zero memory injection
// ---------------------------------------------------------------------------

/**
 * Prompt for simple greetings / acknowledgements.
 * NEVER injects location, budget, or roommate preferences.
 * This prevents the LLM from hallucinating domain-specific suggestions
 * (e.g. "phòng ngủ sớm") when the user just says "xin chào".
 */
export function buildSmallTalkPrompt(userMessage: string): string {
  return [
    "Bạn là trợ lý AI tên KnockBot của nền tảng thuê phòng trọ KnockKnock.",
    "Trả lời bằng tiếng Việt, thân thiện, ngắn gọn.",
    "KHÔNG đề cập đến phòng trọ, giá phòng, khu vực, ngân sách, giờ ngủ, hút thuốc, hoặc bất kỳ sở thích cá nhân nào trừ khi người dùng hỏi trực tiếp.",
    "Chỉ chào hỏi hoặc trả lời đúng nội dung người dùng nhắn.",
    "",
    `Người dùng: "${userMessage}"`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// GENERAL_QA — Minimal memory (location + budget only, NO roommate prefs)
// ---------------------------------------------------------------------------

/** Memory scope allowed for GENERAL_QA — excludes roommate preferences. */
export interface GeneralQAMemory {
  location?: string;
  budget?: number;
}

/**
 * Prompt for general questions about the platform.
 * Injects ONLY location + budget from memory. Never injects sleepTime,
 * smoking, pets, or any roommate preference.
 */
export function buildGeneralQAPrompt(
  userMessage: string,
  memory?: GeneralQAMemory | null,
): string {
  const contextLines: string[] = [];
  if (memory?.location)
    contextLines.push(`Khu vực người dùng quan tâm: ${memory.location}`);
  if (memory?.budget)
    contextLines.push(
      `Ngân sách: ${(memory.budget / 1_000_000).toFixed(1)} triệu/tháng`,
    );

  return [
    "Bạn là trợ lý AI tên KnockBot của nền tảng thuê phòng trọ KnockKnock.",
    "KnockBot chỉ hỗ trợ khu vực xã Thạch Hòa và xã Tân Xã, Thạch Thất, Hà Nội.",
    "Trả lời bằng tiếng Việt, thân thiện, ngắn gọn.",
    "Nếu người dùng hỏi về phòng hoặc bạn ghép ngoài khu vực trên, nhắc họ KnockBot chỉ hỗ trợ Thạch Hòa và Tân Xã.",
    "KHÔNG đề cập sở thích cá nhân (giờ ngủ, hút thuốc, thú cưng…) trừ khi người dùng hỏi trực tiếp.",
    ...(contextLines.length > 0
      ? ["", "[Ngữ cảnh tối thiểu]", ...contextLines]
      : []),
    "",
    `Người dùng: "${userMessage}"`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// FIND_ROOM — DB results only, zero roommate preference injection
// ---------------------------------------------------------------------------

/**
 * Prompt for room search results from the database.
 * Receives ONLY the DB query results — no memory injection at all.
 * Location + budget are already encoded in the DB query filters.
 */
export function buildRoomPrompt(rooms: IRoom[], userMessage: string): string {
  const roomList = rooms
    .map((r, i) => {
      const price = `${(r.price / 1_000_000).toFixed(1)} triệu/tháng`;
      const area  = r.area ? `${r.area}m²` : "diện tích chưa có";
      return `${i + 1}. ${r.title} | ${price} | ${area} | ${r.address}, ${r.district}`;
    })
    .join("\n");

  return [
    "Bạn là trợ lý AI của nền tảng KnockKnock.",
    "Dưới đây là kết quả TỪ CƠ SỞ DỮ LIỆU THẬT (MongoDB).",
    "QUY TẮC BẮT BUỘC:",
    "- CHỈ được dùng thông tin trong danh sách này.",
    "- KHÔNG ĐƯỢC bịa ra bất kỳ phòng nào khác.",
    "- KHÔNG ĐƯỢC thêm tên thành phố, quận, khu vực nào ngoài thông tin có sẵn trong địa chỉ của từng phòng.",
    "- Khi nhắc đến địa chỉ, CHỈ dùng đúng địa chỉ ghi trong danh sách, không suy đoán thêm.",
    "- Nếu thông tin không có trong danh sách, nói rõ là không có.",
    "",
    `[Kết quả — ${rooms.length} phòng phù hợp]`,
    roomList,
    "",
    `Yêu cầu người dùng: "${userMessage}"`,
    "",
    "Hãy tóm tắt danh sách trên bằng tiếng Việt, thân thiện, ngắn gọn.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// FIND_ROOMMATE — DB results only, preferences already in profile data
// ---------------------------------------------------------------------------

/** Human-readable Vietnamese labels for quiz preference enum values. */
const PREF_LABELS: Record<string, string> = {
  // sleepTime
  early: "ngủ sớm", late: "thức khuya", poor_sleep: "ngủ không ngon", flexible: "giờ ngủ linh hoạt",
  // smoking
  smoke_indoors: "hút thuốc trong nhà", smoke_outdoors: "hút thuốc ngoài trời",
  no_smoke_ok: "không hút thuốc", hate_smoke: "ghét khói thuốc",
  // pets
  have_pet: "đang nuôi thú cưng", like_pet: "thích thú cưng",
  allergic: "dị ứng thú cưng", indifferent: "không quan tâm thú cưng",
  // socialHabit
  extrovert: "hướng ngoại", introvert: "hướng nội",
  ambivert: "vừa hướng ngoại vừa nội tâm", reserved: "trầm tính",
  // cookingHabit
  cook_daily: "nấu ăn hàng ngày", cook_simple: "nấu đơn giản",
  eat_out: "hay ăn ngoài", cook_together: "thích nấu chung",
  // guests
  often: "thường có khách", sometimes: "thỉnh thoảng có khách",
  rarely: "ít khi có khách", never: "không có khách",
  // alcohol
  often_drink: "hay uống rượu", sometimes_drink: "thỉnh thoảng uống",
  never_drink_home: "không uống tại nhà", cant_drink: "không uống được rượu",
  // roomCleaning
  daily: "dọn phòng hàng ngày", weekly: "dọn hàng tuần",
  when_messy: "dọn khi bừa",
  // genderPreference
  male: "tìm bạn nam", female: "tìm bạn nữ",
  lgbtq: "LGBTQ+ friendly", no_preference: "không quan trọng giới tính",
};

function labelPref(value: string | undefined): string {
  if (!value) return "";
  return PREF_LABELS[value] ?? value;
}

/**
 * Prompt for roommate search results from the database.
 * Receives ONLY the DB query results — roommate preferences are embedded
 * in each profile's data, NOT injected from user memory.
 */
export function buildRoommatePrompt(profiles: IRoommateProfile[], userMessage: string): string {
  const list = profiles
    .map((p, i) => {
      const user = p.userId as unknown as Record<string, unknown>;
      const name = (user?.fullName as string) ?? "Ẩn danh";
      const budget =
        p.budgetMin && p.budgetMax
          ? `${(p.budgetMin / 1_000_000).toFixed(1)}–${(p.budgetMax / 1_000_000).toFixed(1)} triệu/tháng`
          : p.budgetMax
          ? `dưới ${(p.budgetMax / 1_000_000).toFixed(1)} triệu/tháng`
          : "chưa xác định";
      const districts = p.preferredDistrict?.join(", ") || "không giới hạn";

      // Build a concise preference summary from stored quiz answers
      const prefs = p.preferences ?? {};
      const prefTags = [
        labelPref(prefs.sleepTime),
        labelPref(prefs.smoking),
        labelPref(prefs.pets),
        labelPref(prefs.socialHabit),
        labelPref(prefs.cookingHabit),
        labelPref(prefs.guests),
        labelPref(prefs.alcohol),
        labelPref(prefs.roomCleaning),
        labelPref(prefs.genderPreference),
      ].filter(Boolean).join(" · ");

      const bio = p.bio ? ` | "${p.bio}"` : "";
      const prefLine = prefTags ? ` | ${prefTags}` : "";
      return `${i + 1}. ${name} | Ngân sách: ${budget} | Khu vực: ${districts}${prefLine}${bio}`;
    })
    .join("\n");

  return [
    "Bạn là trợ lý AI của nền tảng KnockKnock.",
    "Dưới đây là danh sách người đang tìm bạn cùng phòng (từ cơ sở dữ liệu thật).",
    "QUY TẮC BẮT BUỘC:",
    "- CHỈ được dùng thông tin trong danh sách.",
    "- KHÔNG ĐƯỢC bịa thêm người nào.",
    "- Giới thiệu ngắn gọn từng người, nêu bật đặc điểm phù hợp với yêu cầu.",
    "",
    `[Kết quả — ${profiles.length} người phù hợp]`,
    list,
    "",
    `Yêu cầu người dùng: "${userMessage}"`,
    "",
    "Hãy giới thiệu những người phù hợp bằng tiếng Việt, thân thiện, ngắn gọn. Với mỗi người, hãy nêu rõ vì sao họ phù hợp với yêu cầu.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// COMPARE_ROOMS — structured comparison context injection
// ---------------------------------------------------------------------------

/**
 * Prompt for room comparison. Receives the normalised comparison payload.
 *
 * The structured data block tells the model EXACTLY what to compare.
 * Hard rules prevent hallucination and enforce data-grounded conclusions.
 *
 * Format contract the model must follow:
 *   • Short intro line
 *   • Per-room criterion breakdown
 *   • "Nhận xét nhanh" section
 *   • "Gợi ý lựa chọn" section tailored to common needs
 */
export function buildComparisonPrompt(
  rooms: RoomComparisonData[],
  userMessage: string,
): string {
  const roomBlock = rooms
    .map((r, i) => {
      const lines: string[] = [
        `[Phòng ${i + 1}] ${r.title}`,
        `  Giá thuê: ${(r.price / 1_000_000).toFixed(1)} triệu/tháng`,
      ];

      if (r.area !== null) lines.push(`  Diện tích: ${r.area} m²`);
      if (r.deposit !== null)
        lines.push(`  Tiền cọc: ${(r.deposit / 1_000_000).toFixed(1)} triệu`);
      lines.push(`  Sức chứa: ${r.capacity} người`);
      lines.push(`  Địa chỉ: ${r.address}, ${r.district}`);

      if (r.electricityPrice !== null)
        lines.push(`  Giá điện: ${r.electricityPrice.toLocaleString("vi-VN")}đ/kWh`);
      if (r.waterPrice !== null)
        lines.push(`  Giá nước: ${r.waterPrice.toLocaleString("vi-VN")}đ/m³`);
      if (r.internetPrice !== null)
        lines.push(`  Internet: ${r.internetPrice.toLocaleString("vi-VN")}đ/tháng`);

      if (r.amenities.length > 0)
        lines.push(`  Tiện ích: ${r.amenities.join(", ")}`);
      else
        lines.push("  Tiện ích: (chưa có thông tin)");

      return lines.join("\n");
    })
    .join("\n\n");

  return [
    "Bạn là trợ lý AI tên KnockBot của nền tảng KnockKnock.",
    `Người dùng yêu cầu so sánh ${rooms.length} phòng trọ sau (dữ liệu thực từ cơ sở dữ liệu):`,
    "",
    roomBlock,
    "",
    "QUY TẮC BẮT BUỘC:",
    "- CHỈ sử dụng thông tin trong dữ liệu trên. KHÔNG bịa ra bất kỳ thông tin nào.",
    "- Nếu một tiêu chí không có dữ liệu, ghi rõ 'chưa có thông tin' — không đoán.",
    "- So sánh trực tiếp và cụ thể: nêu con số thực tế (giá, diện tích, ...).",
    "- Nêu ưu và nhược điểm thực tế của từng phòng.",
    "- Kết luận gợi ý theo từng nhu cầu: tiết kiệm chi phí, ưu tiên diện tích, tiện nghi, vị trí.",
    "- Trả lời bằng tiếng Việt, thân thiện, rõ ràng, dễ đọc.",
    "",
    "YÊU CẦU FORMAT trả lời:",
    "1. Mở đầu ngắn (1 câu)",
    "2. So sánh từng tiêu chí chính: giá, diện tích, tiền cọc, sức chứa, tiện ích",
    "3. Nhận xét nhanh: ưu/nhược của từng phòng (2–3 dòng mỗi phòng)",
    "4. Gợi ý lựa chọn: nên chọn phòng nào nếu ưu tiên tiết kiệm / tiện nghi / không gian / vị trí",
    "",
    `Yêu cầu người dùng: "${userMessage}"`,
  ].join("\n");
}
