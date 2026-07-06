import { API } from "./api";
import { getAuthHeaders } from "./auth";

export const createMockOrder = async (
  productName: string,
  status: string,
  trackingId?: string
) => {
  const response = await fetch(API.ORDERS, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      productName,
      status,
      trackingId,
    }),
  });

  return response.json();
};

export const createMockPayment = async (amount: number, status: string) => {
  const response = await fetch(API.PAYMENTS, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      amount,
      status,
    }),
  });

  return response.json();
};
