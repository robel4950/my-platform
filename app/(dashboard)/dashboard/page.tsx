"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface DashboardData {
  email: string;
  inviteCode: string;
  wallet: {
    mainBalance: number;
    investmentBalance: number;
    referralBalance: number;
  };
  activeVip: {
    vipLevel: number;
    dailyIncome: number;
    earnedSoFar: number;
    totalIncomeLimit: number;
  } | null;
  team: {
    level1: number;
    level2: number;
    level3: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (res.status === 401) router.push("/login");
        return res.json();
      })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  function copyInviteLink() {
    navigator.clipboard.writeText(
      `${window.location.origin}/register?code=${data?.inviteCode}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  const totalBalance =
    (data?.wallet.mainBalance || 0) +
    (data?.wallet.investmentBalance || 0) +
    (data?.wallet.referralBalance || 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-yellow-400">NovaEarn</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">
            {data?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-gray-950">
          <p className="text-sm font-medium opacity-75">Total Balance</p>
          <p className="text-4xl font-bold mt-1">
            ETB{" "}
            {totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <p className="opacity-75">Main</p>
              <p className="font-bold">
                ETB {data?.wallet.mainBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="opacity-75">Investment</p>
              <p className="font-bold">
                ETB {data?.wallet.investmentBalance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="opacity-75">Referral</p>
              <p className="font-bold">
                ETB {data?.wallet.referralBalance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* VIP Status */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">VIP Status</h2>
          {data?.activeVip ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Plan</span>
                <span className="bg-yellow-400 text-gray-950 font-bold px-3 py-1 rounded-full text-sm">
                  VIP {data.activeVip.vipLevel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Daily Income</span>
                <span className="text-green-400 font-semibold">
                  +ETB {data.activeVip.dailyIncome}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Progress</span>
                <span>
                  ETB {data.activeVip.earnedSoFar} /{" "}
                  {data.activeVip.totalIncomeLimit}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (data.activeVip.earnedSoFar /
                        data.activeVip.totalIncomeLimit) *
                        100,
                      100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-3">No active VIP plan</p>
              <button
                onClick={() => router.push("/vip")}
                className="bg-yellow-400 text-gray-950 font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 transition"
              >
                Buy VIP Plan
              </button>
            </div>
          )}
        </div>

        {/* Team Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">My Team</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-400">
                {data?.team.level1}
              </p>
              <p className="text-gray-400 text-sm mt-1">Level 1</p>
              <p className="text-gray-500 text-xs">18% commission</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-400">
                {data?.team.level2}
              </p>
              <p className="text-gray-400 text-sm mt-1">Level 2</p>
              <p className="text-gray-500 text-xs">5% commission</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-yellow-400">
                {data?.team.level3}
              </p>
              <p className="text-gray-400 text-sm mt-1">Level 3</p>
              <p className="text-gray-500 text-xs">2% commission</p>
            </div>
          </div>
        </div>

        {/* Invite Link */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">My Invite Link</h2>
          <div className="bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-3">
            <code className="text-yellow-400 text-sm truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/register?code=${data?.inviteCode}`
                : `/register?code=${data?.inviteCode}`}
            </code>
            <button
              onClick={copyInviteLink}
              className="bg-yellow-400 text-gray-950 font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap hover:bg-yellow-300 transition"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-2">
            Your invite code:{" "}
            <span className="text-yellow-400 font-mono font-bold">
              {data?.inviteCode}
            </span>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.push("/vip")}
            className="bg-gray-900 border border-gray-800 hover:border-yellow-400 rounded-2xl p-5 text-left transition"
          >
            <div className="text-2xl mb-2">💎</div>
            <p className="font-semibold">VIP Plans</p>
            <p className="text-gray-400 text-sm">Buy & earn daily</p>
          </button>
          <button
            onClick={() => router.push("/wallet")}
            className="bg-gray-900 border border-gray-800 hover:border-yellow-400 rounded-2xl p-5 text-left transition"
          >
            <div className="text-2xl mb-2">💰</div>
            <p className="font-semibold">Wallet</p>
            <p className="text-gray-400 text-sm">Deposit & withdraw</p>
          </button>
          <button
            onClick={() => router.push("/team")}
            className="bg-gray-900 border border-gray-800 hover:border-yellow-400 rounded-2xl p-5 text-left transition"
          >
            <div className="text-2xl mb-2">👥</div>
            <p className="font-semibold">My Team</p>
            <p className="text-gray-400 text-sm">View referrals</p>
          </button>
          <button
            onClick={() => router.push("/income")}
            className="bg-gray-900 border border-gray-800 hover:border-yellow-400 rounded-2xl p-5 text-left transition"
          >
            <div className="text-2xl mb-2">📈</div>
            <p className="font-semibold">Income</p>
            <p className="text-gray-400 text-sm">Earnings history</p>
          </button>
        </div>
      </div>
    </div>
  );
}
