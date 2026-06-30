import { User, Room, QuizResults, RoomOwner } from "@/types";

// ============= ROOM OWNERS =============
const OWNERS: RoomOwner[] = [
  {
    id: "owner-1",
    name: "Cô Lan",
    phone: "0912345678",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    verified: true,
    responseRate: 98,
  },
  {
    id: "owner-2",
    name: "Chú Hùng",
    phone: "0987654321",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    verified: true,
    responseRate: 95,
  },
  {
    id: "owner-3",
    name: "Em Trang",
    phone: "0909123456",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    verified: true,
    responseRate: 100,
  },
  {
    id: "owner-4",
    name: "Bác Minh",
    phone: "0901234567",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    verified: false,
    responseRate: 85,
  },
  {
    id: "owner-5",
    name: "Cô Hương",
    phone: "0934567890",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    verified: true,
    responseRate: 92,
  },
];

// ============= MOCK ROOMS (15+ with rich data) =============
export const MOCK_ROOMS: Room[] = [
  {
    id: "1",
    title: "Studio khép kín full nội thất gần FPT University",
    description: `Phòng studio cao cấp, thiết kế hiện đại, phù hợp cho sinh viên và người đi làm.

✅ Diện tích rộng rãi 25m², thoáng mát
✅ Nội thất đầy đủ: giường, tủ, bàn học, điều hoà
✅ WC khép kín riêng biệt
✅ Cửa sổ lớn, đón nắng tự nhiên
✅ An ninh 24/7, có camera giám sát

Vị trí thuận tiện:
- Cách FPT University 500m
- Gần Circle K, Bách Hoá Xanh
- Xe buýt 88 đi qua`,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    price: 3500000,
    deposit: 3500000,
    area: 25,
    maxOccupants: 2,
    floor: 3,
    roomType: "studio",
    address: "Số 15, Ngõ 42, Thôn Phú Vinh, Thạch Hòa",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà",
      "WC khép kín",
      "Wifi",
      "Giường",
      "Tủ quần áo",
      "Bàn học",
      "Nóng lạnh",
    ],
    nearbyPlaces: ["FPT University", "Circle K", "Bách Hoá Xanh"],
    utilities: {
      electricity: 3500,
      water: "100k/người",
      internet: 0,
      cleaning: "Miễn phí",
      parking: 100000,
    },
    owner: OWNERS[0],
    status: "available",
    postedAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-15"),
    views: 1250,
  },
  {
    id: "2",
    title: "Phòng ghép 2 người, full đồ gần Hola Park",
    description: `Phòng ở ghép lý tưởng cho sinh viên, giá cực kỳ tiết kiệm.

✅ Phòng 2 giường, tiện nghi đầy đủ
✅ Có điều hoà, tủ lạnh chung
✅ Không gian chung rộng rãi
✅ Môi trường sinh viên thân thiện

Phù hợp cho bạn nữ, ưu tiên sinh viên FPT/ĐHQG.`,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    price: 2000000,
    deposit: 2000000,
    area: 20,
    maxOccupants: 2,
    floor: 2,
    roomType: "shared",
    address: "Số 8, Đường đôi Tân Xã, Thôn 4",
    district: "Tân Xã",
    amenities: ["Điều hoà", "Wifi", "Tủ lạnh chung", "Máy giặt chung"],
    nearbyPlaces: ["Hola Park", "ĐHQG Hà Nội", "Chợ Tân Xã"],
    utilities: {
      electricity: 3800,
      water: 25000,
      internet: 50000,
      cleaning: 50000,
      parking: "Miễn phí",
    },
    owner: OWNERS[1],
    status: "available",
    postedAt: new Date("2025-01-12"),
    updatedAt: new Date("2025-01-14"),
    views: 890,
  },
  {
    id: "3",
    title: "Căn hộ mini view đẹp, ban công thoáng mát",
    description: `Căn hộ mini cao cấp với view tuyệt đẹp, ban công rộng rãi.

✅ Thiết kế mở, tối ưu không gian
✅ Bếp riêng, có hút mùi
✅ Ban công rộng có thể trồng cây
✅ View đẹp nhìn ra cánh đồng

Thích hợp cho cặp đôi hoặc người đi làm cần không gian riêng tư.`,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    price: 4000000,
    deposit: 8000000,
    area: 30,
    maxOccupants: 2,
    floor: 5,
    roomType: "apartment",
    address: "Số 22, Đường Láng Hòa Lạc, Km 29",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà",
      "WC khép kín",
      "Wifi",
      "Bếp riêng",
      "Ban công",
      "Nóng lạnh",
      "Tủ bếp",
    ],
    nearbyPlaces: ["FPT University", "Vinmart", "Trạm xăng Petrolimex"],
    utilities: {
      electricity: 3500,
      water: 80000,
      internet: 0,
      cleaning: "Miễn phí",
      parking: 150000,
    },
    owner: OWNERS[2],
    status: "available",
    postedAt: new Date("2025-01-08"),
    updatedAt: new Date("2025-01-13"),
    views: 2100,
  },
  {
    id: "4",
    title: "KTX mini cho sinh viên, giá siêu rẻ",
    description: `Ký túc xá mini dành cho sinh viên muốn tiết kiệm chi phí.

✅ Giường tầng chất lượng cao
✅ Wifi miễn phí cả ngày
✅ Có quạt trần và điều hoà chung
✅ WC chung sạch sẽ, dọn dẹp hàng ngày

Ưu tiên sinh viên năm 1-2, không hút thuốc.`,
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
    ],
    price: 1500000,
    deposit: 1500000,
    area: 15,
    maxOccupants: 4,
    floor: 1,
    roomType: "shared",
    address: "Số 5, Ngõ 15, Thôn 3, Hòa Lạc",
    district: "Thạch Thất",
    amenities: [
      "Wifi",
      "Giường tầng",
      "WC chung",
      "Quạt trần",
      "Tủ đồ cá nhân",
    ],
    nearbyPlaces: ["FPT University", "Quán ăn sinh viên", "Sân bóng"],
    utilities: {
      electricity: 0,
      water: 0,
      internet: 0,
      cleaning: 0,
      parking: "Miễn phí",
    },
    owner: OWNERS[3],
    status: "available",
    postedAt: new Date("2025-01-14"),
    updatedAt: new Date("2025-01-14"),
    views: 450,
  },
  {
    id: "5",
    title: "Căn hộ studio cao cấp, full tiện nghi Thạch Hòa",
    description: `Căn hộ studio đẳng cấp dành cho người có yêu cầu cao về chất lượng sống.

✅ Smart TV 50 inch
✅ Máy giặt riêng trong phòng
✅ Bếp từ + lò vi sóng
✅ Phòng tắm cao cấp với bồn tắm đứng
✅ Thang máy, bảo vệ 24/7

Phù hợp cho người đi làm, cặp đôi, hoặc sinh viên năm cuối.`,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    price: 5500000,
    deposit: 11000000,
    area: 35,
    maxOccupants: 2,
    floor: 8,
    roomType: "apartment",
    address: "Tòa nhà Golden, 100 Đại lộ Thăng Long",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà",
      "WC khép kín",
      "Wifi",
      "Bếp từ",
      "Máy giặt",
      "Smart TV",
      "Thang máy",
      "Bảo vệ 24/7",
    ],
    nearbyPlaces: [
      "FPT University",
      "Lotte Mart",
      "Phòng Gym",
      "Cafe The Coffee House",
    ],
    utilities: {
      electricity: 3500,
      water: 100000,
      internet: 0,
      cleaning: "Miễn phí",
      parking: 200000,
    },
    owner: OWNERS[0],
    status: "available",
    postedAt: new Date("2025-01-11"),
    updatedAt: new Date("2025-01-15"),
    views: 3200,
  },
  {
    id: "6",
    title: "Phòng trọ gia đình, an ninh tốt Tân Xã",
    description: `Phòng trọ trong khu dân cư yên tĩnh, an ninh đảm bảo.

✅ Chủ nhà ở cùng, thân thiện
✅ Có chỗ nấu ăn riêng
✅ Giờ giấc thoải mái
✅ Có chỗ phơi đồ riêng

Ưu tiên sinh viên nữ hoặc người đi làm.`,
    images: [
      "https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    ],
    price: 2800000,
    deposit: 2800000,
    area: 22,
    maxOccupants: 2,
    floor: 2,
    roomType: "single",
    address: "Số 45, Khu dân cư Tân Xã, Thôn 2",
    district: "Tân Xã",
    amenities: [
      "Điều hoà",
      "WC khép kín",
      "Wifi",
      "Bảo vệ 24/7",
      "Chỗ nấu ăn",
      "Chỗ phơi đồ",
    ],
    nearbyPlaces: ["ĐHQG Hà Nội", "Chợ Tân Xã", "Bưu điện"],
    utilities: {
      electricity: 3800,
      water: "80k/người",
      internet: 100000,
      cleaning: 0,
      parking: "Miễn phí",
    },
    owner: OWNERS[4],
    status: "available",
    postedAt: new Date("2025-01-13"),
    updatedAt: new Date("2025-01-15"),
    views: 780,
  },
  {
    id: "7",
    title: "Phòng đơn giá rẻ cho sinh viên Bình Yên",
    description: `Phòng nhỏ gọn, giá cả phải chăng cho sinh viên ngân sách hạn chế.

✅ Phòng sạch sẽ, thoáng mát
✅ Gần chợ và quán ăn
✅ Có ban công nhỏ
✅ Giờ giấc tự do`,
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
    ],
    price: 1800000,
    deposit: 1800000,
    area: 14,
    maxOccupants: 1,
    floor: 3,
    roomType: "single",
    address: "Số 12, Ngõ 8, Thôn Bình Yên",
    district: "Bình Yên",
    amenities: ["Quạt trần", "Wifi", "WC chung", "Ban công nhỏ"],
    nearbyPlaces: ["Chợ Bình Yên", "Quán phở 24h", "FPT University (2km)"],
    utilities: {
      electricity: 4000,
      water: 50000,
      internet: 0,
      cleaning: 0,
      parking: 50000,
    },
    owner: OWNERS[3],
    status: "available",
    postedAt: new Date("2025-01-09"),
    updatedAt: new Date("2025-01-12"),
    views: 320,
  },
  {
    id: "8",
    title: "Phòng master trong nhà nguyên căn Thạch Hòa",
    description: `Phòng master rộng rãi trong nhà 3 tầng, share với 2 phòng khác.

✅ Phòng lớn nhất trong nhà (25m²)
✅ WC riêng trong phòng
✅ Có điều hoà 2 chiều
✅ Share bếp và phòng khách rộng

Đang tìm 1 bạn nam hoặc nữ share nhà, ưu tiên người đi làm.`,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    ],
    price: 3200000,
    deposit: 6400000,
    area: 25,
    maxOccupants: 2,
    floor: 2,
    roomType: "single",
    address: "Số 88, Đường Láng Hòa Lạc, Thạch Hòa",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà 2 chiều",
      "WC khép kín",
      "Wifi",
      "Bếp chung",
      "Phòng khách",
      "Sân vườn",
    ],
    nearbyPlaces: ["FPT University", "Vinmart", "Cafe Highlands"],
    utilities: {
      electricity: 3500,
      water: "100k/người",
      internet: 0,
      cleaning: 0,
      parking: "Miễn phí",
    },
    owner: OWNERS[2],
    status: "available",
    postedAt: new Date("2025-01-07"),
    updatedAt: new Date("2025-01-14"),
    views: 1450,
  },
  {
    id: "9",
    title: "Penthouse mini view toàn cảnh Hòa Lạc",
    description: `Phòng tầng thượng với view panorama tuyệt đẹp.

✅ Tầng cao nhất, view 360 độ
✅ Sân thượng riêng có thể BBQ
✅ Thiết kế hiện đại, ánh sáng tự nhiên
✅ Yên tĩnh, riêng tư tuyệt đối`,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    ],
    price: 6000000,
    deposit: 12000000,
    area: 40,
    maxOccupants: 2,
    floor: 10,
    roomType: "apartment",
    address: "Penthouse, Tòa A, Hòa Lạc Residence",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà",
      "WC khép kín",
      "Wifi",
      "Bếp đầy đủ",
      "Sân thượng",
      "Thang máy",
      "Smart Home",
    ],
    nearbyPlaces: ["FPT University", "The Coffee House", "Gym Center"],
    utilities: {
      electricity: 3500,
      water: 150000,
      internet: 0,
      cleaning: "Miễn phí",
      parking: "Miễn phí",
    },
    owner: OWNERS[0],
    status: "available",
    postedAt: new Date("2025-01-05"),
    updatedAt: new Date("2025-01-15"),
    views: 4500,
  },
  {
    id: "10",
    title: "Phòng trọ giá tốt gần ĐHQG Hà Nội",
    description: `Phòng trọ giá sinh viên, cực kỳ gần ĐHQG.

✅ Đi bộ 5 phút đến ĐHQG
✅ Gần nhiều quán ăn bình dân
✅ Môi trường sinh viên thân thiện
✅ Có thể nấu ăn`,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    ],
    price: 2200000,
    deposit: 2200000,
    area: 18,
    maxOccupants: 2,
    floor: 2,
    roomType: "single",
    address: "Số 33, Ngõ 52, Đường đôi Tân Xã",
    district: "Tân Xã",
    amenities: ["Điều hoà", "Wifi", "WC chung", "Bếp chung", "Chỗ để xe"],
    nearbyPlaces: ["ĐHQG Hà Nội", "Cơm rang Dì Ba", "Phở Thìn"],
    utilities: {
      electricity: 3800,
      water: 70000,
      internet: 50000,
      cleaning: 30000,
      parking: "Miễn phí",
    },
    owner: OWNERS[1],
    status: "available",
    postedAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-13"),
    views: 670,
  },
  {
    id: "11",
    title: "Studio mới xây 100%, hiện đại Thạch Hòa",
    description: `Phòng mới xây hoàn toàn, chưa ai ở, nội thất mới 100%.

✅ Mới xây xong tháng 12/2024
✅ Nội thất nhập khẩu cao cấp
✅ Hệ thống điện âm tường an toàn
✅ Cách âm tốt, yên tĩnh`,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
    ],
    price: 4200000,
    deposit: 8400000,
    area: 28,
    maxOccupants: 2,
    floor: 4,
    roomType: "studio",
    address: "Số 168, Đường Láng Hòa Lạc, Thạch Hòa",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà",
      "WC khép kín",
      "Wifi",
      "Giường Nhật",
      "Bàn học",
      "Nóng lạnh",
      "Tủ âm tường",
    ],
    nearbyPlaces: ["FPT University", "Circle K", "Cafe Cộng"],
    utilities: {
      electricity: 3500,
      water: "90k/người",
      internet: 0,
      cleaning: "Miễn phí",
      parking: 100000,
    },
    owner: OWNERS[4],
    status: "available",
    postedAt: new Date("2025-01-14"),
    updatedAt: new Date("2025-01-15"),
    views: 2800,
  },
  {
    id: "12",
    title: "Phòng ghép nữ, sạch sẽ văn minh Tân Xã",
    description: `Phòng ghép dành riêng cho bạn nữ, môi trường sạch sẽ, an toàn.

✅ Chỉ nhận bạn nữ
✅ Phòng 3 người, còn 1 giường trống
✅ Có điều hoà, nóng lạnh riêng
✅ Chủ nhà là cô giáo, thân thiện`,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    price: 1700000,
    deposit: 1700000,
    area: 24,
    maxOccupants: 3,
    floor: 2,
    roomType: "shared",
    address: "Số 7, Ngõ 15, Khu giáo viên Tân Xã",
    district: "Tân Xã",
    amenities: [
      "Điều hoà",
      "Nóng lạnh",
      "Wifi",
      "Giường riêng",
      "Tủ riêng",
      "WC chung",
    ],
    nearbyPlaces: ["ĐHQG Hà Nội", "Hola Park", "Siêu thị mini"],
    utilities: {
      electricity: 0,
      water: 0,
      internet: 0,
      cleaning: 0,
      parking: "Miễn phí",
    },
    owner: OWNERS[4],
    status: "available",
    postedAt: new Date("2025-01-11"),
    updatedAt: new Date("2025-01-14"),
    views: 520,
  },
  {
    id: "13",
    title: "Nhà nguyên căn 3 phòng ngủ cho nhóm bạn",
    description: `Nhà nguyên căn phù hợp cho nhóm 4-6 bạn ở cùng.

✅ 3 phòng ngủ riêng biệt
✅ Phòng khách + bếp rộng rãi
✅ 2 WC, 1 khép kín
✅ Sân trước có thể để 5 xe máy
✅ Hợp đồng dài hạn từ 1 năm`,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    price: 8000000,
    deposit: 16000000,
    area: 80,
    maxOccupants: 6,
    floor: 1,
    roomType: "apartment",
    address: "Số 256, Đường đôi Tân Xã, Thạch Thất",
    district: "Thạch Thất",
    amenities: [
      "3 Điều hoà",
      "2 WC",
      "Wifi",
      "Bếp đầy đủ",
      "Phòng khách",
      "Sân trước",
      "Máy giặt",
    ],
    nearbyPlaces: ["FPT University", "ĐHQG Hà Nội", "Chợ đêm"],
    utilities: {
      electricity: 3500,
      water: 25000,
      internet: 200000,
      cleaning: 0,
      parking: "Miễn phí",
    },
    owner: OWNERS[1],
    status: "available",
    postedAt: new Date("2025-01-06"),
    updatedAt: new Date("2025-01-12"),
    views: 1890,
  },
  {
    id: "14",
    title: "Phòng đẹp view hồ sen, yên tĩnh học tập",
    description: `Phòng view hồ sen thơ mộng, cực kỳ yên tĩnh cho việc học tập.

✅ View trực diện hồ sen
✅ Không khí trong lành, mát mẻ
✅ Cách xa đường lớn, không ồn
✅ Phù hợp cho ai cần tập trung học`,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    ],
    price: 2600000,
    deposit: 2600000,
    area: 20,
    maxOccupants: 1,
    floor: 3,
    roomType: "single",
    address: "Số 18, Ngõ Hồ Sen, Thôn Phú Vinh",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà",
      "WC khép kín",
      "Wifi",
      "Giường",
      "Bàn học lớn",
      "View hồ",
    ],
    nearbyPlaces: ["FPT University", "Thư viện cộng đồng"],
    utilities: {
      electricity: 3500,
      water: "80k/người",
      internet: 0,
      cleaning: 50000,
      parking: 80000,
    },
    owner: OWNERS[2],
    status: "available",
    postedAt: new Date("2025-01-08"),
    updatedAt: new Date("2025-01-11"),
    views: 940,
  },
  {
    id: "15",
    title: "Duplex 2 tầng cao cấp, nội thất sang trọng",
    description: `Căn hộ duplex 2 tầng sang trọng, đẳng cấp nhất khu vực.

✅ Tầng 1: Phòng khách + Bếp + WC
✅ Tầng 2: Phòng ngủ master + Ban công
✅ Nội thất nhập khẩu Italy
✅ Smart home điều khiển qua app
✅ Hồ bơi chung trong tòa nhà`,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    price: 9500000,
    deposit: 19000000,
    area: 55,
    maxOccupants: 2,
    floor: 9,
    roomType: "apartment",
    address: "Duplex B5, Hòa Lạc Premium Residence",
    district: "Thạch Hòa",
    amenities: [
      "Điều hoà",
      "WC cao cấp",
      "Wifi",
      "Smart Home",
      "Hồ bơi",
      "Gym",
      "Thang máy",
      "Bảo vệ 24/7",
    ],
    nearbyPlaces: ["FPT University", "Lotte Mart", "CGV Cinema"],
    utilities: {
      electricity: 3500,
      water: 200000,
      internet: 0,
      cleaning: "Miễn phí",
      parking: "Miễn phí",
    },
    owner: OWNERS[0],
    status: "available",
    postedAt: new Date("2025-01-04"),
    updatedAt: new Date("2025-01-15"),
    views: 5600,
  },
];

