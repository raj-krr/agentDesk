import { Hono } from "hono";

import {
  createNewConversation,
} from "../controllers/conversation.controller.js";

const conversationRouter = new Hono();

conversationRouter.post(
  "/",
  createNewConversation
);

export default conversationRouter;