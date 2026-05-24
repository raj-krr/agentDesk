import { Hono } from "hono";
import { getUsers } from "../controllers/user.controller.js";

const userRouter = new Hono();

userRouter.get("/", getUsers);

export default userRouter;