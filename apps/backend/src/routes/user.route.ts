import { Hono } from "hono";

import {
  register,
  login,
  logout,
  getAllUsers,
} from "../controllers/user.controller.js";

const userRouter = new Hono();

userRouter.get("/", getAllUsers);

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