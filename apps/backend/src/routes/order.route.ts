import { Hono } from "hono";
import { getOrders, createMockOrder } from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const orderRouter = new Hono();

orderRouter.use("*", authMiddleware);

orderRouter.get("/", getOrders);
orderRouter.post("/", createMockOrder);

export default orderRouter;