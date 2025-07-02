import multer from "multer";
import AppError from "../utils/appError.js";

export const allowedMimeTypes = {
  image: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"],
};

const storage = multer.diskStorage({});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file type. Only PNG, JPEG, JPG and WebP are allowed",
        400
      ),
      false
    );
  }
};

export const uploadSingle = (fieldName, fileTypes = allowedMimeTypes.image) => {
  return multer({
    storage,
    fileFilter: fileFilter(fileTypes),
  }).single(fieldName);
};

export const uploadMultiple = (
  fieldName,
  maxCount = 5,
  fileTypes = allowedMimeTypes.image
) => {
  return multer({
    storage,
    fileFilter: fileFilter(fileTypes),
  }).array(fieldName, maxCount);
};
