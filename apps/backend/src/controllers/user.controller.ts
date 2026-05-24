import type { Context } from "hono";
import { getAllUsers } from "../services/user.service.js";

export const getUsers = async (c: Context) => {
  try {
    const users = await getAllUsers();

    return c.json({
      success: true,
      users,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Failed to fetch users",
      },
      500
    );
  }
};