"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference: string | null;
  createdAt: string;
  user: { email: string };
}

interface User {
  id: string;
  email: string;
  inviteCode: string;
  isAdmin: boolean;
  wallet: {
    mainBalance: number;
    investmentBalance: number;
    referralBalance: number;
  } | null;
  vipContracts: { vipLevel: number }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "all" | "users">("pending");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [txRes, usersRes] = await Promise.all([
        fetch("/api/admin/transactions"),
        fetch("/api/admin/users"),
      ]);

      if (txRes.status === 403) {
        setUnauthorized(true);
        return;
      }

      const txData = await txRes.json();
      const usersData = await usersRes.json();
      setTransactions(txData.transactions || []);
      setUsers(usersData.users || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: "approve" | "reject") {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        await loadData();
      }
    } finally {
      setProcessingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-center px-4">
        <div>
          <p className="text-2xl font-bold text-red-400 mb-2">Access Denied</p>
          <p className="text-gray-400 mb-4">
            You don't have admin permissions.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-yellow-400 text-gray-950 font-bold px-6 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const pendingTx = transactions.filter((t) => t.status === "pending");
  const deposits = pendingTx.filter((t) => t.type === "deposit");
  const withdrawals = pendingTx.filter((t) => t.type === "withdraw");

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
        <h1 className="text-xl font-bold text-yellow-400">Admin Panel</h1>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{users.length}</p>
            <p className="text-gray-400 text-xs mt-1">Total Users</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {deposits.length}
            </p>
            <p className="text-gray-400 text-xs mt-1">Pending Deposits</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-400">
              {withdrawals.length}
            </p>
            <p className="text-gray-400 text-xs mt-1">Pending Withdrawals</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
          <button
            onClick={() => setTab("pending")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "pending"
                ? "bg-yellow-400 text-gray-950"
                : "text-gray-400"
            }`}
          >
            Pending ({pendingTx.length})
          </button>
          <button
            onClick={() => setTab("all")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "all" ? "bg-yellow-400 text-gray-950" : "text-gray-400"
            }`}
          >
            All Transactions
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              tab === "users" ? "bg-yellow-400 text-gray-950" : "text-gray-400"
            }`}
          >
            Users
          </button>
        </div>

        {/* PENDING TAB */}
        {tab === "pending" && (
          <div className="space-y-3">
            {pendingTx.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No pending requests 🎉
              </p>
            ) : (
              pendingTx.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        {tx.type === "deposit" ? "💰 Deposit" : "💸 Withdrawal"}
                      </p>
                      <p className="text-gray-400 text-sm">{tx.user.email}</p>
                    </div>
                    <p className="text-yellow-400 font-bold text-lg">
                      ETB {tx.amount.toFixed(2)}
                    </p>
                  </div>

                  {tx.reference && (
                    <div className="bg-gray-800 rounded-lg p-3 mb-3">
                      <p className="text-gray-500 text-xs mb-1">Reference:</p>
                      <p className="text-sm text-white font-mono break-all">
                        {tx.reference}
                      </p>
                    </div>
                  )}

                  <p className="text-gray-500 text-xs mb-3">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(tx.id, "approve")}
                      disabled={processingId === tx.id}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg text-sm transition disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleAction(tx.id, "reject")}
                      disabled={processingId === tx.id}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg text-sm transition disabled:opacity-50"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ALL TRANSACTIONS TAB */}
        {tab === "all" && (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-sm font-medium">
                    {tx.type === "deposit" ? "💰 Deposit" : "💸 Withdrawal"} —{" "}
                    {tx.user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">ETB {tx.amount.toFixed(2)}</p>
                  <p
                    className={`text-xs capitalize ${
                      tx.status === "approved"
                        ? "text-green-400"
                        : tx.status === "rejected"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="space-y-2">
            {users.map((user) => {
              const total =
                (user.wallet?.mainBalance || 0) +
                (user.wallet?.investmentBalance || 0) +
                (user.wallet?.referralBalance || 0);
              return (
                <div
                  key={user.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {user.email}
                        {user.isAdmin && (
                          <span className="bg-purple-600 text-xs px-2 py-0.5 rounded-full">
                            Admin
                          </span>
                        )}
                      </p>
                      <p className="text-gray-500 text-xs font-mono mt-1">
                        {user.inviteCode}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-400">
                        ETB {total.toFixed(2)}
                      </p>
                      {user.vipContracts.length > 0 && (
                        <p className="text-xs text-gray-400">
                          VIP{" "}
                          {user.vipContracts.map((v) => v.vipLevel).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
