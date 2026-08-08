"use client";

import { useState } from "react";
import { createMockOrder, createMockPayment } from "../../lib/sandbox";
import { API } from "../../lib/api";
import { getAuthHeaders } from "../../lib/auth";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataSeeded?: () => void;
  user?: any;
}

export default function SandboxPanel({ isOpen, onClose, onDataSeeded, user }: Props) {
  const [activeTab, setActiveTab] = useState<"templates" | "order" | "admin">("templates");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Custom Order Form state
  const [orderForm, setOrderForm] = useState({
    productName: "",
    status: "Processing",
    trackingId: "",
    expectedDelivery: "",
    price: "199.99",
    deliveredAt: "",
  });

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleQuickSeed = async (type: string) => {
    setLoading(true);
    try {
      if (type === "airpods_delayed") {
        const orderRes = await createMockOrder("AirPods Max", "Delayed", "TRK-DELAYED-8899", "July 12, 2026");
        await createMockPayment(549.00, "Succeeded", orderRes.order.id);
        showSuccess("Seeded Delayed AirPods Max Order & Payment!");
      } else if (type === "iphone_cancelled") {
        const orderRes = await createMockOrder("iPhone 15 Pro Max", "Cancelled", "TRK-CANCELLED-1002", "Cancelled");
        await createMockPayment(1199.00, "Failed", orderRes.order.id);
        showSuccess("Seeded Cancelled iPhone 15 Order & Failed Payment!");
      } else if (type === "double_charge") {
        const orderRes = await createMockOrder("Leather Case", "Processing", "TRK-CASE-4500", "July 9, 2026");
        await createMockPayment(149.99, "Failed", orderRes.order.id);
        showSuccess("Seeded Leather Case Order & Failed Payment ($149.99)!");
      } else if (type === "sub_refund") {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
        const orderRes = await createMockOrder("Cloud Storage Premium", "Delivered", "TRK-CLOUD-9900", "Delivered", twoDaysAgo);
        await createMockPayment(19.99, "Pending", orderRes.order.id);
        showSuccess("Seeded Cloud Storage Order & Pending Refund ($19.99)!");
      } else if (type === "return_eligible") {
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
        const orderRes = await createMockOrder("Sony WH-1000XM5", "Delivered", "TRK-SONY-1122", "Delivered", threeDaysAgo);
        await createMockPayment(399.99, "Succeeded", orderRes.order.id);
        showSuccess("Seeded Eligible Sony WH-1000XM5 Order!");
      } else if (type === "return_expired") {
        const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
        const orderRes = await createMockOrder("Apple Watch Ultra", "Delivered", "TRK-WATCH-3344", "Delivered", tenDaysAgo);
        await createMockPayment(799.99, "Succeeded", orderRes.order.id);
        showSuccess("Seeded Expired Apple Watch Ultra Order!");
      }
      onDataSeeded?.();
    } catch (err) {
      alert("Failed to seed data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.productName) return;
    setLoading(true);
    try {
      // 1. Create Order
      const orderRes = await createMockOrder(
        orderForm.productName,
        orderForm.status,
        orderForm.trackingId || undefined,
        orderForm.expectedDelivery || undefined,
        orderForm.status === "Delivered" ? (orderForm.deliveredAt || new Date().toISOString()) : undefined
      );

      // 2. Create Succeeded Payment auto-associated with order
      const priceVal = parseFloat(orderForm.price);
      if (!isNaN(priceVal)) {
        await createMockPayment(priceVal, "Succeeded", orderRes.order.id);
      }

      showSuccess(`Created order and matching payment for ${orderForm.productName}!`);
      setOrderForm({ productName: "", status: "Processing", trackingId: "", expectedDelivery: "", price: "199.99", deliveredAt: "" });
      onDataSeeded?.();
    } catch (err) {
      alert("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API.ORDERS}/${orderId}/status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.success) {
        showSuccess(`Order status updated to ${newStatus}!`);
        onDataSeeded?.();
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      alert("Error updating order status");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateRefund = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API.ORDERS}/${orderId}/refund`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        showSuccess(`Refund simulated for order ${orderId.slice(0, 8)}!`);
        onDataSeeded?.();
      } else {
        alert(data.message || "Failed to process refund simulation");
      }
    } catch (err) {
      alert("Failed to simulate refund");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l shadow-2xl z-50 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-zinc-950 text-white">
        <div>
          <h3 className="font-bold text-lg">🛠️ Developer Sandbox</h3>
          <p className="text-xs text-zinc-400">Seed test data for AI support agents</p>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white text-xl font-bold p-1"
        >
          &times;
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-sm font-medium">
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex-1 py-3 text-center border-b-2 ${
            activeTab === "templates"
              ? "border-black text-black font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab("order")}
          className={`flex-1 py-3 text-center border-b-2 ${
            activeTab === "order"
              ? "border-black text-black font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Custom Order
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          className={`flex-1 py-3 text-center border-b-2 ${
            activeTab === "admin"
              ? "border-black text-black font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Admin Panel
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Success Alert */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-sm flex items-center gap-2">
            ✅ {successMsg}
          </div>
        )}

        {/* Loading Spinner overlay */}
        {loading && (
          <div className="flex items-center justify-center p-6 bg-zinc-50 rounded-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            <span className="ml-3 text-sm text-zinc-600 font-medium">Seeding DB...</span>
          </div>
        )}

        {/* Tab 1: Templates */}
        {activeTab === "templates" && !loading && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">Click a template to immediately seed database records for the logged-in user account.</p>

            <button
              onClick={() => handleQuickSeed("airpods_delayed")}
              className="w-full text-left border rounded-xl p-3 hover:bg-zinc-50 transition flex flex-col"
            >
              <span className="font-semibold text-sm">🎧 AirPods Max (Delayed Shipping)</span>
              <span className="text-xs text-zinc-500 mt-1">Order status is set to "Delayed" with tracking: TRK-DELAYED-8899 and active payment of $549.00.</span>
            </button>

            <button
              onClick={() => handleQuickSeed("iphone_cancelled")}
              className="w-full text-left border rounded-xl p-3 hover:bg-zinc-50 transition flex flex-col"
            >
              <span className="font-semibold text-sm">📱 iPhone 15 Pro Max (Cancelled)</span>
              <span className="text-xs text-zinc-500 mt-1">Order status is set to "Cancelled" with tracking: TRK-CANCELLED-1002 and failed payment.</span>
            </button>

            <button
              onClick={() => handleQuickSeed("double_charge")}
              className="w-full text-left border rounded-xl p-3 hover:bg-zinc-50 transition flex flex-col"
            >
              <span className="font-semibold text-sm">💳 Double Charges (Failed Payment)</span>
              <span className="text-xs text-zinc-500 mt-1">Creates a $149.99 failed payment on Leather Case order.</span>
            </button>

            <button
              onClick={() => handleQuickSeed("sub_refund")}
              className="w-full text-left border rounded-xl p-3 hover:bg-zinc-50 transition flex flex-col"
            >
              <span className="font-semibold text-sm">🔄 Subscription Refund (Pending Payment)</span>
              <span className="text-xs text-zinc-500 mt-1">Creates a $19.99 pending refund on Cloud Storage order.</span>
            </button>

            <button
              onClick={() => handleQuickSeed("return_eligible")}
              className="w-full text-left border rounded-xl p-3 hover:bg-zinc-50 transition flex flex-col"
            >
              <span className="font-semibold text-sm">📦 Sony WH-1000XM5 (Delivered - Eligible for Return)</span>
              <span className="text-xs text-zinc-500 mt-1">Order delivered 3 days ago. Return window is open (within 7 days).</span>
            </button>

            <button
              onClick={() => handleQuickSeed("return_expired")}
              className="w-full text-left border rounded-xl p-3 hover:bg-zinc-50 transition flex flex-col"
            >
              <span className="font-semibold text-sm">⌚ Apple Watch Ultra (Delivered - Expired Return Window)</span>
              <span className="text-xs text-zinc-500 mt-1">Order delivered 10 days ago. Return window is expired.</span>
            </button>
          </div>
        )}

        {/* Tab 2: Custom Order Form */}
        {activeTab === "order" && !loading && (
          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Product Name</label>
              <input
                type="text"
                value={orderForm.productName}
                onChange={(e) => setOrderForm({ ...orderForm, productName: e.target.value })}
                placeholder="e.g. Sony WH-1000XM5"
                className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Status</label>
                <select
                  value={orderForm.status}
                  onChange={(e) => setOrderForm({ ...orderForm, status: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Expected Delivery (Optional)</label>
              <input
                type="text"
                value={orderForm.expectedDelivery}
                onChange={(e) => setOrderForm({ ...orderForm, expectedDelivery: e.target.value })}
                placeholder="e.g. 2026-07-10 or 3 Days"
                className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {orderForm.status === "Delivered" && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Actual Delivery Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={orderForm.deliveredAt}
                  onChange={(e) => setOrderForm({ ...orderForm, deliveredAt: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-[10px] text-zinc-400 mt-1">Leave blank to use current local time.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Tracking ID (Optional)</label>
              <input
                type="text"
                value={orderForm.trackingId}
                onChange={(e) => setOrderForm({ ...orderForm, trackingId: e.target.value })}
                placeholder="e.g. TRK12345678"
                className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              Seed Custom Order & Payment
            </button>
          </form>
        )}

        {/* Tab 3: Custom Payment Form */}
        {activeTab === "admin" && !loading && (
          <div className="space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">📦 Order Management</h4>
            <p className="text-xs text-zinc-500">Change the status of any active orders instantly to try different support paths:</p>
            {user?.orders && user.orders.length > 0 ? (
              <div className="space-y-3">
                {user.orders.map((o: any) => (
                  <div key={o.id} className="border rounded-xl p-3 bg-zinc-50 border-zinc-200/60 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-sm text-zinc-800 block">{o.productName}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">ID: {o.id.slice(0, 8)}...</span>
                      </div>
                      <span className="text-[10px] bg-zinc-200 px-1.5 py-0.5 rounded font-bold text-zinc-700">
                        {o.status}
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-zinc-500 mb-1 uppercase tracking-wider">Change Status</label>
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                        className="w-full border rounded-lg p-2 text-xs bg-white outline-none focus:ring-2 focus:ring-black font-medium"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Delayed">Delayed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Return Initiated">Return Initiated</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-400 italic">No orders found to manage.</p>
            )}
          </div>
        )}

        {/* Simulation of Pickup & Refund */}
        {user?.orders?.some((o: any) => o.status === "Return Initiated") && (
          <div className="border-t pt-4 mt-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500">⚡ Return Simulation</h4>
            <p className="text-[10px] text-zinc-400 font-medium">Simulate courier pickup and refund processing for active returns:</p>
            <div className="space-y-2">
              {user.orders
                .filter((o: any) => o.status === "Return Initiated")
                .map((o: any) => (
                  <div key={o.id} className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex justify-between text-xs items-center">
                      <span className="font-semibold text-zinc-700">{o.productName}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">ID: {o.id.slice(0, 8)}...</span>
                    </div>
                    <button
                      onClick={() => handleSimulateRefund(o.id)}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      🚚 Complete Pickup & Refund
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
