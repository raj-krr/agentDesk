import { getLatestOrder } from "../services/order.service.js";

export const getOrderTool = async () => {
  return await getLatestOrder();
};