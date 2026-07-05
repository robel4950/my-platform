"use client";

import { useEffect, useState } from "react";

interface TeamUser {
  id: string;
  email: string;
  createdAt: string;
  vipContracts: { vipLevel: number }[];
}

interface TeamData {
  level1: { count: number; users: TeamUser[]; earnings: number };
  level2: { count: number; users: TeamUser[]; earnings: number };
  level3: { count: number; users: TeamUser[]; earnings: number };
  totalEarnings: number;
  totalTeamSize: number;
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-yellow-400 text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (name.length <= 2) return email;
    return `${name.slice(0, 2)}***@${domain}`;
  }

  const levels = [
    { num: 1 as const, data: data?.level1, rate: "18%", color: "yellow" },
    { num: 2 as const, data: data?.level2, rate: "5%", color: "orange" },
    { num: 3 as const, data: data?.level3, rate: "2%", color: "red" },
  ];

  const activeLevelData = levels.find((l) => l.num === activeLevel)?.data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-gray-950">
        <p className="text-sm font-medium opacity-75">Total Team Earnings</p>
        <p className="text-4xl font-bold mt-1">
          ETB{" "}
          {data?.totalEarnings.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
        </p>
        <p className="text-sm mt-2 opacity-75">
          {data?.totalTeamSize} total members across 3 levels
        </p>
      </div>

      {/* Level Cards */}
      <div className="grid grid-cols-3 gap-3">
        {levels.map((level) => (
          <button
            key={level.num}
            onClick={() => setActiveLevel(level.num)}
            className={`bg-gray-900 border rounded-2xl p-4 text-center transition ${
              activeLevel === level.num
                ? "border-yellow-400"
                : "border-gray-800"
            }`}
          >
            <p className="text-2xl font-bold text-yellow-400">
              {level.data?.count ?? 0}
            </p>
            <p className="text-gray-400 text-sm mt-1">Level {level.num}</p>
            <p className="text-gray-500 text-xs">{level.rate} commission</p>
            <p className="text-green-400 text-xs mt-1 font-semibold">
              ETB {(level.data?.earnings ?? 0).toFixed(2)}
            </p>
          </button>
        ))}
      </div>

      {/* Member List */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Level {activeLevel} Members ({activeLevelData?.count ?? 0})
        </h2>

        {!activeLevelData || activeLevelData.users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No members at this level yet</p>
            <p className="text-gray-600 text-sm mt-1">
              Share your invite link to grow your team!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeLevelData.users.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center bg-gray-800 rounded-xl p-3"
              >
                <div>
                  <p className="text-sm font-medium">{maskEmail(user.email)}</p>
                  <p className="text-xs text-gray-500">
                    Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {user.vipContracts.length > 0 ? (
                  <span className="bg-yellow-400/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full">
                    VIP {user.vipContracts.map((v) => v.vipLevel).join(", ")}
                  </span>
                ) : (
                  <span className="bg-gray-700 text-gray-400 text-xs px-3 py-1 rounded-full">
                    No VIP
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-sm text-gray-400 space-y-1">
        <p className="text-white font-semibold mb-2">
          How referral tracking works:
        </p>
        <p>
          • When someone registers using your invite link, they become your
          Level 1
        </p>
        <p>
          • When your Level 1 invites someone, that person becomes your Level 2
        </p>
        <p>
          • When your Level 2 invites someone, that person becomes your Level 3
        </p>
        <p>• You earn commission automatically whenever they buy a VIP plan</p>
      </div>
    </div>
  );
}
