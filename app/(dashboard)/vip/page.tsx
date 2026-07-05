"use client";

import { useEffect, useState } from "react";
import { VIP_PLANS } from "@/lib/vipPlans";

// ✏️ SAME BANK INFO AS WALLET PAGE
const BANK_INFO = {
  bankName: "Commercial Bank of Ethiopia (CBE)",
  accountName: "NovaEarn Ethiopia",
  accountNumber: "1000XXXXXXXXX",
  phone: "+251 9XX XXX XXXX",
};

interface VipContract {
  id: string;
  vipLevel: number;
  status: string;
}

export default function VipPage() {
  const [contracts, setContracts] = useState<VipContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<
    (typeof VIP_PLANS)[0] | null
  >(null);
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadContracts();
  }, []);

  function loadContracts() {
    fetch("/api/vip/my-contracts")
      .then((res) => res.json())
      .then((data) => setContracts(data.contracts || []))
      .finally(() => setLoading(false));
  }

  function getContractStatus(level: number) {
    return contracts.find((c) => c.vipLevel === level)?.status;
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlan) return;

    if (!reference.trim()) {
      setMessage({
        type: "error",
        text: "Please paste your transaction reference",
      });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/vip/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vipLevel: selectedPlan.level, reference }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({
        type: "success",
        text: "Request submitted! Admin will verify and activate your VIP plan.",
      });
      setReference("");
      setTimeout(() => {
        setSelectedPlan(null);
        setMessage(null);
        loadContracts();
      }, 2000);
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-yellow-400">VIP Plans</h1>

      {/* VIP Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {VIP_PLANS.map((plan) => {
          const status = getContractStatus(plan.level);
          const roi = (
            ((plan.totalLimit - plan.price) / plan.price) *
            100
          ).toFixed(0);

          return (
            <div
              key={plan.level}
              className={`bg-gray-900 border rounded-2xl p-5 space-y-4 ${
                status === "active"
                  ? "border-green-500"
                  : status === "pending"
                    ? "border-yellow-400"
                    : "border-gray-800"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold">{plan.label}</h3>
                  <p className="text-gray-400 text-sm">+{roi}% total ROI</p>
                </div>
                {status === "active" && (
                  <span className="bg-green-500 text-gray-950 text-xs font-bold px-3 py-1 rounded-full">
                    ACTIVE
                  </span>
                )}
                {status === "pending" && (
                  <span className="bg-yellow-400 text-gray-950 text-xs font-bold px-3 py-1 rounded-full">
                    PENDING
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Price</span>
                  <span className="font-semibold">
                    ETB {plan.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Daily Income</span>
                  <span className="text-green-400 font-semibold">
                    +ETB {plan.dailyIncome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Earnings</span>
                  <span className="font-semibold">
                    ETB {plan.totalLimit.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Duration</span>
                  <span className="font-semibold">
                    {Math.ceil(plan.totalLimit / plan.dailyIncome)} days
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlan(plan)}
                disabled={status === "active" || status === "pending"}
                className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                  status === "active"
                    ? "bg-green-500/20 text-green-400 cursor-not-allowed"
                    : status === "pending"
                      ? "bg-yellow-400/20 text-yellow-400 cursor-not-allowed"
                      : "bg-yellow-400 hover:bg-yellow-300 text-gray-950"
                }`}
              >
                {status === "active"
                  ? "✓ Active"
                  : status === "pending"
                    ? "⏳ Pending Approval"
                    : "Activate Plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Purchase Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-yellow-400">
                  {selectedPlan.label}
                </h2>
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setMessage(null);
                    setReference("");
                  }}
                  className="text-gray-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>

              {/* Plan Summary */}
              <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-xl p-4 flex justify-between items-center">
                <span className="text-gray-400 text-sm">Price to pay</span>
                <span className="text-yellow-400 font-bold text-xl">
                  ETB {selectedPlan.price.toLocaleString()}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Bank Info */}
                <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                  <p className="text-white font-semibold text-sm">
                    📋 Send payment to this account:
                  </p>
                  <div className="space-y-2">
                    {[
                      { label: "Bank", value: BANK_INFO.bankName },
                      { label: "Account Name", value: BANK_INFO.accountName },
                      {
                        label: "Account Number",
                        value: BANK_INFO.accountNumber,
                      },
                      { label: "Phone (TeleBirr)", value: BANK_INFO.phone },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex justify-between items-center bg-gray-900 rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="text-gray-500 text-xs">{item.label}</p>
                          <p className="text-white text-sm font-mono">
                            {item.value}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(item.value, item.label)}
                          className="text-xs text-yellow-400 hover:text-yellow-300 ml-2 shrink-0"
                        >
                          {copied === item.label ? "✓ Copied" : "Copy"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">
                    Transaction ID / Reference
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400 text-sm"
                    placeholder="Paste your transaction ID or SMS confirmation text..."
                  />
                </div>

                {message && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      message.type === "success"
                        ? "bg-green-900/30 border border-green-700 text-green-400"
                        : "bg-red-900/30 border border-red-700 text-red-400"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-bold rounded-xl py-3 transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400 space-y-2">
        <p className="text-white font-semibold">How it works:</p>
        <p>• Choose a VIP plan and send payment via bank/TeleBirr</p>
        <p>• Submit your transaction reference</p>
        <p>• Admin verifies and activates your plan</p>
        <p>• Once active, claim your daily income manually each day</p>
      </div>
    </div>
  );
}
