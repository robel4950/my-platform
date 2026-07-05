"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface Wallet {
  mainBalance: number;
  investmentBalance: number;
  referralBalance: number;
}

// ✏️ PUT YOUR REAL BANK INFO HERE
const BANK_INFO = {
  bankName: "Commercial Bank of Ethiopia (CBE)",
  accountName: "NovaEarn Ethiopia",
  accountNumber: "1000XXXXXXXXX",
  phone: "+251 9XX XXX XXXX",
};

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  const [depositAmount, setDepositAmount] = useState("");
  const [txReference, setTxReference] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/wallet/transactions").then((r) => r.json()),
    ])
      .then(([dash, txData]) => {
        setWallet(dash.wallet);
        setTransactions(txData.transactions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!depositAmount || parseFloat(depositAmount) < 10) {
      setMessage({ type: "error", text: "Minimum deposit is ETB 10" });
      return;
    }

    if (!txReference.trim()) {
      setMessage({
        type: "error",
        text: "Please paste your transaction reference",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(depositAmount),
          reference: txReference,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({
        type: "success",
        text: "Deposit submitted! Admin will verify your payment and credit your account.",
      });
      setDepositAmount("");
      setTxReference("");

      const txData = await fetch("/api/wallet/transactions").then((r) =>
        r.json(),
      );
      setTransactions(txData.transactions || []);
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(withdrawAmount) }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error });
        return;
      }

      setMessage({
        type: "success",
        text: "Withdrawal request submitted! Admin will process it soon.",
      });
      setWithdrawAmount("");

      const txData = await fetch("/api/wallet/transactions").then((r) =>
        r.json(),
      );
      setTransactions(txData.transactions || []);
    } catch {
      setMessage({ type: "error", text: "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "approved":
        return "text-green-400";
      case "rejected":
        return "text-red-400";
      default:
        return "text-yellow-400";
    }
  }

  function getTypeLabel(type: string) {
    switch (type) {
      case "deposit":
        return "💰 Deposit";
      case "withdraw":
        return "💸 Withdrawal";
      case "vip":
        return "💎 VIP Purchase";
      case "commission":
        return "🤝 Commission";
      case "daily_income":
        return "📈 Daily Income";
      default:
        return type;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  const totalBalance =
    (wallet?.mainBalance || 0) +
    (wallet?.investmentBalance || 0) +
    (wallet?.referralBalance || 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-yellow-400">Wallet</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-4 text-gray-950 col-span-2">
            <p className="text-sm opacity-75">Total Balance</p>
            <p className="text-3xl font-bold">ETB {totalBalance.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Main</p>
            <p className="text-white font-bold mt-1">
              ETB {wallet?.mainBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Investment</p>
            <p className="text-white font-bold mt-1">
              ETB {wallet?.investmentBalance.toFixed(2)}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 col-span-2">
            <p className="text-gray-400 text-xs">Referral Commission</p>
            <p className="text-white font-bold mt-1">
              ETB {wallet?.referralBalance.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex bg-gray-800 rounded-xl p-1 mb-6">
            <button
              onClick={() => {
                setTab("deposit");
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                tab === "deposit"
                  ? "bg-yellow-400 text-gray-950"
                  : "text-gray-400"
              }`}
            >
              💰 Deposit
            </button>
            <button
              onClick={() => {
                setTab("withdraw");
                setMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                tab === "withdraw"
                  ? "bg-yellow-400 text-gray-950"
                  : "text-gray-400"
              }`}
            >
              💸 Withdraw
            </button>
          </div>

          {/* DEPOSIT */}
          {tab === "deposit" && (
            <form onSubmit={handleDeposit} className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Amount (ETB) — Min: 10
                </label>
                <input
                  type="number"
                  required
                  min={10}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400"
                  placeholder="Enter amount e.g. 500"
                />
              </div>

              {/* Bank Info */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                <p className="text-white font-semibold text-sm">
                  📋 Send payment to this account:
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Bank", value: BANK_INFO.bankName },
                    { label: "Account Name", value: BANK_INFO.accountName },
                    { label: "Account Number", value: BANK_INFO.accountNumber },
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

              {/* Transaction Reference */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Transaction ID / Reference
                </label>
                <textarea
                  required
                  rows={3}
                  value={txReference}
                  onChange={(e) => setTxReference(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400 text-sm"
                  placeholder="Paste your transaction ID or SMS confirmation text here e.g. TXN123456789..."
                />
                <p className="text-gray-500 text-xs mt-1">
                  After sending the money, paste the confirmation reference here
                  so admin can verify.
                </p>
              </div>

              {/* Message */}
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
                {submitting ? "Submitting..." : "Submit Deposit Request"}
              </button>
            </form>
          )}

          {/* WITHDRAW */}
          {tab === "withdraw" && (
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-400 space-y-1">
                <p className="text-white font-semibold">
                  How withdrawal works:
                </p>
                <p>1. Enter the amount you want to withdraw</p>
                <p>2. Admin reviews and sends money to your account</p>
                <p>3. You will be notified once it's sent</p>
                <p className="text-yellow-400 mt-2">
                  Minimum withdrawal: ETB 50
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Amount (ETB) — Min: 50
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-yellow-400"
                  placeholder="Enter amount e.g. 200"
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
                {submitting ? "Submitting..." : "Request Withdrawal"}
              </button>
            </form>
          )}
        </div>

        {/* Transaction History */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {getTypeLabel(tx.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">ETB {tx.amount.toFixed(2)}</p>
                    <p
                      className={`text-xs capitalize ${getStatusColor(tx.status)}`}
                    >
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
