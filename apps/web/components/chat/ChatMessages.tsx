import { useEffect, useRef, useState } from "react";
import { getAuthHeaders } from "@/lib/auth";
import { API } from "@/lib/api";

interface Props {
  messages: any[];
  isThinking?: boolean;
  onRefreshUser?: () => void;
}

interface ActionButtonProps {
  action: "Return" | "Cancel";
  orderId: string;
  productName: string;
  onRefreshUser?: () => void;
}

function ActionButton({ action, orderId, productName, onRefreshUser }: ActionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleClick = async () => {
    const confirmationMsg = action === "Return"
      ? `Are you sure you want to return your ${productName}?`
      : `Are you sure you want to cancel your ${productName} order?`;

    if (!confirm(confirmationMsg)) return;

    setLoading(true);
    try {
      const endpoint = action === "Return" ? "return" : "cancel";
      const response = await fetch(`${API.ORDERS}/${orderId}/${endpoint}`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setCompleted(true);
        alert(
          action === "Return"
            ? `Successfully returned ${productName}. Refund processed.`
            : `Successfully cancelled ${productName} order.`
        );
        onRefreshUser?.();
      } else {
        alert(data.message || `Failed to ${action.toLowerCase()} order.`);
      }
    } catch (err) {
      console.error(err);
      alert(`An error occurred while trying to ${action.toLowerCase()} the order.`);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <span className="inline-block bg-zinc-100 text-zinc-500 font-semibold rounded-lg px-2.5 py-1.5 text-[10px] select-none mx-1 align-middle">
        ✓ {action === "Return" ? "Returned" : "Cancelled"}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1 font-bold rounded-lg px-2.5 py-1.5 text-[10px] transition mx-1 my-0.5 shadow-sm select-none align-middle ${
        action === "Return"
          ? "bg-purple-600 hover:bg-purple-700 text-white"
          : "bg-red-600 hover:bg-red-700 text-white"
      } disabled:opacity-50`}
    >
      {loading ? (
        <>
          <span className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin"></span>
          Processing...
        </>
      ) : (
        <>
          {action === "Return" ? "🔄" : "🛑"} {action} {productName}
        </>
      )}
    </button>
  );
}

export default function ChatMessages({ messages, isThinking, onRefreshUser }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const renderMessageContent = (content: string) => {
    const combinedRegex = /\[(Return|Cancel) Order: ([a-zA-Z0-9-]+) for ([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = combinedRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      if (matchIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {content.substring(lastIndex, matchIndex)}
          </span>
        );
      }

      const action = match[1];
      const orderId = match[2];
      const productName = match[3];

      parts.push(
        <ActionButton
          key={`btn-${orderId}-${action}`}
          action={action as "Return" | "Cancel"}
          orderId={orderId}
          productName={productName}
          onRefreshUser={onRefreshUser}
        />
      );

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{content}</span>;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`mb-4 ${message.role === "user" ? "text-right" : ""}`}
        >
          <div className="inline-block border rounded-2xl px-4 py-3 text-left max-w-[85%]">
            {renderMessageContent(message.content)}
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