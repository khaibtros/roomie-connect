import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User, Room, RoommateProfile, Wallet, Notification } from "../models";

dotenv.config();

// Mock data migrated from frontend
const OWNERS_DATA = [
  {
    email: "colan@roomie.com",
    password: "password123",
    fullName: "Cô Lan",
    phone: "0912345678",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "chuhung@roomie.com",
    password: "password123",
    fullName: "Chú Hùng",
    phone: "0987654321",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "emtrang@roomie.com",
    password: "password123",
    fullName: "Em Trang",
    phone: "0909123456",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "bacminh@roomie.com",
    password: "password123",
    fullName: "Bác Minh",
    phone: "0901234567",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    isVerified: false,
    role: "landlord" as const,
  },
  {
    email: "cohuong@roomie.com",
    password: "password123",
    fullName: "Cô Hương",
    phone: "0934567890",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    isVerified: true,
    role: "landlord" as const,
  },
  // Additional landlords from adminMockData
  {
    email: "phung.do@example.com",
    password: "password123",
    fullName: "Phùng Thanh Độ",
    phone: "0901234001",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "le.rieng@example.com",
    password: "password123",
    fullName: "Lê Thị Riêng",
    phone: "0901234002",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "hoang.e@example.com",
    password: "password123",
    fullName: "Hoàng Văn E",
    phone: "0901234005",
    isVerified: true,
    role: "landlord" as const,
  },
  {
    email: "luongh@example.com",
    password: "password123",
    fullName: "Lương Văn H",
    phone: "0901234008",
    isVerified: true,
    role: "landlord" as const,
  },
];

const USERS_DATA = [
  {
    email: "minhanh@fpt.edu.vn",
    password: "password123",
    fullName: "Minh Anh",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "late",
      socialHabit: "introvert",
      smoking: "hate_smoke",
      roomCleaning: "daily",
    },
  },
  {
    email: "hoanglong@vnu.edu.vn",
    password: "password123",
    fullName: "Hoàng Long",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    university: "ĐHQG Hà Nội",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "early",
      socialHabit: "extrovert",
      smoking: "hate_smoke",
      roomCleaning: "weekly",
      pets: "like_pet",
    },
  },
  {
    email: "thuha@fpt.edu.vn",
    password: "password123",
    fullName: "Thu Hà",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: false,
    role: "tenant" as const,
    preferences: {
      sleepTime: "flexible",
      socialHabit: "ambivert",
      smoking: "hate_smoke",
      roomCleaning: "weekly",
    },
  },
  {
    email: "ducanh@vnu.edu.vn",
    password: "password123",
    fullName: "Đức Anh",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    university: "ĐHQG Hà Nội",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "early",
      socialHabit: "introvert",
      smoking: "hate_smoke",
      roomCleaning: "daily",
      guests: "never",
    },
  },
  {
    email: "khanhlinh@fpt.edu.vn",
    password: "password123",
    fullName: "Khánh Linh",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "late",
      socialHabit: "extrovert",
      smoking: "no_smoke_ok",
      roomCleaning: "when_messy",
      guests: "often",
    },
  },
  {
    email: "vanhung@fpt.edu.vn",
    password: "password123",
    fullName: "Văn Hùng",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "late",
      socialHabit: "introvert",
      smoking: "hate_smoke",
      roomCleaning: "weekly",
    },
  },
  {
    email: "phuongthao@vnu.edu.vn",
    password: "password123",
    fullName: "Phương Thảo",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    university: "ĐHQG Hà Nội",
    isVerified: false,
    role: "tenant" as const,
    preferences: {
      sleepTime: "flexible",
      socialHabit: "ambivert",
      smoking: "hate_smoke",
      roomCleaning: "daily",
      pets: "like_pet",
    },
  },
  {
    email: "quangminh@fpt.edu.vn",
    password: "password123",
    fullName: "Quang Minh",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "flexible",
      socialHabit: "ambivert",
      smoking: "hate_smoke",
      roomCleaning: "weekly",
    },
  },
  {
    email: "ngocmai@fpt.edu.vn",
    password: "password123",
    fullName: "Ngọc Mai",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face",
    university: "FPT University",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "late",
      socialHabit: "ambivert",
      smoking: "hate_smoke",
      roomCleaning: "when_messy",
      pets: "like_pet",
    },
  },
  {
    email: "tuankiet@vnu.edu.vn",
    password: "password123",
    fullName: "Tuấn Kiệt",
    avatarUrl:
      "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face",
    university: "ĐHQG Hà Nội",
    isVerified: true,
    role: "tenant" as const,
    preferences: {
      sleepTime: "early",
      socialHabit: "extrovert",
      smoking: "hate_smoke",
      roomCleaning: "weekly",
      guests: "often",
      pets: "like_pet",
    },
  },
  // Additional tenants from adminMockData
  {
    email: "nguyenvana@example.com",
    password: "password123",
    fullName: "Nguyễn Văn A",
    phone: "0901234003",
    isVerified: true,
    role: "tenant" as const,
  },
  {
    email: "tranb@example.com",
    password: "password123",
    fullName: "Trần Thị B",
    phone: "0901234004",
    isVerified: true,
    role: "tenant" as const,
  },
  {
    email: "ngominhf@example.com",
    password: "password123",
    fullName: "Ngô Minh F",
    phone: "0901234006",
    isVerified: false,
    role: "tenant" as const,
  },
  {
    email: "phamg@example.com",
    password: "password123",
    fullName: "Phạm Thị G",
    phone: "0901234007",
    isVerified: true,
    role: "tenant" as const,
  },
  {
    email: "dovani@example.com",
    password: "password123",
    fullName: "Đỗ Văn I",
    phone: "0901234009",
    isVerified: true,
    role: "tenant" as const,
  },
  {
    email: "buik@example.com",
    password: "password123",
    fullName: "Bùi Thị K",
    phone: "0901234010",
    isVerified: true,
    role: "tenant" as const,
  },
];

