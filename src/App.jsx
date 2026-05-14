import React, { useState } from "react";

export default function App() {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    area: 250,
    color: "wit",
    zonnepanelen: "ja",
  });

  const update = (key, value) => {
    setForm({ ...form, [key]: value });
  };

  const prijs =
    form.area >= 500
      ? form.area * 21.5
      : form.area * 26.5;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl font-black mb-8">
          ProDakcoating Rekenapp
        </h1>

        <div className="flex gap-3 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-5 py-3 rounded-2xl font-bold ${
                step === s
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-slate-800"
              }`}
            >
              Stap {s}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="grid md:grid-cols-2 gap-6">

            <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop"
                className="h-72 w-full object-cover"
              />

              <div className="p-6">
                <h2 className="text-3xl font-black text-orange-400 mb-3">
                  Warmte geabsorbeerd
                </h2>

                <p className="text-slate-300">
                  Verouderd zwart bitumen kan extreem heet worden.
                </p>

                <div className="mt-6 text-6xl font-black text-red-400">
                  80°C
                </div>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-cyan-400/20 bg-slate-900">
              <img
                src="https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop"
                className="h-72 w-full object-cover"
              />

              <div className="p-6">
                <h2 className="text-3xl font-black text-cyan-300 mb-3">
                  Zonlicht teruggekaatst
                </h2>

                <p className="text-slate-300">
                  CoolShield NextGen 2K reflecteert warmte.
                </p>

                <div className="mt-6 text-6xl font-black text-cyan-300">
                  40°C
                </div>
              </div>
            </div>

          </div>
        )}

        {step === 2 && (
          <div className="rounded-3xl bg-slate-900 p-8">

            <h2 className="text-3xl font-black mb-6">
              Dakoppervlak
            </h2>

            <input
              type="number"
              value={form.area}
              onChange={(e) =>
                update("area", Number(e.target.value))
              }
              className="w-full rounded-2xl bg-slate-800 p-5 text-2xl"
            />

          </div>
        )}

        {step === 3 && (
          <div className="rounded-3xl bg-slate-900 p-8">

            <h2 className="text-3xl font-black mb-6">
              Kleur coating
            </h2>

            <div className="flex gap-4">

              <button
                onClick={() => update("color", "wit")}
                className={`px-6 py-4 rounded-2xl font-bold ${
                  form.color === "wit"
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-slate-800"
                }`}
              >
                Wit
              </button>

              <button
                onClick={() => update("color", "lichtgrijs")}
                className={`px-6 py-4 rounded-2xl font-bold ${
                  form.color === "lichtgrijs"
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-slate-800"
                }`}
              >
                Lichtgrijs
              </button>

            </div>

          </div>
        )}

        {step === 4 && (
          <div className="rounded-3xl bg-slate-900 p-8">

            <h2 className="text-3xl font-black mb-8">
              Indicatie
            </h2>

            <div className="grid md:grid-cols-2 gap-6">

              <div className="rounded-2xl bg-slate-800 p-6">
                <p className="text-slate-400 mb-2">
                  Dakoppervlak
                </p>

                <div className="text-5xl font-black">
                  {form.area} m²
                </div>
              </div>

              <div className="rounded-2xl bg-slate-800 p-6">
                <p className="text-slate-400 mb-2">
                  Richtprijs
                </p>

                <div className="text-5xl font-black text-cyan-300">
                  € {prijs.toLocaleString("nl-NL")}
                </div>
              </div>

            </div>

            <a
              href="https://www.prodakcoating.nl"
              target="_blank"
              className="mt-8 inline-block rounded-2xl bg-cyan-400 px-8 py-5 text-2xl font-black text-slate-950"
            >
              Bekijk ProDakcoating.nl
            </a>

          </div>
        )}

      </div>
    </div>
  );
}
