import { v2 as cloudinary } from "cloudinary";
import AppError from "../utils/appError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

class Cloudinary {
  static async uploadImage(file, folder) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `vendix/${folder}`,
      });
      return {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };
    } catch (error) {
      throw new AppError(`Failed to upload image: ${error.message}`, 500);
    }
  }

  static async deleteImage(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new AppError(`Failed to delete image: ${error.message}`, 500);
    }
  }
}

export default Cloudinary;
