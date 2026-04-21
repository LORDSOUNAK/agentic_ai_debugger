import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agentic AI Debugger",
  description: "Granular observability for agentic pipelines",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex text-slate-100`}>
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 glass hidden md:flex flex-col p-6 sticky top-0 h-screen">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">A</div>
            <h1 className="text-xl font-bold tracking-tight">AgenticDebugger</h1>
          </div>
          
          <nav className="space-y-4 flex-1">
            <NavItem label="Dashboard" active />
            <NavItem label="Live Traces" />
            <NavItem label="Cost Analysis" />
            <NavItem label="Settings" />
          </nav>
          
          <div className="mt-auto p-4 glass text-xs text-slate-400">
            Status: <span className="text-green-400">Connected</span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-white/10 glass flex items-center px-8 sticky top-0 z-50">
            <div className="flex-1"></div>
            <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Run New Agent Task
            </button>
          </header>
          
          <div className="p-8 pb-20">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

function NavItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <div className={`
      px-4 py-2 rounded-lg cursor-pointer transition-all duration-200
      ${active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}
    `}>
      {label}
    </div>
  );
}
