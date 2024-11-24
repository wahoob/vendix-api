import ApiFeatures from "../utils/apiFeatures.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

const getModelName = (Model) => Model.modelName.toLowerCase();

export const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.vendorId) filter = { vendor: req.params.vendorId };
    if (req.params.productId) filter = { product: req.params.productId };
    if (req.params.userId) filter = { user: req.params.userId };

    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
      .search();

    const doc = await features.query;
    const total = await new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .search()
      .query.countDocuments();

    const name = `${getModelName(Model)}`.endsWith("y")
      ? `${getModelName(Model)}`.replace(/.$/, "ies")
      : `${getModelName(Model)}s`;

    res.status(200).json({
      status: "success",
      result: doc.length,
      total,
      data: {
        [name]: doc,
      },
    });
  });

export const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`No ${getModelName(Model)} found with that ID.`, 404)
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        [`${getModelName(Model)}`]: doc,
      },
    });
  });

export const isOwnerGet = (Model, ownerField, popOptions, ...allowedRoles) =>
  catchAsync(async (req, res, next) => {
    const { id: userId, vendor: vendorId, role } = req.user;
    const { id } = req.params;

    const filter = {
      _id: id,
    };

    if (!allowedRoles.includes(role)) {
      if (ownerField === "user") {
        filter[ownerField] = userId;
      } else if (ownerField === "vendor") {
        filter[ownerField] = vendorId;
      }
    }

    let query = Model.findOne(filter);
    if (popOptions) query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(
        new AppError(
          `No ${getModelName(Model)} found with that ID or access forbidden.`,
          404
        )
      );
    }

    res.status(200).json({
      status: "success",
      data: {
        [`${getModelName(Model)}`]: doc,
      },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    await Model.create(req.body);

    res.status(201).json({
      status: "success",
      message: `${getModelName(Model)} has been created successfully!`,
    });
  });

export const isOwnerUpdate = (Model, ownerField, ...allowedRoles) =>
  catchAsync(async (req, res, next) => {
    const { id: userId, vendor: vendorId, role } = req.user;
    const { id } = req.params;

    const filter = {
      _id: id,
    };

    if (!allowedRoles.includes(role)) {
      if (ownerField === "user") {
        filter[ownerField] = userId;
      } else if (ownerField === "vendor") {
        filter[ownerField] = vendorId;
      }
    }

    const doc = await Model.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(
          `No ${getModelName(Model)} found with that ID or access forbidden.`,
          404
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: `${getModelName(Model)} has been updated successfully!`,
    });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(
        new AppError(`No ${getModelName(Model)} found with that ID.`, 404)
      );
    }

    res.status(200).json({
      status: "success",
      message: `${getModelName(Model)} has been updated successfully!`,
    });
  });

export const isOwnerDelete = (Model, ownerField, ...allowedRoles) =>
  catchAsync(async (req, res, next) => {
    const { id: userId, vendor: vendorId, role } = req.user;
    const { id } = req.params;

    const filter = {
      _id: id,
    };

    if (!allowedRoles.includes(role)) {
      if (ownerField === "user") {
        filter[ownerField] = userId;
      } else if (ownerField === "vendor") {
        filter[ownerField] = vendorId;
      }
    }

    const doc = await Model.findOneAndDelete(filter);

    if (!doc) {
      return next(
        new AppError(
          `No ${getModelName(Model)} found with that ID or access forbidden.`,
          404
        )
      );
    }

    res.status(204).json(null);
  });

export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(
        new AppError(`No ${getModelName(Model)} found with that ID.`, 404)
      );
    }

    res.status(204).json(null);
  });
