import { Bot, Terminal, Cpu } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1b2a1f] p-8">
      <header className="flex items-center gap-3 border-b border-[#d8d4cb] pb-4 mb-6">
        <Bot className="w-8 h-8 text-[#64864d]" />
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1b2a1f]">Nexus</h1>
          <p className="text-sm text-[#646a78]">Autonomous Multi-Agent Orchestration Hub</p>
        </div>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#faf9f6] p-4 rounded border border-[#d8d4cb]">
          <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#6b5a2e]" /> Worker Matrix
          </h2>
          <p className="text-xs text-[#646a78] mt-1">Autonomous worker agents ready for task dispatch.</p>
        </div>
        <div className="bg-[#1b2a1f] text-[#f4f1ea] p-4 rounded font-mono text-sm">
          <div className="flex items-center gap-2 mb-2 text-[#64864d]">
            <Terminal className="w-4 h-4" /> Telemetry
          </div>
          <p className="text-xs opacity-75">Nexus daemon awaiting instructions...</p>
        </div>
      </main>
    </div>
  );
}
