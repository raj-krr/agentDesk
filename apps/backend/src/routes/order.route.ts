import { Hono } from "hono";
import { getOrders } from "../controllers/order.controller.js";

const orderRouter = new Hono();

orderRouter.get("/", getOrders);

export default orderRouter;