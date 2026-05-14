import React, { useMemo, useState } from "react";

export default function App() {
  const [area, setArea] = useState(250);
  const [vatType, setVatType] = useState("bedrijf");
  const [color, setColor] = useState("wit");

  const result = useMemo(() => {
    const m2 = Number(area) || 0;
    const valid = m2 >= 80;

    let priceM2 = 0;
    if (valid) {
      if (m2 >= 500) priceM2 = 21.5;
      else if (m2 >= 101) priceM2 = 26.5;
      else priceM2 = 35;
    }

    const excl = m2 * priceM2;
    const vatRate = vatType === "particulier" ? 0.09 : 0.21;
    const vat = excl * vatRate;
    const incl = excl + vat;

    const oneCompMin = m2 >= 500 ? m2 * 30 : m2 * 40;
    const oneCompMax = m2 >= 500 ? m2 * 30 : m2 * 50;
    const bitumenMin = m2 * 75;
    const bitumenMax = m2 * 160;

    return {
      m2,
      valid,
      priceM2,
      excl,
      vat,
      incl,
      vatRate,
      oneCompMin,
      oneCompMax,
      bitumenMin,
      bitumenMax,
      diffOneMin: oneCompMin - excl,
      diffOneMax: oneCompMax - excl,
      diffBitumenMin: bitumenMin - excl,
      diffBitumenMax: bitumenMax - excl,
    };
  }, [area, vatType]);

  const euro = (v) =>
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10">
      <div className="max-w-6xl mx-auto">

        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border border-cyan-400/20 p-6 md:p-10 shadow-2xl">
          <p className="text-cyan-300 text-sm font-black uppercase tracking-[0.25em]">
            ProDakcoating
          </p>

          <h1 className="text-4xl md:text-6xl font-black mt-3 leading-tight">
            CoolShield Rekenapp
          </h1>

          <p className="text-slate-300 mt-4 max-w-3xl text-lg">
            Bereken direct de richtprijs voor uw platte dak met CoolShield NextGen 2K.
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <USP title="Geen sloopwerk" text="Bestaande dakbedekking blijft liggen" />
            <USP title="Tot 70% goedkoper" text="Dan volledige dakvervanging" />
            <USP title="Levensduur 30–60 jaar" text="Professioneel 2K siliconensysteem" />
            <USP title="Witte variant" text="Cool Roof Tech · TSR 91% · SRI 115%"  />
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-slate-900 border border-white/10 p-6 md:p-8 shadow-xl">
          <h2 className="text-3xl font-black mb-6">
            1. Kosten & coatingkeuze
          </h2>

          <div className="grid md:grid-cols-2 gap-5">
            <label>
              <span className="text-sm font-bold text-slate-300">
                Dakoppervlak in m²
              </span>
              <input
                type="number"
                min="0"
                value={area}
                onChange={(e) => setArea(Math.max(0, Number(e.target.value)))}
                className="mt-2 w-full rounded-2xl bg-white text-slate-950 p-4 text-xl outline-none"
              />
              <p className="text-xs text-slate-400 mt-2">
                Vanaf 80 m². Kleinere daken: offerte aanvragen.
              </p>
            </label>

            <label>
              <span className="text-sm font-bold text-slate-300">
                Btw type
              </span>
              <select
                value={vatType}
                onChange={(e) => setVatType(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-white text-slate-950 p-4 text-xl outline-none"
              >
                <option value="bedrijf">Bedrijf / 21% btw</option>
                <option value="particulier">Particulier / 9% btw</option>
              </select>
            </label>
          </div>

          <div className="mt-7">
            <p className="text-sm font-bold text-slate-300 mb-3">
              Kleur coating
            </p>

            <div className="grid md:grid-cols-4 gap-3">
              <ColorButton active={color === "wit"} onClick={() => setColor("wit")} name="Wit" sub="Maximale reflectie" dot="#ffffff" />
              <ColorButton active={color === "7047"} onClick={() => setColor("7047")} name="RAL 7047" sub="Telegrijs 4" dot="#cfd3d6" />
              <ColorButton active={color === "7040"} onClick={() => setColor("7040")} name="RAL 7040" sub="Venstergrijs" dot="#8c9297" />
              <ColorButton active={color === "7042"} onClick={() => setColor("7042")} name="RAL 7042" sub="Verkeersgrijs A" dot="#4f5358" />
            </div>
          </div>

          {result.valid ? (
            <div className="grid md:grid-cols-4 gap-4 mt-8">
              <ResultCard label="Tarief CoolShield 2K" value={`${euro(result.priceM2)}/m²`} />
              <ResultCard label="Totaal excl. btw" value={euro(result.excl)} />
              <ResultCard label={`Btw ${Math.round(result.vatRate * 100)}%`} value={euro(result.vat)} />
              <ResultCard label="Totaal incl. btw" value={euro(result.incl)} highlight />
            </div>
          ) : (
            <div className="mt-8 rounded-3xl bg-amber-400 text-slate-950 p-6">
              <p className="text-sm font-black uppercase tracking-wide">
                Offerte aanvragen
              </p>
              <h3 className="text-3xl font-black mt-2">
                Dakoppervlak kleiner dan 80 m²
              </h3>
              <p className="mt-2 text-lg">
                Voor kleinere oppervlaktes maken wij graag een maatwerkofferte.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl bg-slate-900 border border-white/10 p-6 md:p-8 shadow-xl">
          <h2 className="text-3xl font-black mb-6">
            Prijsvergelijking & levensduur
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <Compare
              highlight
              title="CoolShield NextGen 2K"
              type="Professioneel 2-componenten systeem"
              price={result.valid ? euro(result.excl) : "Offerte"}
              m2={result.valid ? `${euro(result.priceM2)}/m² excl. btw` : "Maatwerk"}
              life="30–60 jaar"
            />

            <Compare
              title="1-component coating"
              type="Consumenten coating"
              price={
                result.m2 >= 500
                  ? euro(result.oneCompMin)
                  : `${euro(result.oneCompMin)} - ${euro(result.oneCompMax)}`
              }
              m2={result.m2 >= 500 ? "± €30/m²" : "€40 - €50/m²"}
              life="20–25 jaar"
              diff={
                result.valid
                  ? result.m2 >= 500
                    ? `Verschil: ${euro(result.diffOneMin)}`
                    : `Verschil: ${euro(result.diffOneMin)} - ${euro(result.diffOneMax)}`
                  : ""
              }
            />

            <Compare
              title="Nieuw bitumen dak"
              type="Complete dakvervanging"
              price={`${euro(result.bitumenMin)} - ${euro(result.bitumenMax)}`}
              m2="€75 - €160/m²"
              life="20–30 jaar"
              diff={
                result.valid
                  ? `Verschil: ${euro(result.diffBitumenMin)} - ${euro(result.diffBitumenMax)}`
                  : ""
              }
            />
          </div>
        </section>

      </div>
    </div>
  );
}

function USP({ title, text }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
      <p className="text-xl font-black">{title}</p>
      <p className="text-slate-300 mt-2">{text}</p>
    </div>
  );
}

function ColorButton({ active, onClick, name, sub, dot }) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-2xl bg-cyan-400 text-slate-950 p-4 text-left border-2 border-cyan-200"
          : "rounded-2xl bg-white text-slate-950 p-4 text-left border-2 border-transparent"
      }
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full border border-black/20" style={{ backgroundColor: dot }} />
        <div>
          <p className="font-black">{name}</p>
          <p className="text-sm opacity-70">{sub}</p>
        </div>
      </div>
    </button>
  );
}

