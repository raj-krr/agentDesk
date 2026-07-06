import { Hono } from "hono";

import { sendMessage }
from "../controllers/chat.controller.js";

import { authMiddleware }
from "../middleware/auth.middleware.js";

const chatRouter =
  new Hono();

chatRouter.use(
  "*",
  authMiddleware
);

chatRouter.post(
  "/messages",
  sendMessage
);

export default chatRouter;