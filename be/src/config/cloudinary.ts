import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "roomie-connect/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 500, height: 500, crop: "limit", quality: "auto" }],
  } as any,
});

const roomImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "roomie-connect/rooms",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 1920, height: 1080, crop: "limit", quality: "auto" }],
  } as any,
});

export { cloudinary, avatarStorage, roomImageStorage };
