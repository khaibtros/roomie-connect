// src/lib/mockData.ts
import { QuizResults, Room, User } from '@/types';

export const MOCK_USERS: User[] = [
  {
    id: 'tenant-demo',
    name: 'Sinh viên Demo',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    age: 21,
    university: 'FPT University',
    major: 'CNTT',
    year: 3,
    bio: 'Thích yên tĩnh, không hút thuốc, ưu tiên gần trường.',
    preferences: {
      personalityType: "INTJ",
      lifestyleTags: ["SPACE_NEEDED", "BOUNDARY_CLEAR", "CLEANLINESS_HIGH"],
      personalityScores: { E: 0, I: 5, S: 2, N: 6, T: 4, F: 1, J: 5, P: 2 },
    },
    zaloId: '0912345678',
    verified: true
  },
  {
    id: 'user-anna',
    name: 'Anna',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    age: 22,
    university: 'ĐHQG Hà Nội',
    major: 'Kinh tế',
    year: 4,
    bio: 'Hoà đồng, thích nấu ăn nhiều.',
    preferences: {
      personalityType: "ESFP",
      lifestyleTags: ["SHARING_HIGH", "GUEST_FLEXIBLE", "ADAPTIVE"],
      personalityScores: { E: 7, I: 1, S: 6, N: 2, T: 1, F: 5, J: 1, P: 8 },
    },
    verified: false
  }
];

export const MOCK_ROOMS: Room[] = [
  {
    id: 'r1',
    title: 'Studio full nội thất gần FPT University',
    description: 'Studio khép kín, đủ đồ, an ninh 24/7, ban công thoáng.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
    ],
    price: 3500000,
    deposit: 3500000,
    area: 25,
    maxOccupants: 2,
    floor: 3,
    roomType: 'studio',
    address: 'Số 15, Ngõ 42, Thôn Phú Vinh, Thạch Hòa',
    district: 'Thạch Hòa',
    amenities: ['Điều hoà', 'WC khép kín', 'Wifi', 'Giường', 'Tủ quần áo'],
    nearbyPlaces: ['FPT University', 'Circle K'],
    utilities: { electricity: 3500, water: '100k/người', internet: 0, cleaning: 'Miễn phí', parking: 100000 },
    owner: { id: 'owner-1', name: 'Cô Lan', phone: '0912345678', avatar: '', verified: true },
    status: 'available',
    postedAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-15'),
    views: 1250
  },
  {
    id: 'r2',
    title: 'Phòng ghép 2 người gần Hola Park',
    description: 'Phòng ở ghép, thân thiện sinh viên, giá rẻ.',
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
    ],
    price: 2000000,
    deposit: 2000000,
    area: 20,
    maxOccupants: 2,
    floor: 2,
    roomType: 'shared',
    address: 'Số 8, Đường đôi Tân Xã',
    district: 'Tân Xã',
    amenities: ['Wifi', 'Máy giặt chung'],
    nearbyPlaces: ['Hola Park', 'ĐHQG Hà Nội'],
    utilities: { electricity: 3800, water: 25000, internet: 50000, cleaning: 50000, parking: 'Miễn phí' },
    owner: { id: 'owner-2', name: 'Chú Hùng', phone: '0987654321', avatar: '', verified: true },
    status: 'available',
    postedAt: new Date(),
    updatedAt: new Date(),
    views: 890
  },
  // add more rich entries as needed
];

