import PageTransition from "@/components/animations/PageTransition";

export default function HowItWorks() {
  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black mb-12 tracking-tight text-white">How Sapphire Works</h1>
        
        <div className="glass-panel p-8 md:p-12 rounded-3xl mb-12">
          <h2 className="text-2xl font-bold mb-8 tracking-tight text-blue-400">The Lifecycle of a Review</h2>
          <ol className="list-decimal pl-6 space-y-5 text-slate-300 font-light text-lg marker:text-blue-500 marker:font-bold">
            <li>Customer purchases a product from a registered merchant.</li>
            <li>Order is successfully delivered and confirmed.</li>
            <li>A Cryptographic <strong className="text-white font-medium">Proof-of-Purchase (PoP) token</strong> is securely generated.</li>
            <li>Customer writes and submits a verified review using the token.</li>
            <li>Review content is hashed and anchored to the audit ledger.</li>
            <li>The review goes live with a verifiable <strong className="text-white font-medium">PoVE badge</strong>.</li>
            <li>Any future edits, replies, or disputes automatically append to the immutable log.</li>
          </ol>
        </div>

        <div className="glass-panel p-8 md:p-12 rounded-3xl mb-12 border border-cyan-500/20">
          <h2 className="text-2xl font-bold mb-6 tracking-tight text-cyan-400">Blockchain Audit Layer</h2>
          <p className="text-slate-300 font-light leading-relaxed mb-6">
            Sapphire uses blockchain as an audit layer, not as the main database. Full reviews, users, orders, and disputes are handled by the application backend. Only hashes, timestamps, status changes, and audit references are anchored to the ledger. This keeps the system usable while making important review actions tamper-evident.
          </p>
          <div className="bg-black/40 p-6 rounded-2xl font-mono text-sm text-slate-400">
            Action Occurs <span className="text-cyan-500 px-2">→</span> 
            Payload Hash Generated <span className="text-cyan-500 px-2">→</span> 
            Event Linked to Previous Hash <span className="text-cyan-500 px-2">→</span><br className="md:hidden"/> 
            Anchored to Polygon Amoy Registry
          </div>
          
          <h3 className="text-xl font-bold mt-10 mb-4 text-white">Mock Mode vs Polygon Amoy</h3>
          <p className="text-slate-400 font-light leading-relaxed">
            This prototype uses mock blockchain anchoring to demonstrate the complete flow without requiring real testnet funds or wallet setup. The architecture is explicitly designed so the mock anchoring function can later be replaced with a real Polygon Amoy smart contract call via ethers.js or viem.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}