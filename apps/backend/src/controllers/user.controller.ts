import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { prisma } from "../db/prisma.js";

export const getAllUsers = async (c: any) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return c.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Failed to fetch users",
      },
      500
    );
  }
};

export const register = async (c: any) => {
  try {
    const body = await c.req.json();

    const { name, email, password } = body;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return c.json(
        {
          success: false,
          message: "User already exists",
        },
        409
      );
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return c.json(
      {
        success: true,
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      201
    );
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Registration failed",
      },
      500
    );
  }
};

export const login = async (c: any) => {
  try {
    const body = await c.req.json();

    const { email, password } = body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return c.json(
        {
          success: false,
          message: "User not found",
        },
        404
      );
    }

    const validPassword = await bcrypt.compare(
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
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Login failed",
      },
      500
    );
  }
};

export const logout = async (c: any) => {
  return c.json({
    success: true,
    message: "Logged out successfully",
  });
};