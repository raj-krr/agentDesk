import { Hono } from "hono";

import {
  createNewConversation,
  getConversationById,
  getAllConversations,
  updateConversationTitle,
} from "../controllers/conversation.controller.js";

import { authMiddleware }
from "../middleware/auth.middleware.js";

const conversationRouter = new Hono();

conversationRouter.use("*", authMiddleware);

conversationRouter.post(
  "/",
  createNewConversation
);

conversationRouter.get(
  "/:id",
  getConversationById
);

conversationRouter.get(
  "/",
  getAllConversations
);

conversationRouter.patch(
  "/:id",
  updateConversationTitle
);

export default conversationRouter;