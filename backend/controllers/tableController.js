import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Table } from "../models/tableSchema.js";
import { stripe } from "../server.js";

export const saveTable = catchAsyncErrors(async (req, res, next) => {
    try {
      // ✅ Extract fields from FormData
      const { number, capacity } = req.body;

      // ✅ Validate required fields
      if (!number || !capacity ) {
        return next(new ErrorHandler("Please fill all required fields.", 400));
      }
  
    const existingtable = await Table.findOne({number:number});
      // ✅ Create Order in Database

      if (existingtable ) {
        return res.status(400).json({
          success: false,
          message: "Table number already Exists.",
        });
            
      }

      const table = await Table.create({
        number, 
        capacity
      });
  
      res.status(201).json({
        success: true,
        message: "Table Created successfully.",
        data: table,
      });
    } catch (error) {
      console.error("Server Error:", error); // Log error for debugging
      return next(new ErrorHandler(error.message, 500));
    }
  });
  
  export const getTables = catchAsyncErrors(async (req, res, next) => {
    // Retrieve all food items from the database
    const tables = await Table.find();
    // Check if any items exist
    if (!tables || tables.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No Tables found.",
      });
    }
  
    // Send the food items in the response
    res.status(200).json({
      success: true,
      data: tables,
    });
  });



  export const updateTable = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params; // Get the menu item ID from the request
    const {capacity, number} = req.body;
  
    // Find the item in the database
    let existingtable = await Table.findOne({
      _id: { $ne: id }, // not equal to the passed id
      number: number    // equal to the passed number
  });
      if (existingtable) {
        return res.status(404).json({
          success: false,
          message: "Table with same Number already exists.",
        });
    }

    let table = await Table.findById(id);
    table.number= number ? number :table.number;
    table.capacity = capacity ? capacity : table.capacity;

    // Save updated food item
    await table.save();
  
    res.status(200).json({
      success: true,
      message: "Table updated successfully.",
      data: table,
    });
  });


  export const deleteTable = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
  
    // Find the food item by ID
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not Found",
      });
    }
  
    // Delete item from database
    await Table.findByIdAndDelete(id);
  
    res.status(200).json({
      success: true,
      message: "Table deleted successfully.",
    });
  });

//   export const stripePayment = catchAsyncErrors(async (req, res, next) => {
//     const {CartPrice} =req.body
//     const customer = await stripe.customers.create();
//     const ephemeralKey = await stripe.ephemeralKeys.create(
//       {customer: customer.id},
//       {apiVersion: '2025-03-31.basil'}
//     );
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: CartPrice * 100,
//       currency: 'pkr',
//       customer: customer.id,
//     });
  
//     res.json({
//       paymentIntent: paymentIntent.client_secret,
//       ephemeralKey: ephemeralKey.secret,
//       customer: customer.id,
//       publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
//     });
//   });
  

//   export const getOrder = catchAsyncErrors(async (req, res, next) => {
//     const {email} =req.params
//     const orderPending = await Order.findOne({email, status:"Pending"});
//     const orderAccepted = await Order.findOne({email, status:"Accepted"});
  
//     // Send the food items in the response
//     res.status(200).json({
//       success: true,
//       data: {pending: orderPending, 
//              accepted: orderAccepted},
//     });
//   });

//   export const getCompletedOrders = catchAsyncErrors(async (req, res, next) => {
//     const {email} =req.params
//     const orderCompleted = await Order.find({email, status:"Completed"});
//     console.log(orderCompleted);  
  
//     // Send the food items in the response
//     res.status(200).json({
//       success: true,
//       data: orderCompleted
//     });
//   });