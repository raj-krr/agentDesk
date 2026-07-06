import { API } from "./api";
import { getAuthHeaders } from "./auth";

export const sendMessage =
  async (
    message: string,
    conversationId: string
  ) => {

    const response =
      await fetch(
        `${API.CHAT}/messages`,
        {
          method: "POST",

          headers:
            getAuthHeaders(),

          body: JSON.stringify({
            message,
            conversationId,
          }),
        }
      );

    return response;
  };