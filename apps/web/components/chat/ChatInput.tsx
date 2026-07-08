"use client";

import {
  useState,
} from "react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [message, setMessage] = useState("");

  return (
    <div className="border-t p-4 flex gap-3">
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim() && !disabled) {
            onSend(message);
            setMessage("");
          }
        }}
        placeholder={disabled ? "Please wait for AI response..." : "Type a message..."}
        className="flex-1 border rounded-xl px-4 py-3 disabled:opacity-50 disabled:bg-zinc-50 transition"
        disabled={disabled}
      />

      <button
        onClick={() => {
          if (message.trim() && !disabled) {
            onSend(message);
            setMessage("");
          }
        }}
        disabled={disabled || !message.trim()}
        className="bg-black text-white px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
      >
        Send
      </button>
    </div>
  );
}