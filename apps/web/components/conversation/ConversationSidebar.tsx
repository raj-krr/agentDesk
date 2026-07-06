"use client";

import { useState } from "react";

interface Props {
  conversations: any[];
  selectedConversation: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  user: any;
}

export default function ConversationSidebar({
  conversations,
  selectedConversation,
  onSelect,
  onCreate,
  user,
}: Props) {
  const [activeTab, setActiveTab] = useState<"chats" | "account">("chats");

  return (
    <aside className="w-80 border-r flex flex-col h-full bg-zinc-50">
      {/* Sidebar Tabs */}
      <div className="flex border-b text-sm font-semibold bg-white">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-3 text-center border-b-2 ${activeTab === "chats"
              ? "border-black text-black"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          💬 Chats
        </button>
        <button
          onClick={() => setActiveTab("account")}
          className={`flex-1 py-3 text-center border-b-2 ${activeTab === "account"
              ? "border-black text-black"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
        >
          👤 My Account
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" ? (
          <div>
            <div className="p-4">
              <button
                onClick={onCreate}
                className="w-full bg-black hover:bg-zinc-800 text-white rounded-xl py-3 font-semibold text-sm transition"
              >
                + New Conversation
              </button>
            </div>

            <div className="divide-y divide-zinc-100">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id)}
                  className={`w-full p-4 text-left text-sm font-medium transition ${selectedConversation === conversation.id
                      ? "bg-white border-l-4 border-black pl-3"
                      : "hover:bg-zinc-100 pl-4"
                    }`}
                >
                  <div className="truncate text-zinc-800">{conversation.title}</div>
                  <div className="text-xs text-zinc-400 mt-1">
                    {new Date(conversation.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* User Profile Info */}
            <div className="bg-white border rounded-xl p-4 shadow-sm">
              <h4 className="font-bold text-sm text-zinc-800">{user?.name}</h4>
              <p className="text-xs text-zinc-500 mt-0.5">{user?.email}</p>
              {user?.createdAt && (
                <div className="text-[10px] text-zinc-400 mt-3 bg-zinc-50 rounded px-2 py-1 inline-block">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Orders Section */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 px-1">📦 My Orders</h4>
              {user?.orders && user.orders.length > 0 ? (
                <div className="space-y-2">
                  {user.orders.map((order: any) => (
                    <div key={order.id} className="bg-white border rounded-xl p-3 shadow-sm text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-zinc-800">{order.productName}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${order.status === "Delivered"
                              ? "bg-emerald-50 text-emerald-700"
                              : order.status === "Delayed"
                                ? "bg-amber-50 text-amber-700"
                                : order.status === "Cancelled"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-blue-50 text-blue-700"
                            }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {order.expectedDelivery && (
                        <div className="text-[10px] text-zinc-500">
                          Expected Delivery: <span className="font-semibold text-zinc-800">{order.expectedDelivery}</span>
                        </div>
                      )}

                      {order.trackingId && (
                        <div className="text-[10px] text-zinc-500 bg-zinc-50 p-1.5 rounded border border-dashed flex justify-between">
                          <span>Tracking:</span>
                          <span className="font-mono font-bold text-zinc-700">{order.trackingId}</span>
                        </div>
                      )}

                      {order.payments && order.payments.length > 0 ? (
                        <div className="border-t pt-2 space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block">Linked Payments</span>
                          {order.payments.map((p: any) => (
                            <div key={p.id} className="flex justify-between items-center text-[10px] text-zinc-500">
                              <span>Payment ID: <span className="font-mono">{p.id ? p.id.slice(0, 8) : "N/A"}...</span></span>
                              <span className="font-bold">${p.amount !== undefined && p.amount !== null ? p.amount.toFixed(2) : "0.00"}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[9px] text-red-500 italic pt-1">No payment associated</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic px-1">No orders yet.</p>
              )}
            </div>

            {/* Payments Section */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 px-1">💳 My Payments</h4>
              {user?.payments && user.payments.length > 0 ? (
                <div className="space-y-2">
                  {user.payments.map((payment: any) => (
                    <div key={payment.id} className="bg-white border rounded-xl p-3 shadow-sm text-xs space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-800">${payment.amount !== undefined && payment.amount !== null ? payment.amount.toFixed(2) : "0.00"}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${payment.status === "Succeeded"
                              ? "bg-emerald-50 text-emerald-700"
                              : payment.status === "Failed"
                                ? "bg-red-50 text-red-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                        >
                          {payment.status}
                        </span>
                      </div>

                      {payment.order ? (
                        <div className="text-[10px] text-zinc-500 bg-zinc-50 p-1.5 rounded border flex justify-between">
                          <span>For Order:</span>
                          <span className="font-semibold text-zinc-700 truncate max-w-[120px]">{payment.order.productName}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-zinc-400 italic">No associated order</div>
                      )}

                      {payment.invoices && payment.invoices.length > 0 && (
                        <div className="border-t pt-1.5">
                          {payment.invoices.map((inv: any) => (
                            <div key={inv.id} className="flex justify-between text-[10px] text-zinc-500">
                              <span>Invoice ID:</span>
                              <span className="font-mono truncate max-w-[120px]">{inv.id}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic px-1">No payments yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}