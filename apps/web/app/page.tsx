"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
};

export default function Home() {

  const [input, setInput] =
    useState("");

  const [conversationId,
    setConversationId] =
    useState("");

  const [isLoading,
    setIsLoading] =
    useState(false);

  const [conversations,
    setConversations] =
    useState<Conversation[]>([]);

  const [messages,
    setMessages] =
    useState<Message[]>([
      {
        role: "assistant",
        content:
          "Hello 👋 I'm AgentDesk. How can I help you today?",
      },
    ]);

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  // Auto Scroll
  useEffect(() => {

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);

  // Initial Load
useEffect(() => {

  const fetchConversations =
    async () => {

      try {

        const response =
          await fetch(
            "http://localhost:3000/conversations"
          );

        const data =
          await response.json();

        if (
          data.conversations &&
          data.conversations.length > 0
        ) {

          const formatted =
            data.conversations.map(
              (conversation: any) => ({
                id: conversation.id,
                title:
                  conversation.title,
              })
            );

          setConversations(
            formatted
          );

          // Load latest conversation
          const latestConversation =
            formatted[0];

          setConversationId(
            latestConversation.id
          );

          await loadConversation(
            latestConversation.id
          );

        }

      } catch (error) {

        console.error(error);

      }
    };

  fetchConversations();

}, []);

  // Load Conversation
const loadConversation =
  async (id: string) => {

    try {

      console.log(
        "Loading conversation:",
        id
      );

      const response =
        await fetch(
          `http://localhost:3000/conversations/${id}`
        );

      const data =
        await response.json();

      console.log(data);

      setConversationId(id);

      if (
        data.conversation &&
        data.conversation.messages
      ) {

        const formattedMessages =
          data.conversation.messages.map(
            (message: any) => ({
              role: message.role,
              content:
                message.content,
            })
          );

        if (
          formattedMessages.length > 0
        ) {

          setMessages(
            formattedMessages
          );

        } else {

          setMessages([
            {
              role: "assistant",
              content:
                "No messages yet.",
            },
          ]);
        }
      }

    } catch (error) {

      console.error(error);

    }
};

  // Send Message
  const sendMessage = async () => {

    if (!input.trim()) return;

    if (!conversationId) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    // Update Title
    const currentConversation =
      conversations.find(
        (c) =>
          c.id === conversationId
      );

    if (
      currentConversation?.title ===
      "New Conversation"
    ) {

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id ===
          conversationId
            ? {
                ...conversation,
                title: input,
              }
            : conversation
        )
      );

      try {

        await fetch(
          `http://localhost:3000/conversations/${conversationId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              title: input,
            }),
          }
        );

      } catch (error) {

        console.error(error);

      }
    }

    const currentInput =
      input;

    setInput("");

    setIsLoading(true);

    // Empty assistant message
    const aiMessage: Message = {
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [
      ...prev,
      aiMessage,
    ]);

    try {

      const response =
        await fetch(
          "http://localhost:3000/chat/messages",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              message:
                currentInput,

              conversationId,
            }),
          }
        );

      if (!response.body) return;

      const reader =
        response.body.getReader();

      const decoder =
        new TextDecoder();

      let done = false;

      let fullText = "";

      while (!done) {

        const result =
          await reader.read();

        done = result.done;

        const chunk =
          decoder.decode(
            result.value
          );

        fullText += chunk;

        setMessages((prev) => {

          const updated = [
            ...prev,
          ];

          updated[
            updated.length - 1
          ] = {
            role: "assistant",
            content: fullText,
          };

          return updated;
        });
      }

      setIsLoading(false);

    } catch (error) {

      console.error(error);

      setIsLoading(false);

    }
  };

  // New Chat
  const handleNewChat =
    async () => {

      try {

        const response =
          await fetch(
            "http://localhost:3000/conversations",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                userId:
                  "your-user-id-here",
              }),
            }
          );

        const data =
          await response.json();

        setConversationId(
          data.conversation.id
        );

        setConversations((prev) => [
          {
            id:
              data.conversation.id,

            title:
              data.conversation.title,
          },
          ...prev,
        ]);

        setMessages([
          {
            role: "assistant",
            content:
              "Hello 👋 I'm AgentDesk. How can I help you today?",
          },
        ]);

      } catch (error) {

        console.error(error);

      }
    };

  return (
    <main className="h-screen bg-black text-white flex">

      {/* Sidebar */}
      <div className="w-72 border-r border-zinc-900 bg-zinc-950 p-5 overflow-y-auto">

        <h1 className="text-3xl font-bold">
          AgentDesk 🚀
        </h1>

        <button
          onClick={handleNewChat}
          className="mt-6 w-full bg-white text-black rounded-2xl py-3 font-semibold hover:scale-[1.02] transition"
        >
          + New Chat
        </button>

        {/* Conversations */}
        <div className="mt-8 space-y-3">

          {conversations.map(
            (conversation) => (

              <button
                key={conversation.id}
                onClick={() =>
                  loadConversation(
                    conversation.id
                  )
                }
                className={`w-full text-left px-4 py-3 rounded-2xl transition border ${
                  conversation.id ===
                  conversationId
                    ? "bg-zinc-800 border-zinc-700"
                    : "bg-zinc-900 border-zinc-900 hover:border-zinc-700"
                }`}
              >

                <p className="text-sm font-medium truncate">
                  {conversation.title}
                </p>

              </button>
            )
          )}
        </div>

      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">

          <div className="max-w-4xl mx-auto p-6 space-y-6">

            {messages.map(
              (message, index) => (

                <div
                  key={index}
                  className={`flex ${
                    message.role ===
                    "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >

                  <div
                    className={`px-5 py-4 rounded-3xl max-w-2xl text-[15px] leading-7 shadow-lg ${
                      message.role ===
                      "user"
                        ? "bg-white text-black"
                        : "bg-zinc-900 border border-zinc-800"
                    }`}
                  >
                    {message.content}
                  </div>

                </div>
              )
            )}

            {/* Thinking Indicator */}
            {isLoading && (

              <div className="flex justify-start">

                <div className="bg-zinc-900 border border-zinc-800 px-5 py-4 rounded-3xl text-zinc-400 animate-pulse">
                  AgentDesk is thinking...
                </div>

              </div>
            )}

            {/* Auto Scroll */}
            <div ref={bottomRef} />

          </div>

        </div>

        {/* Input */}
        <div className="border-t border-zinc-900 bg-black/80 backdrop-blur-xl p-5">

          <div className="max-w-4xl mx-auto flex gap-3">

            <input
              type="text"
              placeholder="Ask AgentDesk anything..."
              value={input}
              onChange={(e) =>
                setInput(
                  e.target.value
                )
              }
              onKeyDown={(e) => {

                if (
                  e.key === "Enter"
                ) {
                  sendMessage();
                }
              }}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 outline-none focus:border-zinc-700 transition"
            />

            <button
              onClick={sendMessage}
              className="bg-white text-black px-7 rounded-2xl font-semibold hover:scale-105 transition"
            >
              Send
            </button>

          </div>

        </div>

      </div>

    </main>
  );
}