function ResultCard({ label, value, highlight }) {
  return (
    <div className={highlight ? "rounded-2xl bg-cyan-400 text-slate-950 p-5" : "rounded-2xl bg-white/10 border border-white/10 p-5"}>
      <p className={highlight ? "text-sm font-bold opacity-80" : "text-sm text-slate-400"}>{label}</p>
      <p className="text-2xl font-black mt-2">{value}</p>
    </div>
  );
}

function Compare({ title, type, price, m2, life, diff, highlight }) {
  return (
    <div className={highlight ? "rounded-3xl bg-cyan-400 text-slate-950 p-6" : "rounded-3xl bg-white/10 border border-white/10 p-6"}>
      <p className={highlight ? "text-sm font-bold opacity-80" : "text-sm text-slate-400 font-bold"}>{type}</p>
      <h3 className="text-2xl font-black mt-2">{title}</h3>

      <div className="mt-6">
        <p className={highlight ? "text-sm opacity-80" : "text-sm text-slate-400"}>Totale prijs</p>
        <p className="text-3xl font-black mt-1">{price}</p>
        <p className={highlight ? "text-sm opacity-80 mt-1" : "text-sm text-slate-400 mt-1"}>{m2}</p>
      </div>

      <div className="mt-6">
        <p className={highlight ? "text-sm opacity-80" : "text-sm text-slate-400"}>Levensduur</p>
        <p className="text-2xl font-black mt-1">{life}</p>
      </div>

      {diff && (
        <div className="mt-5 rounded-2xl bg-black/20 p-4">
          <p className="font-black">{diff}</p>
        </div>
      )}
    </div>
  );
}
