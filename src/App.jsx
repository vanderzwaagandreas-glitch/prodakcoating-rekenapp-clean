import React from "react";

function USP({ title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-2xl font-black text-white mb-2">
        {title}
      </h3>

      <p className="text-slate-300 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans">

      <section className="max-w-7xl mx-auto px-6 py-14">

        <p className="tracking-[6px] text-cyan-400 text-sm font-bold mb-4 uppercase">
          ProDakCoating
        </p>

        <h1 className="text-6xl md:text-8xl font-black leading-none">
          CoolShield Rekenapp
        </h1>

        <p className="text-slate-300 text-xl mt-6 max-w-3xl leading-relaxed">
          Bereken direct de richtprijs voor uw platte dak met
          CoolShield NextGen 2K.
        </p>

        <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-5 mt-12">

          <USP
            title="Geen sloopwerk"
            text="Bestaande dakbedekking blijft liggen."
          />

          <USP
            title="Tot 70% goedkoper"
            text="Dan volledige dakvervanging."
          />

          <USP
            title="Levensduur 30–60 jaar"
            text="Professioneel 2K siliconesysteem."
          />

          <USP
            title="Witte variant"
            text="Cool Roof Tech · TSR 91% · SRI 115%"
          />

          <USP
            title="Energie efficiënt"
            text="Meer rendement uit zonnepanelen en minder behoefte aan airco."
          />

          <USP
            title="Hydrofoob"
            text="100% waterdicht en bestand tegen stilstaand water."
          />

        </div>

      </section>

    </div>
  );
}
