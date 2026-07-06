"use client";

interface Props {
  messages: any[];
}

export default function
  ChatMessages({
    messages,
  }: Props) {

  return (
    <div className="flex-1 overflow-y-auto p-6">

      {messages.map(
        (
          message,
          index
        ) => (

          <div
            key={index}
            className={`mb-4 ${message.role ===
                "user"
                ? "text-right"
                : ""
              }`}
          >

            <div
              className="inline-block border rounded-2xl px-4 py-3"
            >
              {message.content}
            </div>

          </div>
        )
      )}

    </div>
  );
}