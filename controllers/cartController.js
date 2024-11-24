import Cart from "../models/cartModel.js";
import Order from "../models/orderModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import Product from "../models/productModel.js";

export const addItem = catchAsync(async (req, res, next) => {
  const { product, quantity } = req.body;

  // Check if product exists
  const productExists = await Product.findById(product);
  if (!productExists) {
    return next(new AppError("Product not found.", 404));
  }

  const cart = await Cart.findOne({
    user: req.user.id,
  });
  const existingProductInCart = cart.products.find(
    (item) => item.product.toString() === product
  );

  // Check the quantity
  const existingQuantity = existingProductInCart?.quantity || 0;
  const totalQuantity = existingQuantity + quantity;

  if (totalQuantity > productExists.stockQuantity) {
    return next(new AppError("Insufficient stock for this product.", 400));
  }

  if (existingProductInCart) {
    await Cart.findOneAndUpdate(
      { user: req.user.id, "products.product": product },
      { $inc: { "products.$.quantity": quantity } } // increase the quantity if exists
    );
  } else {
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $push: { products: { product, quantity } } } // add the product if not exists
    );
  }

  res.status(200).json({
    status: "success",
    message: "Product added to cart successfully!",
  });
});

export const removeItem = catchAsync(async (req, res, next) => {
  const { product } = req.body;

  await Cart.findOneAndUpdate(
    { user: req.user.id },
    {
      $pull: { products: { product } },
    }
  );

  res.status(200).json({
    status: "success",
    message: "Product removed from cart successfully!",
  });
});

export const updateItemQuantity = catchAsync(async (req, res, next) => {
  const { product, quantity } = req.body;

  const cart = await Cart.findOne({
    user: req.user.id,
    "products.product": product,
  });

  if (cart) {
    await Cart.findOneAndUpdate(
      { user: req.user.id, "products.product": product },
      quantity > 0
        ? { $set: { "products.$.quantity": quantity } }
        : { $pull: { products: { product } } }
    );
  } else {
    return next(new AppError("Product not found in the cart.", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Product quantity updated successfully!",
  });
});

export const clearCart = catchAsync(async (req, res, next) => {
  await Cart.findOneAndUpdate(
    { user: req.user.id },
    {
      products: [],
    }
  );

  res.status(200).json({
    status: "success",
    message: "Cart cleared successfully!",
  });
});

export const checkout = catchAsync(async (req, res, next) => {
  const { paymentStatus, shippingAddress } = req.body;

  const cart = await Cart.findOne({ user: req.user.id }).populate(
    "products.product"
  );

  if (cart.products.length === 0) {
    return next(new AppError("Cart is empty.", 400));
  }

  // Check stock for all products at once
  const insufficientStock = cart.products.filter(
    (item) => item.product.stockQuantity < item.quantity
  );
  if (insufficientStock.length > 0) {
    const outOfStockProducts = insufficientStock
      .map((item) => item.product.name)
      .join(", ");
    return next(
      new AppError(
        `The following products have insufficient stock: ${outOfStockProducts}. Please adjust your cart.`,
        400
      )
    );
  }

  const orderProducts = cart.products.map((item) => {
    let price = item.product.price;

    if (item.product.discount) {
      if (new Date(item.product.discount.expiryDate) >= new Date()) {
        price -= item.product.discount.amount;
      }
    }
    return {
      product: item.product.id,
      quantity: item.quantity,
      price,
    };
  });

  // Place the Order
  await Order.create({
    paymentStatus,
    shippingAddress,
    user: req.user.id,
    products: orderProducts,
    total: cart.total,
  });

  // Reduce the Quantity
  await Promise.all(
    cart.products.map(async (item) => {
      item.product.stockQuantity -= item.quantity;
      item.product.salesCount += item.quantity;
      await item.product.save();
    })
  );

  // Empty the Cart
  await Cart.findOneAndUpdate({ user: req.user.id }, { products: [] });

  res.status(200).json({
    status: "success",
    message: "Order has been placed and is currently being processed.",
  });
});

export const getCart = catchAsync(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user.id });

  await Cart.calcTotals(cart._id);

  const updatedCart = await Cart.findOne({ user: req.user.id }).populate({
    path: "products.product",
  });

  res.status(200).json({
    status: "success",
    data: {
      cart: updatedCart,
    },
  });
});
