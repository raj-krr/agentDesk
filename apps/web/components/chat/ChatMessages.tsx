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

      if (orderId === "undefined" || orderId === "null" || orderId.length < 10) {
        parts.push(
          <span key={`text-invalid-${matchIndex}`} className="text-zinc-500 italic">
            ({action} option unavailable)
          </span>
        );
      } else {
        parts.push(
          <ActionButton
            key={`btn-${orderId}-${action}-${matchIndex}`}
            action={action as "Return" | "Cancel"}
            orderId={orderId}
            productName={productName}
            onRefreshUser={onRefreshUser}
          />
        );
      }

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
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/50">
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        let displayContent = message.content;
        let agentBadge = null;

        if (!isUser) {
          const match = /^\[Routed to:\s*([^\]]+)\]\s*/.exec(displayContent);
          if (match) {
            const agentName = match[1];
            displayContent = displayContent.substring(match[0].length);

            let badgeStyle = "";
            let badgeIcon = "🤖";

            const normalizedAgent = agentName.toLowerCase();
            if (normalizedAgent.includes("order")) {
              badgeStyle = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/50";
              badgeIcon = "📦";
            } else if (normalizedAgent.includes("billing")) {
              badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50";
              badgeIcon = "💳";
            } else if (normalizedAgent.includes("support") || normalizedAgent.includes("general")) {
              badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50";
              badgeIcon = "🛠️";
            } else {
              badgeStyle = "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200/50";
            }

            agentBadge = (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 shadow-sm ${badgeStyle}`}>
                <span className="text-xs">{badgeIcon}</span>
                <span>{agentName}</span>
              </div>
            );
          } else {
            agentBadge = (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-zinc-100 text-zinc-700 border-zinc-200 transition-all duration-200 shadow-sm">
                <span className="text-xs">🤖</span>
                <span>Support Assistant</span>
              </div>
            );
          }
        }

        return (
          <div
            key={index}
            className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1.5`}
          >
            {!isUser && agentBadge}
            <div
              className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm transition-all duration-300 border ${
                isUser
                  ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 hover:shadow-md"
                  : "bg-white border-zinc-200 text-zinc-800 hover:shadow-md"
              }`}
            >
              {renderMessageContent(displayContent)}
            </div>
          </div>
        );
      })}

      {isThinking && (
        <div className="flex flex-col items-start space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border bg-purple-50 text-purple-700 border-purple-200 animate-pulse">
            <span className="text-xs">🧠</span>
            <span>Routing query...</span>
          </div>
          <div className="inline-block border border-zinc-200 rounded-2xl px-5 py-4 bg-white shadow-sm">
            <div className="dot-wave">
              <span className="dot-wave-dot bg-purple-500"></span>
              <span className="dot-wave-dot bg-purple-500"></span>
              <span className="dot-wave-dot bg-purple-500"></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}