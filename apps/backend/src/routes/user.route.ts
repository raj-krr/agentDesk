import { Hono } from "hono";

import {
  getUsers,
  register,
  login,
  logout,
} from "../controllers/user.controller.js";

const userRouter = new Hono();

userRouter.get("/", getUsers);

userRouter.post(
  "/register",
  register
);

userRouter.post(
  "/login",
  login
);

userRouter.post(
  "/logout",
  logout
);

export default userRouter;