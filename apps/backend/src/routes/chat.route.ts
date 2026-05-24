import { Hono } from "hono";
import { sendMessage } from "../controllers/chat.controller.js";

const chatRouter = new Hono();

chatRouter.post("/messages", sendMessage);

export default chatRouter;