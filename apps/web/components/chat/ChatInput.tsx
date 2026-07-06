"use client";

import {
  useState,
} from "react";

interface Props {
  onSend:
    (message: string)
      => void;
}

export default function
ChatInput({
  onSend,
}: Props) {

  const [message,
    setMessage] =
    useState("");

  return (
    <div className="border-t p-4 flex gap-3">

      <input
        value={message}
        onChange={(e) =>
          setMessage(
            e.target.value
          )
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim()) {
            onSend(message);
            setMessage("");
          }
        }}
        placeholder="Type a message..."
        className="flex-1 border rounded-xl px-4 py-3"
      />

      <button
        onClick={() => {

          onSend(
            message
          );

          setMessage(
            ""
          );
        }}
        className="bg-black text-white px-6 rounded-xl"
      >
        Send
      </button>

    </div>
  );
}