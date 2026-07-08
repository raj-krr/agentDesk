import { Hono } from "hono";
import { getOrders, createMockOrder, processOrderReturn, processOrderRefund, updateOrderStatus } from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const orderRouter = new Hono();

orderRouter.use("*", authMiddleware);

orderRouter.get("/", getOrders);
orderRouter.post("/", createMockOrder);
orderRouter.post("/:id/return", processOrderReturn);
orderRouter.post("/:id/refund", processOrderRefund);
orderRouter.patch("/:id/status", updateOrderStatus);

export default orderRouter;