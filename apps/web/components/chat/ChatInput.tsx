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
    <div className="border-t border-zinc-200 p-4 flex gap-3 bg-white">
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
        className="flex-1 border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 bg-white outline-none focus:ring-2 focus:ring-purple-500/50 transition disabled:opacity-50 disabled:bg-zinc-50"
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
        className="bg-black text-white px-6 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition text-sm cursor-pointer shadow-sm"
      >
        Send
      </button>
    </div>
  );
}