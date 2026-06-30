export interface QuizOption {
  label: string;
  text: string;
  firstPoleScore?: number;
  secondPoleScore?: number;
  conflictScore?: number;
  trait?: string; // legacy
  lifestyleTag?: string; // legacy
}

export interface QuizQuestion {
  id: number;
  section: string;
  sectionDescription?: string;
  type: string;
  question: string;
  dimension: string;
  firstPole?: string;
  secondPole?: string;
  options: QuizOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    section: "Nguồn năng lượng",
    sectionDescription: "Hướng nội I - Hướng ngoại E",
    type: "Trực tiếp",
    question: "Sau một tuần làm việc bận rộn, một buổi tối lý tưởng với bạn là:",
    dimension: "E_I",
    firstPole: "E",
    secondPole: "I",
    options: [
      { label: "A", text: "Hẹn cả nhóm bạn đi ăn uống, trò chuyện ồn ào đến khuya", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Gặp 1-2 người bạn thân, trò chuyện nhẹ nhàng ở một nơi yên tĩnh", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Ở nhà, làm việc mình thích, thỉnh thoảng nhắn tin với vài người", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Tắt điện thoại, không liên lạc với ai, tận hưởng không gian riêng", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 2,
    section: "Nguồn năng lượng",
    sectionDescription: "Hướng nội I - Hướng ngoại E",
    type: "Trực tiếp",
    question: "Trong thang máy, hàng chờ, hoặc trên chuyến bay, khi gặp người lạ ngồi cạnh, bạn thường:",
    dimension: "E_I",
    firstPole: "E",
    secondPole: "I",
    options: [
      { label: "A", text: "Chủ động bắt chuyện ngay, thấy đó là cơ hội thú vị", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Mỉm cười xã giao rồi để cuộc trò chuyện tự nhiên diễn ra nếu có", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Trả lời lịch sự nếu được hỏi, nhưng không chủ động mở lời", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Đeo tai nghe hoặc nhìn điện thoại để tránh phải trò chuyện", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 3,
    section: "Nguồn năng lượng",
    sectionDescription: "Hướng nội I - Hướng ngoại E",
    type: "Cài cắm",
    question: "Khi đang suy nghĩ về một vấn đề khó, bạn có xu hướng:",
    dimension: "E_I",
    firstPole: "E",
    secondPole: "I",
    options: [
      { label: "A", text: "Gọi ngay cho ai đó để vừa nói vừa tìm ra hướng giải quyết", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Hỏi ý kiến vài người, nhưng vẫn để bản thân tự quyết", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Viết ra giấy hoặc ghi chú, suy nghĩ một mình là chính", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Cần hoàn toàn yên tĩnh, không ai làm phiền, mới nghĩ thông suốt", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 4,
    section: "Nguồn năng lượng",
    sectionDescription: "Hướng nội I - Hướng ngoại E",
    type: "Cài cắm",
    question: "Vòng tròn bạn bè của bạn trông giống:",
    dimension: "E_I",
    firstPole: "E",
    secondPole: "I",
    options: [
      { label: "A", text: "Một mạng lưới rộng, quen biết rất nhiều người ở nhiều nhóm khác nhau", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Một nhóm bạn vừa phải, gặp gỡ luân phiên nhiều hội khác nhau", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Một vài nhóm nhỏ thân thiết, ít khi mở rộng thêm", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Chỉ một vài người bạn rất thân, gắn bó lâu năm", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 5,
    section: "Cách tiếp nhận thông tin",
    sectionDescription: "Giác quan S - Trực giác N",
    type: "Cài cắm",
    question: "Khi bước vào một quán cà phê mới, điều bạn để ý đầu tiên là:",
    dimension: "S_N",
    firstPole: "S",
    secondPole: "N",
    options: [
      { label: "A", text: "Mùi hương, ánh sáng, chất liệu bàn ghế - những gì có thể cảm nhận ngay", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Cách bài trí tổng thể có hợp lý, tiện dụng hay không", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Không khí, \"vibe\" và cảm giác chung mà nơi này gợi lên", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Câu chuyện hoặc ý tưởng đằng sau cách thiết kế không gian này", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 6,
    section: "Cách tiếp nhận thông tin",
    sectionDescription: "Giác quan S - Trực giác N",
    type: "Trực tiếp",
    question: "Bạn thích những cuộc trò chuyện xoay quanh:",
    dimension: "S_N",
    firstPole: "S",
    secondPole: "N",
    options: [
      { label: "A", text: "Những sự việc, tin tức cụ thể đang diễn ra", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Kinh nghiệm thực tế, cách làm một việc gì đó hiệu quả", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Những khả năng, ý tưởng mới chưa ai từng nghĩ tới", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Những chủ đề trừu tượng như ý nghĩa cuộc sống, tương lai loài người", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 7,
    section: "Cách tiếp nhận thông tin",
    sectionDescription: "Giác quan S - Trực giác N",
    type: "Tình huống",
    question: "Sếp giao cho bạn một bài thuyết trình nhưng chỉ đưa một ý tưởng mơ hồ, không có chi tiết cụ thể. Bạn cảm thấy:",
    dimension: "S_N",
    firstPole: "S",
    secondPole: "N",
    options: [
      { label: "A", text: "Khó chịu, muốn hỏi lại thật rõ ràng các yêu cầu trước khi bắt tay làm", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Hơi bối rối nhưng sẽ cố gắng hỏi thêm để có hướng đi rõ ràng hơn", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Khá thoải mái, tự xây dựng khung sườn theo cách hiểu của mình", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Rất hào hứng, vì đây là không gian tự do để sáng tạo theo ý mình", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 8,
    section: "Cách tiếp nhận thông tin",
    sectionDescription: "Giác quan S - Trực giác N",
    type: "Trực tiếp",
    question: "Khi đưa ra quyết định, bạn tin tưởng vào:",
    dimension: "S_N",
    firstPole: "S",
    secondPole: "N",
    options: [
      { label: "A", text: "Những gì đã được kiểm chứng bằng kinh nghiệm thực tế", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Sự kết hợp giữa kinh nghiệm và một chút trực giác cá nhân", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Trực giác và cảm nhận của bản thân là chủ yếu", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Những khả năng tiềm ẩn mà người khác chưa nhìn thấy", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 9,
    section: "Cách ra quyết định",
    sectionDescription: "Lý trí T - Cảm xúc F",
    type: "Trực tiếp",
    question: "Khi phải đưa ra một quyết định quan trọng ảnh hưởng đến nhiều người, bạn ưu tiên:",
    dimension: "T_F",
    firstPole: "T",
    secondPole: "F",
    options: [
      { label: "A", text: "Sự công bằng và hợp lý, dù có thể khiến một số người không vui", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Cân bằng giữa tính hợp lý và cảm xúc của những người liên quan", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Cảm xúc và sự hài hòa của mọi người là ưu tiên hàng đầu", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Tránh tuyệt đối việc khiến bất kỳ ai cảm thấy tổn thương", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 10,
    section: "Cách ra quyết định",
    sectionDescription: "Lý trí T - Cảm xúc F",
    type: "Trực tiếp",
    question: "Khi một người bạn kể về chuyện buồn của họ, phản xạ đầu tiên của bạn là:",
    dimension: "T_F",
    firstPole: "T",
    secondPole: "F",
    options: [
      { label: "A", text: "Phân tích vấn đề và đưa ra hướng giải quyết cụ thể ngay", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Lắng nghe trước, sau đó mới góp ý nếu họ cần", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Ngồi lắng nghe và đồng cảm, chưa vội đưa lời khuyên", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Tập trung hoàn toàn vào việc an ủi, ở bên cạnh họ", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 11,
    section: "Cách ra quyết định",
    sectionDescription: "Lý trí T - Cảm xúc F",
    type: "Cài cắm",
    question: "Trong một cuộc tranh luận nhóm, bạn thường:",
    dimension: "T_F",
    firstPole: "T",
    secondPole: "F",
    options: [
      { label: "A", text: "Thẳng thắn chỉ ra điểm chưa hợp lý trong lập luận của người khác", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Góp ý có chọn lọc, ưu tiên cách nói khéo léo hơn", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Ngại chỉ ra lỗi sai trực tiếp, sợ làm tổn thương người khác", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Ưu tiên giữ không khí hòa thuận hơn là tranh luận đến cùng", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 12,
    section: "Cách ra quyết định",
    sectionDescription: "Lý trí T - Cảm xúc F",
    type: "Trực tiếp",
    question: "Khi chọn giữa hai phương án, bạn thường:",
    dimension: "T_F",
    firstPole: "T",
    secondPole: "F",
    options: [
      { label: "A", text: "Lập danh sách ưu - nhược điểm rõ ràng, chọn theo hiệu quả tổng thể", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Cân nhắc lý trí là chính, có tham khảo thêm cảm giác cá nhân", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Cân nhắc cảm giác là chính, có tham khảo thêm yếu tố lý trí", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Chọn theo cảm giác \"cái nào đúng với mình hơn\"", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 13,
    section: "Cách tổ chức sống",
    sectionDescription: "Nguyên tắc J - Linh hoạt P",
    type: "Trực tiếp",
    question: "Khi chuẩn bị cho một chuyến du lịch, bạn thường:",
    dimension: "J_P",
    firstPole: "J",
    secondPole: "P",
    options: [
      { label: "A", text: "Lên kế hoạch chi tiết từng giờ, từng địa điểm trước cả tuần", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Lên kế hoạch khung chính, còn lại để linh hoạt", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Chỉ đặt vé và chỗ ở, còn lại tính sau khi đến nơi", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Hầu như không lên kế hoạch gì, đi đến đâu tính đến đó", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 14,
    section: "Cách tổ chức sống",
    sectionDescription: "Nguyên tắc J - Linh hoạt P",
    type: "Cài cắm",
    question: "Góc làm việc hoặc phòng của bạn thường:",
    dimension: "J_P",
    firstPole: "J",
    secondPole: "P",
    options: [
      { label: "A", text: "Mọi thứ có vị trí cố định, ngăn nắp, khó chịu nếu bị xê dịch", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Khá gọn gàng, nhưng không quá khắt khe về vị trí từng món", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Có một trật tự riêng theo cách hiểu của mình, người khác nhìn vào thấy hơi lộn xộn", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Khá bừa bộn, nhưng bạn vẫn biết thứ mình cần ở đâu", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 15,
    section: "Cách tổ chức sống",
    sectionDescription: "Nguyên tắc J - Linh hoạt P",
    type: "Cài cắm",
    question: "Khi nhìn vào bàn làm việc hoặc tủ quần áo của một người mới quen, nếu thấy chúng rất ngăn nắp, có hệ thống, bạn:",
    dimension: "J_P",
    firstPole: "J",
    secondPole: "P",
    options: [
      { label: "A", text: "Cảm thấy tin tưởng và yên tâm hơn về họ ngay lập tức", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Có ấn tượng tốt, nhưng chưa hẳn ảnh hưởng nhiều đến đánh giá chung", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Không để ý nhiều, không liên hệ điều đó với tính cách con người", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Thậm chí cảm thấy hơi e ngại vì nghĩ họ có thể quá cứng nhắc", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 16,
    section: "Cách tổ chức sống",
    sectionDescription: "Nguyên tắc J - Linh hoạt P",
    type: "Trực tiếp",
    question: "Cuối tuần lý tưởng với bạn là:",
    dimension: "J_P",
    firstPole: "J",
    secondPole: "P",
    options: [
      { label: "A", text: "Có lịch trình rõ ràng, biết trước mình sẽ làm gì vào mỗi khung giờ", firstPoleScore: 3, secondPoleScore: 0 },
      { label: "B", text: "Có vài việc dự định trước, còn lại để ngỏ", firstPoleScore: 2, secondPoleScore: 1 },
      { label: "C", text: "Chỉ có một ý tưởng mơ hồ, phần lớn để tùy hứng", firstPoleScore: 1, secondPoleScore: 2 },
      { label: "D", text: "Hoàn toàn mở, không có lịch cố định, làm gì cũng được khi đến lúc", firstPoleScore: 0, secondPoleScore: 3 }
    ]
  },
  {
    id: 17,
    section: "Giá trị cốt lõi & xung đột",
    type: "Trực tiếp",
    question: "Khi xảy ra mâu thuẫn với người thân thiết, bạn thường:",
    dimension: "CONFLICT",
    options: [
      { label: "A", text: "Muốn nói chuyện thẳng thắn ngay lập tức để giải quyết dứt điểm", conflictScore: 3 },
      { label: "B", text: "Cần một chút thời gian, nhưng sẽ chủ động nói chuyện trong ngày", conflictScore: 2 },
      { label: "C", text: "Cần vài ngày một mình để bình tĩnh lại trước khi nói chuyện", conflictScore: 1 },
      { label: "D", text: "Có xu hướng tránh né, hy vọng mọi chuyện tự lắng xuống", conflictScore: 0 }
    ]
  },
  {
    id: 18,
    section: "Giá trị cốt lõi & xung đột",
    type: "Trực tiếp",
    question: "Giữa \"trung thực dù gây khó chịu\" và \"giữ hòa khí\", bạn chọn:",
    dimension: "CONFLICT",
    options: [
      { label: "A", text: "Trung thực gần như tuyệt đối, kể cả khi gây khó chịu", conflictScore: 3 },
      { label: "B", text: "Trung thực là ưu tiên, nhưng chọn cách nói khéo léo", conflictScore: 2 },
      { label: "C", text: "Ưu tiên hòa khí, chỉ nói thẳng khi thực sự cần thiết", conflictScore: 1 },
      { label: "D", text: "Hòa khí gần như tuyệt đối, tránh nói điều có thể gây mất lòng", conflictScore: 0 }
    ]
  },
  {
    id: 19,
    section: "Giá trị cốt lõi & xung đột",
    type: "Trực tiếp",
    question: "Với thời gian rảnh khi sống chung, bạn ưu tiên:",
    dimension: "CONFLICT",
    options: [
      { label: "A", text: "Dành nhiều thời gian giao lưu với nhóm bạn/những người sống gần mình", conflictScore: 3 },
      { label: "B", text: "Cân bằng giữa giao lưu chung và không gian riêng", conflictScore: 2 },
      { label: "C", text: "Ưu tiên không gian riêng là chính", conflictScore: 1 },
      { label: "D", text: "Gần như chỉ muốn dành thời gian cho bản thân, hạn chế can thiệp từ người khác", conflictScore: 0 }
    ]
  },
  {
    id: 20,
    section: "Giá trị cốt lõi & xung đột",
    type: "Trực tiếp",
    question: "Khi không đồng tình với quan điểm sống của ai đó, bạn:",
    dimension: "CONFLICT",
    options: [
      { label: "A", text: "Vẫn duy trì mối quan hệ gần gũi, hoàn toàn không bị ảnh hưởng", conflictScore: 3 },
      { label: "B", text: "Vẫn gần gũi, nhưng tránh chủ động nhắc đến chủ đề đó", conflictScore: 2 },
      { label: "C", text: "Mối quan hệ trở nên hơi gượng ép, dù vẫn cố duy trì", conflictScore: 1 },
      { label: "D", text: "Khó có thể duy trì sự gần gũi thực sự với người có quan điểm quá khác mình", conflictScore: 0 }
    ]
  }
];
