"use client";
import React, { useState } from "react";
import PageTransition from "@/components/animations/PageTransition";
import SmoothLink from "@/components/animations/SmoothLink";
import { CheckCircle, Circle } from "lucide-react";

export default function DemoFlowPage() {
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  const toggleStep = (index: number) => {
    if (checkedSteps.includes(index)) {
      setCheckedSteps(checkedSteps.filter(i => i !== index));
    } else {
      setCheckedSteps([...checkedSteps, index]);
    }
  };

  const steps = [
    { title: "Login as Customer", desc: "Select the Customer role from the login page.", link: "/login" },
    { title: "Buy a Product", desc: "Browse the store and complete the mock checkout.", link: "/store" },
    { title: "Mark Order Delivered", desc: "Go to your dashboard and change order status to generate a PoP token.", link: "/customer/orders" },
    { title: "Submit Verified Review", desc: "Submit a review. The system stores it on Mock IPFS and creates an audit event." },
    { title: "Login as Merchant", desc: "Switch roles and open the Merchant Dashboard.", link: "/login" },
    { title: "Reply & Dispute", desc: "Post a merchant reply, and open a formal dispute against the review.", link: "/merchant/dashboard" },
    { title: "Login as Admin", desc: "Switch to Admin and open the Admin Dispute Queue.", link: "/login" },
    { title: "Resolve/Strike Review", desc: "Make a moderation decision to create a new anchored event.", link: "/admin/dashboard" },
    { title: "Verify Proofs", desc: "Check the Review Timeline and Verification Node to see the final ledger.", link: "/verify" }
  ];

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-white">FYP Demo Walkthrough</h1>
        <p className="text-slate-400 mb-12">Use this interactive checklist during your presentation to ensure all core system mechanics are demonstrated.</p>

        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl mb-12 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-sm text-blue-400 font-bold uppercase mb-1">Demo Accounts</p>
            <p className="text-slate-300 text-sm">
              Customer: <code className="bg-black/30 px-1 rounded">customer@sapphire.test</code> | Merchant: <code className="bg-black/30 px-1 rounded">merchant@sapphire.test</code>
            </p>
          </div>
          <SmoothLink href="/admin/audit-log" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-500 transition text-sm">
            Anchor Pending Events
          </SmoothLink>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step, i) => (
             <div 
               key={i} 
               onClick={() => toggleStep(i)} 
               className={`cursor-pointer glass-panel p-6 rounded-2xl border transition-all ${checkedSteps.includes(i) ? 'border-success/50 bg-success/5' : 'border-white/5 hover:border-white/20'}`}
             >
               <div className="flex items-start justify-between mb-2">
                 <h3 className={`text-lg font-bold ${checkedSteps.includes(i) ? 'text-success' : 'text-white'}`}>{i+1}. {step.title}</h3>
                 {checkedSteps.includes(i) ? <CheckCircle className="text-success" size={24} /> : <Circle className="text-slate-600" size={24} />}
               </div>
               <p className="text-sm text-slate-400 mb-4">{step.desc}</p>
               
               {step.link && (
                 /* Wrapped SmoothLink in a div to safely handle the onClick stopPropagation without TypeScript yelling */
                 <div onClick={(e: React.MouseEvent) => e.stopPropagation()} className="inline-block">
                   <SmoothLink href={step.link} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition">
                     Go to page →
                   </SmoothLink>
                 </div>
               )}
             </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}