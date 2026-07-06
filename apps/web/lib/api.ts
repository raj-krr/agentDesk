const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "NEXT_PUBLIC_BACKEND_URL is missing"
  );
}

export const API = {
  USERS: `${BACKEND_URL}/users`,
  CHAT: `${BACKEND_URL}/chat`,
  CONVERSATIONS:
    `${BACKEND_URL}/conversations`,
  ORDERS:
    `${BACKEND_URL}/orders`,
  PAYMENTS:
    `${BACKEND_URL}/payments`,
};