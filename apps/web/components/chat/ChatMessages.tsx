"use client";

import { useEffect, useRef } from "react";

interface Props {
  messages: any[];
  isThinking?: boolean;
}

export default function ChatMessages({ messages, isThinking }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-4 ${message.role === "user" ? "text-right" : ""}`}
        >
          <div className="inline-block border rounded-2xl px-4 py-3 whitespace-pre-wrap text-left">
            {message.content}
          </div>
        </div>
      ))}

      {isThinking && (
        <div className="mb-4">
          <div className="inline-block border rounded-2xl px-4 py-3.5 bg-zinc-50/50">
            <div className="dot-wave">
              <span className="dot-wave-dot"></span>
              <span className="dot-wave-dot"></span>
              <span className="dot-wave-dot"></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}