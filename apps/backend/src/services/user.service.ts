import { prisma } from "../db/prisma.js";

export const getAllUsers = async () => {
  return prisma.user.findMany();
};