import Link from "next/link";
import { signOut } from "next-auth/react";

export default function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800 px-4 py-4">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold text-yellow-400">
          NovaEarn
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white text-sm"
          >
            Dashboard
          </Link>
          <Link href="/wallet" className="text-gray-400 hover:text-white text-sm">
            Wallet
          </Link>
          <Link href="/vip" className="text-gray-400 hover:text-white text-sm">
            VIP
          </Link>
          <Link href="/team" className="text-gray-400 hover:text-white text-sm">
            Team
          </Link>
          <Link href="/income" className="text-gray-400 hover:text-white text-sm">
            Income
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-gray-400 hover:text-white border border-gray-700 rounded-lg px-3 py-1"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
