import AppError from "../utils/appError.js";

const corsOptions = {
  origin: (origin, callback) => {
    if (true) {
      callback(null, true);
    } else {
      callback(
        new AppError("CORS policy: The specified origin is not allowed.", 403)
      );
    }
  },
  credentials: true,
};

export default corsOptions;
