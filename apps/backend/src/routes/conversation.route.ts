import { Hono } from "hono";

import {
  createNewConversation,
} from "../controllers/conversation.controller.js";

import { getConversationById } from "../controllers/conversation.controller.js";
import { getAllConversations } from "../controllers/conversation.controller.js";
import { updateConversationTitle } from "../controllers/conversation.controller.js";

const conversationRouter = new Hono();

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