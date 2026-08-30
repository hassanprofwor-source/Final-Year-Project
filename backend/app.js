import { config } from "dotenv";
import os from "os";
import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import { clerkMiddleware } from "@clerk/express";
import { connection } from "./database/connection.js";
import { errorMiddleware } from "./middlewares/error.js";
import menuRouter from "./router/menuRouter.js";
import userRouter from "./router/userRouter.js";
import feedbackrouter from './router/feedbackrouter.js'
import orderRouter from './router/orderRouter.js'
import tableRouter from './router/tableRouter.js'
import bookingRouter from './router/bookingRouter.js'
import itemTypeRouter from './router/itemTypeRouter.js'
import weatherRouter from './router/weatherRouter.js'
import analyticsRouter from './router/analyticsRouter.js'
import timeSlotRouter from './router/timeSlotRouter.js'

const app = express();
config();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: os.tmpdir(),
  })
);
app.use(clerkMiddleware());
app.use("/api/v1/feedback", feedbackrouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/table", tableRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/itemType", itemTypeRouter);
app.use("/api/v1/weather", weatherRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/timeslot", timeSlotRouter);

connection();
app.use(errorMiddleware);

export default app;
