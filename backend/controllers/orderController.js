import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Order } from "../models/orderSchema.js";
import { Booking } from "../models/bookingSchema.js";
import { stripe } from "../server.js";
import { sendPushToEmail } from "../utils/push.js";

export const saveOrder = catchAsyncErrors(async (req, res, next) => {
  const { email, phone, total, address, people,tableNumber,date, time, payment,orderType } = req.body;
  let { cartItems } = req.body;

  if(orderType==='Delivery'){
    try {
      const parsedTotal = parseFloat(total);
      if (isNaN(parsedTotal)) {
        return next(new ErrorHandler("Invalid total amount.", 400));
      }

      if (typeof cartItems === "string") {
        cartItems = JSON.parse(cartItems);
      }

      if (!email || !phone || !orderType || !parsedTotal || !cartItems || cartItems.length === 0) {
        return next(new ErrorHandler("Please fill all required fields.", 400));
      }

      const openDelivery = await Order.findOne({
        email,
        orderType: "Delivery",
        status: { $in: ["Pending", "Accepted"] },
      });
      if (openDelivery) {
        return next(new ErrorHandler("You already have an open delivery order.", 409));
      }

      const order = await Order.create({
        email,
        phone,
        orderType,
        payment,
        status: "Pending",
        total: parsedTotal,
        address: address || "",
        cartItems,
      });

      res.status(201).json({
        success: true,
        message: "Order placed successfully.",
        data: order,
      });
    } catch (error) {
      console.error("Server Error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
     else{
      try {        
        const parsedTotal = parseFloat(total);
        if (isNaN(parsedTotal)) {
          return next(new ErrorHandler("Invalid total amount.", 400));
        }
    
        if (typeof cartItems === "string") {
          cartItems = JSON.parse(cartItems);
        }
    
        if (!email || !phone || !orderType || !parsedTotal || !cartItems || cartItems.length === 0 || !time
          || !date || !people || !tableNumber
        ) {
          return next(new ErrorHandler("Please fill all required fields.", 400));
        }

        const booking= await Booking.create({
          tableNumber,
          time,
          date,
          people
        })
        console.log(booking)
        const order = await Order.create({
          email,
          phone,
          orderType,
          payment,
          status: "Pending",
          people,
          date, 
          time,
          total: parsedTotal-300, // Ensure it's stored as a number
          cartItems,
          tableNumber,
          bookingid: booking._id
        });
        console.log(booking._id)
        console.log(order)
        res.status(201).json({
          success: true,
          message: "Table Booked successfully.",
          data: order,
        });
      } catch (error) {
        console.error("Server Error:", error); 
        return next(new ErrorHandler(error.message, 500));
      }
     }
  });


  
  export const getOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find();
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found.",
      });
    }
  
    res.status(200).json({
      success: true,
      data: orders,
    });
  });



  export const getOrderDelivery = catchAsyncErrors(async (req, res, next) => {
    const email = decodeURIComponent(req.params.email || "");
    const orderPending = await Order.findOne({email, status:"Pending", orderType:'Delivery'});
    const orderAccepted = await Order.findOne({email, status:"Accepted", orderType:'Delivery'});
  
    res.status(200).json({
      success: true,
      data: {pending: orderPending, 
             accepted: orderAccepted},
    });
  });



  export const getOrderDine = catchAsyncErrors(async (req, res, next) => {
    const {email} =req.params
    const orderPending = await Order.find({email, status:"Pending", orderType:'Dine In'});
    const orderAccepted = await Order.find({email, status:"Accepted", orderType:'Dine In'});
  
    res.status(200).json({
      success: true,
      data: {pending: orderPending, 
             accepted: orderAccepted},
    });
  });



  export const getOrder = catchAsyncErrors(async (req, res, next) => {
    const {email} =req.params
    const orderPending = await Order.find({email, status:"Pending"});
    const orderAccepted = await Order.find({email, status:"Accepted"});
  
    res.status(200).json({
      success: true,
      data: {pending: orderPending, 
             accepted: orderAccepted},
    });
  });



  export const getCompletedOrders = catchAsyncErrors(async (req, res, next) => {
    const {email} =req.params
    const orderCompleted = await Order.find({email, status:"Completed"});
  
    res.status(200).json({
      success: true,
      data: orderCompleted
    });
  });



  export const updateOrder = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
  
    let order = await Order.findById(id);
    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }
  
    // Update the status if provided
    order.status = status ? status : order.status;
    await order.save();

    if (status === "Accepted") {
      await sendPushToEmail(order.email, {
        title: "Order accepted",
        body: "Skyplate is preparing your order.",
        screen: "accepted",
      });
    } else if (status === "Completed") {
      await sendPushToEmail(order.email, {
        title: "Order complete",
        body: "Your Skyplate order is ready.",
        screen: "home",
      });
      await Booking.findByIdAndDelete(order.bookingid);
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully.",
      data: order,
    });
  });
  

  export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
  
    const order = await Order.findById(id);
    if (!order) {
      return next(new ErrorHandler("Order not found.", 404));
    }
  
    await Order.findByIdAndDelete(id);
  
    res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
    });
  });

export const cancelPendingOrder = catchAsyncErrors(async (req, res, next) => {
  const { email, orderType } = req.body;
  if (!email) {
    return next(new ErrorHandler("Email is required.", 400));
  }

  const filter = { email, status: "Pending" };
  if (orderType) filter.orderType = orderType;

  const orders = await Order.find(filter);
  if (!orders.length) {
    return next(new ErrorHandler("No pending order to cancel.", 404));
  }

  for (const order of orders) {
    if (order.bookingid) {
      await Booking.findByIdAndDelete(order.bookingid);
    }
    await Order.findByIdAndDelete(order._id);
  }

  res.status(200).json({
    success: true,
    message: "Pending order cancelled.",
    count: orders.length,
  });
});



  export const stripePayment = catchAsyncErrors(async (req, res, next) => {
    const { CartPrice, email } = req.body;
  
    let customer;
  
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });
  
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
      });
    }
  
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2025-03-31.basil' }
    );
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 300 * 100,
      currency: 'pkr',
      customer: customer.id,
    });
  
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  });
  
  export const stripePaymentDelivery = catchAsyncErrors(async (req, res, next) => {
    const { CartPrice, email } = req.body;
  
    let customer;
  
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });
  
    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
      });
    }
  
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2025-03-31.basil' }
    );
  
    const paymentIntent = await stripe.paymentIntents.create({
      amount: CartPrice * 100,
      currency: 'pkr',
      customer: customer.id,
    });
  
    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  });