import type { Context } from "hono";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import {
  getAllUsers,
  getUserByEmail,
  createUser,
} from "../services/user.service.js";

export const getUsers = async (c: Context) => {
  const users = await getAllUsers();

  return c.json({
    success: true,
    users,
  });
};

export const register = async (c: Context) => {
  try {
    const body = await c.req.json();

    const { name, email, password } = body;

    const existingUser =
      await getUserByEmail(email);

    if (existingUser) {
      return c.json(
        {
          success: false,
          message: "User already exists",
        },
        409
      );
    }

    const user = await createUser(
      name,
      email,
      password
    );

    return c.json(
      {
        success: true,
        user,
      },
      201
    );
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Registration failed",
      },
      500
    );
  }
};

export const login = async (c: Context) => {
  try {
    const body = await c.req.json();

    const { email, password } = body;

    const user =
      await getUserByEmail(email);

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        404
      );
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      return c.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        401
      );
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "7d",
      }
    );

    return c.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: "Login failed",
      },
      500
    );
  }
};

export const logout = async (c: Context) => {
  return c.json({
    success: true,
    message: "Logged out successfully",
  });
};