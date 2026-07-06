"use client";

import { useState } from "react";
import { createMockOrder, createMockPayment } from "../../lib/sandbox";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDataSeeded?: () => void;
  user?: any;
}

export default function SandboxPanel({ isOpen, onClose, onDataSeeded, user }: Props) {
  const [activeTab, setActiveTab] = useState<"templates" | "order" | "payment">("templates");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Custom Order Form state
  const [orderForm, setOrderForm] = useState({
    productName: "",
    status: "Processing",
    trackingId: "",
    expectedDelivery: "",
    price: "199.99",
  });

  // Custom Payment Form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    status: "Succeeded",
    orderId: "",
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
        const orderRes = await createMockOrder("Cloud Storage Premium", "Delivered", "TRK-CLOUD-9900", "Delivered");
        await createMockPayment(19.99, "Pending", orderRes.order.id);
        showSuccess("Seeded Cloud Storage Order & Pending Refund ($19.99)!");
      }
      onDataSeeded?.();
    } catch (err) {
      console.error(err);
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
        orderForm.expectedDelivery || undefined
      );

      // 2. Create Succeeded Payment auto-associated with order
      const priceVal = parseFloat(orderForm.price);
      if (!isNaN(priceVal)) {
        await createMockPayment(priceVal, "Succeeded", orderRes.order.id);
      }

      showSuccess(`Created order and matching payment for ${orderForm.productName}!`);
      setOrderForm({ productName: "", status: "Processing", trackingId: "", expectedDelivery: "", price: "199.99" });
      onDataSeeded?.();
    } catch (err) {
      console.error(err);
      alert("Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.orderId) {
      alert("Amount and Associated Order are required");
      return;
    }
    setLoading(true);
    try {
      await createMockPayment(parseFloat(paymentForm.amount), paymentForm.status, paymentForm.orderId);
      showSuccess(`Created $${paymentForm.amount} payment linked to order!`);
      setPaymentForm({ amount: "", status: "Succeeded", orderId: "" });
      onDataSeeded?.();
    } catch (err) {
      console.error(err);
      alert("Failed to create payment");
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
          onClick={() => setActiveTab("payment")}
          className={`flex-1 py-3 text-center border-b-2 ${
            activeTab === "payment"
              ? "border-black text-black font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          Custom Payment
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
        {activeTab === "payment" && !loading && (
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-655 mb-1">Associate with Order</label>
              <select
                value={paymentForm.orderId}
                onChange={(e) => setPaymentForm({ ...paymentForm, orderId: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
                required
              >
                <option value="">-- Select an Order --</option>
                {user?.orders?.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.productName} ({o.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-655 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="e.g. 99.99"
                className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-600 mb-1">Status</label>
              <select
                value={paymentForm.status}
                onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                className="w-full border rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-black"
              >
                <option value="Succeeded">Succeeded</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              Seed Custom Payment
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
