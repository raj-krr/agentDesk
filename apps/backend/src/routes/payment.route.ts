import { Hono } from "hono";
import { createMockPayment } from "../controllers/payment.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const paymentRouter = new Hono();

paymentRouter.use("*", authMiddleware);

paymentRouter.post("/", createMockPayment);

export default paymentRouter;