const ROOMS_DATA = [
  {
    title: "Studio khép kín full nội thất gần FPT University",
    description: `Phòng studio cao cấp, thiết kế hiện đại, phù hợp cho sinh viên và người đi làm.

✅ Diện tích rộng rãi 25m², thoáng mát
✅ Nội thất đầy đủ: giường, tủ, bàn học, điều hoà
✅ WC khép kín riêng biệt
✅ Cửa sổ lớn, đón nắng tự nhiên
✅ An ninh 24/7, có camera giám sát`,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    price: 3500000,
    deposit: 3500000,
    area: 25,
    capacity: 2,
    address: "Số 15, Ngõ 42, Thôn Phú Vinh, Thạch Hòa",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasBed: true,
    hasWardrobe: true,
    hasWaterHeater: true,
    hasParking: true,
    status: "active" as const,
    ownerIndex: 0,
  },
  {
    title: "Phòng ghép 2 người, full đồ gần Hola Park",
    description: `Phòng ở ghép lý tưởng cho sinh viên, giá cực kỳ tiết kiệm.

✅ Phòng 2 giường, tiện nghi đầy đủ
✅ Có điều hoà, tủ lạnh chung
✅ Không gian chung rộng rãi
✅ Môi trường sinh viên thân thiện`,
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    ],
    price: 2000000,
    deposit: 2000000,
    area: 20,
    capacity: 2,
    address: "Số 8, Đường đôi Tân Xã, Thôn 4",
    district: "Tân Xã",
    hasAirConditioner: true,
    hasFridge: true,
    hasSharedWashing: true,
    status: "active" as const,
    ownerIndex: 1,
  },
  {
    title: "Căn hộ mini view đẹp, ban công thoáng mát",
    description: `Căn hộ mini cao cấp với view tuyệt đẹp, ban công rộng rãi.

✅ Thiết kế mở, tối ưu không gian
✅ Bếp riêng, có hút mùi
✅ Ban công rộng có thể trồng cây
✅ View đẹp nhìn ra cánh đồng`,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    price: 4000000,
    deposit: 8000000,
    area: 30,
    capacity: 2,
    address: "Số 22, Đường Láng Hòa Lạc, Km 29",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasKitchen: true,
    hasWaterHeater: true,
    status: "active" as const,
    ownerIndex: 2,
  },
  {
    title: "KTX mini cho sinh viên, giá siêu rẻ",
    description: `Ký túc xá mini dành cho sinh viên muốn tiết kiệm chi phí.

✅ Giường tầng chất lượng cao
✅ Wifi miễn phí cả ngày
✅ Có quạt trần và điều hoà chung
✅ WC chung sạch sẽ, dọn dẹp hàng ngày`,
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
    ],
    price: 1500000,
    deposit: 1500000,
    area: 15,
    capacity: 4,
    address: "Số 5, Ngõ 15, Thôn 3, Hòa Lạc",
    district: "Thạch Thất",
    hasBed: true,
    status: "active" as const,
    ownerIndex: 3,
  },
  {
    title: "Căn hộ studio cao cấp, full tiện nghi Thạch Hòa",
    description: `Căn hộ studio đẳng cấp dành cho người có yêu cầu cao về chất lượng sống.

✅ Smart TV 50 inch
✅ Máy giặt riêng trong phòng
✅ Bếp từ + lò vi sóng
✅ Phòng tắm cao cấp với bồn tắm đứng
✅ Thang máy, bảo vệ 24/7`,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    price: 5500000,
    deposit: 11000000,
    area: 35,
    capacity: 2,
    address: "Tòa nhà Golden, 100 Đại lộ Thăng Long",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasPrivateWashing: true,
    hasElevator: true,
    hasSecurityCamera: true,
    isFullyFurnished: true,
    status: "active" as const,
    ownerIndex: 0,
  },
  {
    title: "Phòng trọ gia đình, an ninh tốt Tân Xã",
    description: `Phòng trọ trong khu dân cư yên tĩnh, an ninh đảm bảo.

✅ Chủ nhà ở cùng, thân thiện
✅ Có chỗ nấu ăn riêng
✅ Giờ giấc thoải mái
✅ Có chỗ phơi đồ riêng`,
    images: [
      "https://images.unsplash.com/photo-1630699144867-37acec97df5a?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    ],
    price: 2800000,
    deposit: 2800000,
    area: 22,
    capacity: 2,
    address: "Số 45, Khu dân cư Tân Xã, Thôn 2",
    district: "Tân Xã",
    hasAirConditioner: true,
    hasKitchen: true,
    hasDryingArea: true,
    status: "active" as const,
    ownerIndex: 4,
  },
  {
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
    capacity: 1,
    address: "Số 12, Ngõ 8, Thôn Bình Yên",
    district: "Bình Yên",
    status: "active" as const,
    ownerIndex: 3,
  },
  {
    title: "Phòng master trong nhà nguyên căn Thạch Hòa",
    description: `Phòng master rộng rãi trong nhà 3 tầng, share với 2 phòng khác.

✅ Phòng lớn nhất trong nhà (25m²)
✅ WC riêng trong phòng
✅ Có điều hoà 2 chiều
✅ Share bếp và phòng khách rộng`,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
    ],
    price: 3200000,
    deposit: 6400000,
    area: 25,
    capacity: 2,
    address: "Số 88, Đường Láng Hòa Lạc, Thạch Hòa",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasKitchen: true,
    status: "active" as const,
    ownerIndex: 2,
  },
  {
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
    capacity: 2,
    address: "Penthouse, Tòa A, Hòa Lạc Residence",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasKitchen: true,
    hasElevator: true,
    status: "active" as const,
    ownerIndex: 0,
  },
  {
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
    capacity: 2,
    address: "Số 33, Ngõ 52, Đường đôi Tân Xã",
    district: "Tân Xã",
    hasAirConditioner: true,
    hasKitchen: true,
    status: "active" as const,
    ownerIndex: 1,
  },
  {
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
    capacity: 2,
    address: "Số 168, Đường Láng Hòa Lạc, Thạch Hòa",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasBed: true,
    hasWardrobe: true,
    hasWaterHeater: true,
    status: "active" as const,
    ownerIndex: 4,
  },
  {
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
    capacity: 3,
    address: "Số 7, Ngõ 15, Khu giáo viên Tân Xã",
    district: "Tân Xã",
    hasAirConditioner: true,
    hasWaterHeater: true,
    hasBed: true,
    hasWardrobe: true,
    status: "active" as const,
    ownerIndex: 4,
  },
  {
    title: "Nhà nguyên căn 3 phòng ngủ cho nhóm bạn",
    description: `Nhà nguyên căn phù hợp cho nhóm 4-6 bạn ở cùng.

✅ 3 phòng ngủ riêng biệt
✅ Phòng khách + bếp rộng rãi
✅ 2 WC, 1 khép kín
✅ Sân trước có thể để 5 xe máy`,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    ],
    price: 8000000,
    deposit: 16000000,
    area: 80,
    capacity: 6,
    address: "Số 256, Đường đôi Tân Xã, Thạch Thất",
    district: "Thạch Thất",
    hasAirConditioner: true,
    hasKitchen: true,
    hasPrivateWashing: true,
    hasParking: true,
    status: "active" as const,
    ownerIndex: 1,
  },
  {
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
    capacity: 1,
    address: "Số 18, Ngõ Hồ Sen, Thôn Phú Vinh",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasBed: true,
    hasWardrobe: true,
    status: "active" as const,
    ownerIndex: 2,
  },
  {
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
    capacity: 2,
    address: "Duplex B5, Hòa Lạc Premium Residence",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasKitchen: true,
    hasElevator: true,
    hasSecurityCamera: true,
    isFullyFurnished: true,
    status: "active" as const,
    ownerIndex: 0,
  },
  // Pending rooms from adminMockData
  {
    title: "Phòng trọ gần FPT - 20m²",
    description: "Phòng trọ tiện nghi gần trường FPT",
    images: [],
    price: 2500000,
    deposit: 2500000,
    area: 20,
    capacity: 2,
    address: "Thạch Hòa, Hòa Lạc",
    district: "Thạch Hòa",
    status: "pending" as const,
    ownerIndex: 5,
  },
  {
    title: "Studio mini Hòa Lạc",
    description: "Studio mini hiện đại",
    images: [],
    price: 3500000,
    deposit: 3500000,
    area: 25,
    capacity: 2,
    address: "Tân Xã, Hòa Lạc",
    district: "Tân Xã",
    status: "pending" as const,
    ownerIndex: 6,
  },
  {
    title: "Phòng có gác gần trường",
    description: "Phòng có gác tiện lợi",
    images: [],
    price: 1800000,
    deposit: 1800000,
    area: 18,
    capacity: 2,
    address: "Bình Yên, Thạch Thất",
    district: "Bình Yên",
    status: "pending" as const,
    ownerIndex: 3,
  },
  {
    title: "Căn hộ mini - đầy đủ tiện nghi",
    description: "Căn hộ mini full nội thất",
    images: [],
    price: 4200000,
    deposit: 4200000,
    area: 30,
    capacity: 2,
    address: "Hạ Bằng, Hòa Lạc",
    district: "Thạch Hòa",
    hasAirConditioner: true,
    hasBed: true,
    hasKitchen: true,
    status: "pending" as const,
    ownerIndex: 4,
  },
  {
    title: "Phòng cho thuê giá rẻ",
    description: "Phòng trọ giá tốt",
    images: [],
    price: 1200000,
    deposit: 1200000,
    area: 15,
    capacity: 1,
    address: "Hola Park, Hòa Lạc",
    district: "Thạch Hòa",
    status: "pending" as const,
    ownerIndex: 7,
  },
];

