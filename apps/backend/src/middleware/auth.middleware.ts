import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";

export const authMiddleware = async (
  c: Context,
  next: Next
) => {
  try {
    const authHeader =
      c.req.header("Authorization");

    if (!authHeader) {
      return c.json(
        {
          success: false,
          message: "Unauthorized",
        },
        401
      );
    }

    const token =
      authHeader.replace(
        "Bearer ",
        ""
      );

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      userId: string;
      email: string;
    };

    c.set("user", decoded);

    await next();

  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Invalid token",
      },
      401
    );
  }
};