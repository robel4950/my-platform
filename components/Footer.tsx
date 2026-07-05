import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} NovaEarn. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/support" className="text-gray-400 hover:text-yellow-400">
              Support
            </Link>
            <Link href="/profile" className="text-gray-400 hover:text-yellow-400">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}