async function seed() {
  try {
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/roomie-connect";

    console.log("🌱 Starting seed process...");
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🗑️  Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      RoommateProfile.deleteMany({}),
      Wallet.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // Create admin users
    console.log("👤 Creating admin users...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await User.create({
      email: "admin@roomie.com",
      password: adminPassword,
      fullName: "Admin",
      role: "admin",
      isVerified: true,
    });

    // Create owners (landlords)
    console.log("🏠 Creating landlord users...");
    const owners = [];
    const landlordWalletBalances = [
      5000000, 3000000, 5000000, 800000, 3000000, 5000000, 3000000, 1200000,
      800000,
    ]; // Balances from adminMockData

    for (let i = 0; i < OWNERS_DATA.length; i++) {
      const ownerData = OWNERS_DATA[i];
      const hashedPassword = await bcrypt.hash(ownerData.password, 10);
      const owner = await User.create({
        ...ownerData,
        password: hashedPassword,
      });
      owners.push(owner);

      // Create wallet for landlord
      await Wallet.create({
        userId: owner._id,
        balance: landlordWalletBalances[i] || 1000000,
        transactions: [],
      });
    }

    // Create tenant users with roommate profiles
    console.log("👥 Creating tenant users...");
    for (const userData of USERS_DATA) {
      const { preferences, ...userFields } = userData;
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const user = await User.create({
        ...userFields,
        password: hashedPassword,
        aiTokens: { tokens: 20, maxTokens: 1000 }, // Give tenants 20 free AI tokens
      });

      // Create roommate profile
      await RoommateProfile.create({
        userId: user._id,
        bio: `Sinh viên ${userData.university}`,
        university: userData.university,
        isPublic: true,
        preferences,
      });

      // Create wallet
      await Wallet.create({
        userId: user._id,
        balance: Math.floor(Math.random() * 500000),
        transactions: [],
      });
    }

    // Create rooms
    console.log("🏡 Creating rooms...");
    for (const roomData of ROOMS_DATA) {
      const { ownerIndex, ...roomFields } = roomData;
      await Room.create({
        ...roomFields,
        landlordId: owners[ownerIndex]._id,
      });
    }

    // Create some notifications for users
    console.log("🔔 Creating sample notifications...");
    const users = await User.find({ role: "tenant" }).limit(3);
    for (const user of users) {
      await Notification.create({
        userId: user._id,
        title: "Chào mừng đến Roomie Connect!",
        message:
          "Cảm ơn bạn đã đăng ký. Hãy hoàn thành quiz để tìm bạn ở phù hợp nhất!",
        type: "welcome",
        isRead: false,
      });
    }

    // Summary
    const stats = {
      users: await User.countDocuments(),
      rooms: await Room.countDocuments(),
      profiles: await RoommateProfile.countDocuments(),
      wallets: await Wallet.countDocuments(),
      notifications: await Notification.countDocuments(),
    };

    console.log(`
✅ Seed completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Created:
   • ${stats.users} users (1 admin, ${OWNERS_DATA.length} landlords, ${USERS_DATA.length} tenants)
   • ${stats.rooms} rooms
   • ${stats.profiles} roommate profiles
   • ${stats.wallets} wallets
   • ${stats.notifications} notifications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Admin login: admin@roomie.com / admin123
    `);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
