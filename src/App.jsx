import React from "react";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-10">
      <div className="max-w-3xl w-full rounded-3xl border border-white/10 bg-slate-900 p-10">
        
        <h1 className="text-4xl font-black mb-6">
          ProDakcoating Rekenapp
        </h1>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="rounded-2xl overflow-hidden border border-white/10">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop"
              alt="zwart dak"
              className="h-64 w-full object-cover"
            />
            <div className="p-4">
              <h2 className="text-2xl font-bold text-orange-400 mb-2">
                Warmte geabsorbeerd
              </h2>
              <p className="text-slate-300">
                Verouderd zwart bitumen kan extreem heet worden.
              </p>
              <div className="mt-4 text-5xl font-black text-red-400">
                80°C
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-cyan-400/20">
            <img
              src="https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop"
              alt="wit dak"
              className="h-64 w-full object-cover"
            />
            <div className="p-4">
              <h2 className="text-2xl font-bold text-cyan-300 mb-2">
                Zonlicht teruggekaatst
              </h2>
              <p className="text-slate-300">
                CoolShield NextGen 2K reflecteert warmte.
              </p>
              <div className="mt-4 text-5xl font-black text-cyan-300">
                40°C
              </div>
            </div>
          </div>

        </div>

        <a
          href="https://www.prodakcoating.nl"
          target="_blank"
          className="mt-8 inline-block rounded-2xl bg-cyan-400 px-6 py-4 text-xl font-black text-slate-950"
        >
          Wilt u echt het verschil zien? Bekijk ProDakcoating.nl
        </a>

      </div>
    </div>
  );
}
