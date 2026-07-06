import { API } from "./api";
import { getAuthHeaders } from "./auth";

export const createConversation =
  async () => {

    const response =
      await fetch(
        API.CONVERSATIONS,
        {
          method: "POST",
          headers:
            getAuthHeaders(),
        }
      );

    return response.json();
  };

export const getConversations =
  async () => {

    const response =
      await fetch(
        API.CONVERSATIONS,
        {
          headers:
            getAuthHeaders(),
        }
      );

    return response.json();
  };

export const getConversation =
  async (
    conversationId: string
  ) => {

    const response =
      await fetch(
        `${API.CONVERSATIONS}/${conversationId}`,
        {
          headers:
            getAuthHeaders(),
        }
      );

    return response.json();
  };

export const updateConversationTitle =
  async (
    conversationId: string,
    title: string
  ) => {

    const response =
      await fetch(
        `${API.CONVERSATIONS}/${conversationId}`,
        {
          method: "PATCH",

          headers:
            getAuthHeaders(),

          body: JSON.stringify({
            title,
          }),
        }
      );

    return response.json();
  };