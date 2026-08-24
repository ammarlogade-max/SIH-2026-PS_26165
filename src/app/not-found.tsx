import Link from "next/link";
import { Factory } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-center p-8">
      <Factory className="w-12 h-12 text-slate-600 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-slate-400 mb-6">The page you are looking for does not exist.</p>
      <Link href="/dashboard" className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
        Back to Dashboard
      </Link>
    </div>
  );
}
