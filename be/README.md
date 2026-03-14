# KnockKnock — Backend API

Backend API server cho ứng dụng **KnockKnock** — nền tảng tìm phòng trọ & bạn ở ghép dành cho sinh viên.

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **AI**: Gemini API (default) or Ollama (optional)
- **Dev Tools**: ts-node-dev (hot reload)

## Cách chạy

### 1. Cài đặt dependencies

```bash
cd be
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` trong thư mục `be/`:

```env
PORT=5000
# You can use either MONGODB_URI or MONGO_URI
MONGODB_URI=mongodb://localhost:27017/roomie-connect
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173

# AI provider (default: gemini)
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

# If you want to use Ollama instead:
# AI_PROVIDER=ollama
# OLLAMA_URL=http://localhost:11434
# OLLAMA_MODEL=qwen2.5:7b-instruct
```

### 3. Khởi động MongoDB

- Local: `mongod`
- Hoặc dùng MongoDB Atlas connection string trong `.env`

### 4. Seed dữ liệu mẫu (tuỳ chọn)

```bash
npm run seed
```

### 5. Chạy server development

```bash
npm run dev
```

Server sẽ chạy tại `http://localhost:5000`.

### 6. Build production

```bash
npm run build
npm start
```

## API Endpoints

| Endpoint               | Method     | Auth     | Mô tả                    |
| ---------------------- | ---------- | -------- | ------------------------- |
| `/api/health`          | GET        | Không    | Health check              |
| `/api/auth/register`   | POST       | Không    | Đăng ký tài khoản         |
| `/api/auth/login`      | POST       | Không    | Đăng nhập                 |
| `/api/auth/profile`    | GET / PUT  | Có       | Xem / cập nhật hồ sơ      |
| `/api/rooms`           | GET        | Không    | Danh sách phòng            |
| `/api/rooms/:id`       | GET        | Không    | Chi tiết phòng             |
| `/api/rooms`           | POST       | Landlord | Tạo phòng mới             |
| `/api/roommates`       | GET        | Không    | Danh sách profile tìm bạn  |
| `/api/roommates/match` | POST       | Có       | Tìm bạn ở ghép phù hợp   |
| `/api/ai/chat`         | POST       | Có       | Chat với AI (trừ KnockCoin) |
| `/api/ai/tokens`       | GET        | Có       | Số KnockCoin còn lại      |
| `/api/ai/history`      | GET / DEL  | Có       | Lịch sử chat AI           |
| `/api/notifications`   | GET        | Có       | Thông báo                 |
| `/api/wallet`          | GET        | Có       | Số dư ví (landlord)       |
| `/api/favorites`       | GET / POST | Có       | Phòng đã lưu              |

## Cấu trúc thư mục

```
be/
├── src/
│   ├── server.ts          # Entry point
│   ├── config/
│   │   └── database.ts    # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── subscription.middleware.ts
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers + controllers
│   ├── seeds/             # Database seeder
│   └── services/          # Business logic (AI service)
├── package.json
└── tsconfig.json
```

## Default Credentials

- **Admin**: admin@roomie.com / admin123
- **Landlords**: colan@roomie.com / password123
- **Tenants**: minhanh@fpt.edu.vn / password123
