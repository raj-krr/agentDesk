"use client";

import { useState } from "react";
import { getAuthHeaders } from "@/lib/auth";
import { API } from "@/lib/api";

interface Props {
  conversations: any[];
  selectedConversation: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  user: any;
  onRefreshUser?: () => void;
}

export default function ConversationSidebar({
  conversations,
  selectedConversation,
  onSelect,
  onCreate,
  user,
  onRefreshUser,
}: Props) {
  const [activeTab, setActiveTab] = useState<"chats" | "account">("chats");
  const [returningId, setReturningId] = useState<string | null>(null);

  const handleReturnOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to return this order?")) return;
    setReturningId(orderId);
    try {
      const response = await fetch(`${API.ORDERS}/${orderId}/return`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        alert("Order successfully returned. Your refund has been processed.");
        onRefreshUser?.();
      } else {
        alert(data.message || "Failed to return order");
      }
    } catch (error) {
      console.error("Error returning order:", error);
      alert("An error occurred while returning the order.");
    } finally {
      setReturningId(null);
    }
  };

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
                                  : order.status === "Returned"
                                    ? "bg-purple-50 text-purple-700"
                                    : order.status === "Return Initiated"
                                      ? "bg-indigo-50 text-indigo-700"
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

                      {order.status === "Delivered" && order.deliveredAt && (() => {
                        const deliveryDate = new Date(order.deliveredAt);
                        const expiryDate = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
                        const isEligible = Date.now() <= expiryDate.getTime();

                        return (
                          <div className="mt-2 pt-2 border-t border-zinc-100 space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] text-zinc-500">
                              <span>Return Window:</span>
                              <span className={isEligible ? "text-emerald-600 font-semibold" : "text-zinc-400"}>
                                {isEligible 
                                  ? `Eligible (expires ${expiryDate.toLocaleDateString()})` 
                                  : `Expired on ${expiryDate.toLocaleDateString()}`
                                }
                              </span>
                            </div>
                            {isEligible && (
                              <button
                                onClick={() => handleReturnOrder(order.id)}
                                disabled={returningId === order.id}
                                className="w-full bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg py-1.5 text-[10px] font-bold transition disabled:opacity-50 flex items-center justify-center gap-1"
                              >
                                {returningId === order.id ? (
                                  <>
                                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Processing...
                                  </>
                                ) : (
                                  "Return Item"
                                )}
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {order.status === "Return Initiated" && order.returnInitiatedAt && (() => {
                        const initiatedDate = new Date(order.returnInitiatedAt);
                        const pickupDate = new Date(initiatedDate.getTime() + 2 * 24 * 60 * 60 * 1000);

                        return (
                          <div className="mt-2 pt-2 border-t border-zinc-100 space-y-1.5 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50">
                            <div className="font-bold text-indigo-800 text-[10px] uppercase tracking-wider flex items-center gap-1">
                              🔄 Return Initiated
                            </div>
                            <div className="text-[10px] text-zinc-600">
                              Expected pickup: <span className="font-semibold text-zinc-800">{pickupDate.toLocaleDateString()}</span>
                            </div>
                            <div className="text-[9px] text-indigo-700 font-medium">
                              Refund will be completed after pickup.
                            </div>
                          </div>
                        );
                      })()}

                      {order.status === "Returned" && (
                        <div className="mt-2 pt-2 border-t border-zinc-100 text-[10px] text-purple-700 font-semibold bg-purple-50 p-1.5 rounded text-center">
                          Returned & Refunded Successfully
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