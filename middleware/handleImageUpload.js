import catchAsync from "../utils/catchAsync.js";
import Cloudinary from "../services/cloudinaryService.js";

const handleImageUpload = (folder) =>
  catchAsync(async (req, res, next) => {
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        Cloudinary.uploadImage(file, folder)
      );
      const uploadedImages = await Promise.all(uploadPromises);
      req.body.images = uploadedImages.map((img) => img.secure_url);
    } else if (req.file) {
      const imageData = await Cloudinary.uploadImage(req.file, folder);
      req.body.image = imageData.secure_url;
    }
    next();
  });

export default handleImageUpload;
