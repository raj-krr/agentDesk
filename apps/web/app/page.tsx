"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello 👋 I'm AgentDesk. How can I help you today?",
    },
  ]);

  const sendMessage = async () => {

    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    const currentInput = input;

    setInput("");

    try {

      const response = await fetch(
        "http://localhost:3000/chat/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            message: currentInput,
            conversationId:
              "836903ea-d603-4d95-8c10-8d1f444bd18a",
          }),
        }
      );

      const text = await response.text();

      const aiMessage: Message = {
        role: "assistant",
        content: text,
      };

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);

    } catch (error) {

      console.error(error);

    }
  };

  return (
    <main className="h-screen bg-black text-white flex">

      {/* Sidebar */}
      <div className="w-72 border-r border-zinc-800 p-4">

        <h1 className="text-2xl font-bold">
          AgentDesk 🚀
        </h1>

        <button className="mt-6 w-full bg-white text-black rounded-lg py-2 font-medium">
          + New Chat
        </button>

      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {messages.map((message, index) => (

            <div
              key={index}
              className={`flex ${
                message.role === "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`px-4 py-3 rounded-2xl max-w-md ${
                  message.role === "user"
                    ? "bg-white text-black"
                    : "bg-zinc-900"
                }`}
              >
                {message.content}
              </div>

            </div>
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-zinc-800 p-4 flex gap-3">

          <input
            type="text"
            placeholder="Ask AgentDesk anything..."
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 outline-none"
          />

          <button
            onClick={sendMessage}
            className="bg-white text-black px-6 rounded-xl font-medium"
          >
            Send
          </button>

        </div>
      </div>
    </main>
  );
}