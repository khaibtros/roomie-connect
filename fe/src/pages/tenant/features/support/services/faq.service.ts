import type { FAQItem, FAQCategory } from "../types"

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    category: "ACCOUNT",
    question: "Làm thế nào để đổi mật khẩu?",
    answer:
      "Vào Hồ sơ → Đổi mật khẩu, nhập mật khẩu hiện tại và mật khẩu mới, sau đó xác nhận.",
  },
  {
    id: "2",
    category: "ACCOUNT",
    question: "Cách xác minh tài khoản?",
    answer:
      "Xác minh email qua đường link gửi đến hộp thư của bạn sau khi đăng ký.",
  },
  {
    id: "3",
    category: "SEARCH",
    question: "Làm thế nào để lọc phòng theo khu vực?",
    answer:
      "Trên trang Tìm phòng, nhấn vào bộ lọc và chọn quận/phường muốn tìm.",
  },
  {
    id: "4",
    category: "SEARCH",
    question: "Tính năng AI tìm phòng hoạt động như thế nào?",
    answer:
      "AI phân tích yêu cầu của bạn bằng ngôn ngữ tự nhiên và đề xuất các phòng phù hợp nhất.",
  },
  {
    id: "5",
    category: "PAYMENT",
    question: "Các phương thức thanh toán được hỗ trợ?",
    answer:
      "KnockKnock hỗ trợ thanh toán qua ví điện tử, chuyển khoản ngân hàng và thẻ tín dụng/ghi nợ.",
  },
  {
    id: "6",
    category: "PAYMENT",
    question: "Làm thế nào để nạp tiền vào ví?",
    answer:
      "Vào mục Ví trong hồ sơ, chọn Nạp tiền và làm theo hướng dẫn với phương thức thanh toán của bạn.",
  },
  {
    id: "7",
    category: "SECURITY",
    question: "Dữ liệu cá nhân có được bảo mật không?",
    answer:
      "Tất cả dữ liệu được mã hóa và bảo mật. Chúng tôi tuân thủ nghiêm ngặt các quy định bảo vệ dữ liệu.",
  },
  {
    id: "8",
    category: "SECURITY",
    question: "Tôi có thể báo cáo tài khoản lừa đảo như thế nào?",
    answer:
      "Nhấn vào nút Báo cáo trên trang hồ sơ người dùng đó, chọn lý do và gửi báo cáo.",
  },
]

export const faqService = {
  getAll(): FAQItem[] {
    return FAQ_DATA
  },

  getByCategory(category: FAQCategory): FAQItem[] {
    return FAQ_DATA.filter((item) => item.category === category)
  },
}
