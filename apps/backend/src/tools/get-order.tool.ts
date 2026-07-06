import { getLatestOrder } from "../services/order.service.js";

export const getOrderTool = async (userId: string) => {
  return await getLatestOrder(userId);
};