"use client";

import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface VipContract {
  id: string;
  vipLevel: number;
  dailyIncome: number;
  earnedSoFar: number;
  totalIncomeLimit: number;
  startDate: string;
  status: string;
  lastClaimedAt: string | null;
}

interface IncomeData {
  transactions: Transaction[];
  summary: {
    dailyIncomeTotal: number;
    commissionTotal: number;
    totalIncome: number;
    activeContractsCount: number;
    expiredContractsCount: number;
  };
  activeContracts: VipContract[];
}

export default function IncomePage() {
  const [data, setData] = useState<IncomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "daily_income" | "commission">(
    "all",
  );
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    fetch("/api/income")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  function canClaim(lastClaimedAt: string | null) {
    if (!lastClaimedAt) return true;
    const last = new Date(lastClaimedAt);
    const now = new Date();
    return !(
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate()
    );
  }

  async function claimIncome(contractId: string) {
    setClaiming(contractId);
    try {
      const res = await fetch("/api/vip/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId }),
      });
      const result = await res.json();
      if (res.ok) {
        loadData();
      } else {
        alert(result.error);
      }
    } finally {
      setClaiming(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  const filteredTx =
    data?.transactions.filter((tx) =>
      filter === "all" ? true : tx.type === filter,
    ) || [];

  function getTypeLabel(type: string) {
    switch (type) {
      case "daily_income":
        return "📈 Daily Income";
      case "commission":
        return "🤝 Referral Commission";
      default:
        return type;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-gray-950">
        <p className="text-sm font-medium opacity-75">Total Income Earned</p>
        <p className="text-4xl font-bold mt-1">
          ETB{" "}
          {data?.summary.totalIncome.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
        <div className="flex gap-6 mt-4 text-sm">
          <div>
            <p className="opacity-75">From VIP</p>
            <p className="font-bold">
              ETB {data?.summary.dailyIncomeTotal.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="opacity-75">From Referrals</p>
            <p className="font-bold">
              ETB {data?.summary.commissionTotal.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Active VIP Contracts */}
      {data && data.activeContracts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Active VIP Contracts</h2>
          <div className="space-y-3">
            {data.activeContracts.map((contract) => {
              const progress =
                (contract.earnedSoFar / contract.totalIncomeLimit) * 100;
              const canClaimToday = canClaim(contract.lastClaimedAt);

              return (
                <div key={contract.id} className="bg-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">
                      VIP {contract.vipLevel}
                    </span>
                    <span className="text-green-400 text-sm font-semibold">
                      +ETB {contract.dailyIncome}/day
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>ETB {contract.earnedSoFar.toFixed(2)} earned</span>
                    <span>ETB {contract.totalIncomeLimit} limit</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <button
                    onClick={() => claimIncome(contract.id)}
                    disabled={!canClaimToday || claiming === contract.id}
                    className={`w-full py-2 rounded-lg text-sm font-bold transition ${
                      canClaimToday
                        ? "bg-yellow-400 hover:bg-yellow-300 text-gray-950"
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {claiming === contract.id
                      ? "Claiming..."
                      : canClaimToday
                        ? `Claim ETB ${contract.dailyIncome} Today`
                        : "✓ Claimed Today — Come back tomorrow"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1">
        <button
          onClick={() => setFilter("all")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            filter === "all" ? "bg-yellow-400 text-gray-950" : "text-gray-400"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("daily_income")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            filter === "daily_income"
              ? "bg-yellow-400 text-gray-950"
              : "text-gray-400"
          }`}
        >
          VIP Income
        </button>
        <button
          onClick={() => setFilter("commission")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
            filter === "commission"
              ? "bg-yellow-400 text-gray-950"
              : "text-gray-400"
          }`}
        >
          Commissions
        </button>
      </div>

      {/* Income History */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">Income History</h2>

        {filteredTx.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No income recorded yet</p>
            <p className="text-gray-600 text-sm mt-1">
              {filter === "daily_income"
                ? "Buy a VIP plan to start earning daily income"
                : filter === "commission"
                  ? "Invite friends to earn referral commissions"
                  : "Start investing or inviting friends to see your earnings here"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTx.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">{getTypeLabel(tx.type)}</p>
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
                <p className="text-green-400 font-bold">
                  +ETB {tx.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
