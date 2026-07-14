import { Hono } from "hono";

import {
  getUsers,
  register,
  login,
    logout,
  getMe,
  loginDemoUser,
} from "../controllers/user.controller.js";

import { authMiddleware }
    from "../middleware/auth.middleware.js";

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
  "/demo",
  loginDemoUser
);

userRouter.post(
  "/logout",
  logout
);


userRouter.get(
  "/me",
  authMiddleware,
  getMe
);

export default userRouter;