// ============= MOCK USERS =============
export const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Minh Anh",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    age: 20,
    university: "FPT University",
    major: "Công nghệ thông tin",
    year: 2,
    bio: "Thích code và chơi game. Tìm bạn ở ghép văn minh, ngăn nắp.",
    preferences: {
      personalityType: "INTJ",
      lifestyleTags: ["BOUNDARY_CLEAR", "CLEANLINESS_HIGH", "SPACE_NEEDED"],
      personalityScores: { E: 0, I: 5, S: 2, N: 6, T: 4, F: 1, J: 5, P: 2 },
    },
    verified: true,
  },
  {
    id: "2",
    name: "Hoàng Long",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    age: 21,
    university: "ĐHQG Hà Nội",
    major: "Kinh tế",
    year: 3,
    bio: "Sinh viên năm 3, thích thể thao và nấu ăn. Đang tìm bạn ở ghép cùng sở thích.",
    preferences: {
      personalityType: "ESFP",
      lifestyleTags: ["ADAPTIVE", "SHARING_HIGH", "GUEST_FLEXIBLE"],
      personalityScores: { E: 7, I: 1, S: 6, N: 2, T: 1, F: 5, J: 1, P: 8 },
    },
    verified: true,
  },
  {
    id: "3",
    name: "Thu Hà",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    age: 19,
    university: "FPT University",
    major: "Thiết kế đồ họa",
    year: 1,
    bio: "Sinh viên năm nhất, thích vẽ và đọc sách. Tìm bạn hiền lành.",
    preferences: {
      personalityType: "INFP",
      lifestyleTags: ["CLEANLINESS_FLEXIBLE", "HARMONY_HIGH"],
      personalityScores: { E: 2, I: 6, S: 1, N: 7, T: 2, F: 6, J: 3, P: 5 },
    },
    verified: false,
  },
  {
    id: "4",
    name: "Đức Anh",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    age: 22,
    university: "ĐHQG Hà Nội",
    major: "Luật",
    year: 4,
    bio: "Sinh viên năm cuối, cần không gian yên tĩnh để học tập.",
    preferences: {
      personalityType: "ISTJ",
      lifestyleTags: ["BOUNDARY_CLEAR", "CLEANLINESS_HIGH", "GUEST_CONTROL"],
      personalityScores: { E: 1, I: 8, S: 7, N: 2, T: 6, F: 2, J: 8, P: 1 },
    },
    verified: true,
  },
  {
    id: "5",
    name: "Khánh Linh",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    age: 20,
    university: "FPT University",
    major: "Marketing",
    year: 2,
    bio: "Thích giao lưu, kết bạn. Hay tổ chức tiệc nhỏ cuối tuần.",
    preferences: {
      personalityType: "ENFP",
      lifestyleTags: ["ADAPTIVE", "GUEST_FLEXIBLE", "HARMONY_FLEXIBLE"],
      personalityScores: { E: 8, I: 2, S: 2, N: 6, T: 3, F: 7, J: 2, P: 6 },
    },
    verified: true,
  },
  {
    id: "6",
    name: "Văn Hùng",
    avatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    age: 21,
    university: "FPT University",
    major: "An ninh mạng",
    year: 3,
    bio: "Làm việc đêm, ngủ ngày. Cần bạn ở ghép thông cảm lịch trình.",
    preferences: {
      personalityType: "INTP",
      lifestyleTags: ["ADAPTIVE", "SPACE_NEEDED", "PROBLEM_SOLVING_DIRECT"],
      personalityScores: { E: 2, I: 7, S: 3, N: 6, T: 7, F: 2, J: 1, P: 8 },
    },
    verified: true,
  },
  {
    id: "7",
    name: "Phương Thảo",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    age: 19,
    university: "ĐHQG Hà Nội",
    major: "Ngôn ngữ Anh",
    year: 1,
    bio: "Thích nấu ăn và dọn dẹp. Tìm bạn gái ở ghép sạch sẽ.",
    preferences: {
      personalityType: "ISFJ",
      lifestyleTags: ["BOUNDARY_CLEAR", "SHARING_HIGH", "CLEANLINESS_HIGH"],
      personalityScores: { E: 3, I: 6, S: 6, N: 2, T: 4, F: 6, J: 7, P: 2 },
    },
    verified: false,
  },
  {
    id: "8",
    name: "Quang Minh",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    age: 23,
    university: "FPT University",
    major: "Quản trị kinh doanh",
    year: 4,
    bio: "Đang đi thực tập, cần phòng yên tĩnh. Ít ở nhà.",
    preferences: {
      personalityType: "ESTJ",
      lifestyleTags: ["HARMONY_FLEXIBLE", "CLEANLINESS_FLEXIBLE"],
      personalityScores: { E: 6, I: 3, S: 7, N: 2, T: 8, F: 2, J: 7, P: 2 },
    },
    verified: true,
  },
  {
    id: "9",
    name: "Ngọc Mai",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    age: 20,
    university: "FPT University",
    major: "Truyền thông đa phương tiện",
    year: 2,
    bio: "Hay làm video đêm khuya. Thích nuôi mèo.",
    preferences: {
      personalityType: "ENFJ",
      lifestyleTags: ["ADAPTIVE", "HARMONY_HIGH", "GUEST_FLEXIBLE"],
      personalityScores: { E: 8, I: 1, S: 4, N: 6, T: 3, F: 7, J: 6, P: 3 },
    },
    verified: true,
  },
  {
    id: "10",
    name: "Tuấn Kiệt",
    avatar:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face",
    age: 21,
    university: "ĐHQG Hà Nội",
    major: "Công nghệ sinh học",
    year: 3,
    bio: "Thích chơi bóng đá cuối tuần. Tìm bạn năng động.",
    preferences: {
      personalityType: "ESTP",
      lifestyleTags: ["BOUNDARY_CLEAR", "GUEST_FLEXIBLE", "SHARING_HIGH"],
      personalityScores: { E: 7, I: 2, S: 8, N: 1, T: 6, F: 3, J: 2, P: 7 },
    },
    verified: true,
  },
];

export const DEFAULT_USER_PREFERENCES: QuizResults = {
  personalityType: "ENFP",
  lifestyleTags: ["ADAPTIVE", "CLEANLINESS_FLEXIBLE"],
  personalityScores: { E: 6, I: 4, S: 3, N: 7, T: 2, F: 8, J: 3, P: 7 },
};
