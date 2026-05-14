import React, { useMemo, useState, useEffect } from "react";

// Constants
const PRICE_CONFIG = {
  MIN_AREA: 80,
  THRESHOLDS: {
    HIGH: 500,
    MEDIUM: 101,
  },
  PRICES: {
    HIGH: 21.5,    // >= 500 m²
    MEDIUM: 26.5,  // 101-499 m²
    LOW: 35,       // 80-100 m²
  },
};

const ONE_COMP_CONFIG = {
  HIGH_THRESHOLD: 500,
  HIGH_PRICE: 30,
  LOW_MIN: 40,
  LOW_MAX: 50,
};

const BITUMEN_CONFIG = {
  MIN_PRICE: 75,
  MAX_PRICE: 160,
};

export default function App() {
  const [areaInput, setAreaInput] = useState("250");
  const [vatType, setVatType] = useState("bedrijf");
  const [color, setColor] = useState("wit");

  // Validate and parse area input
  const area = useMemo(() => {
    const num = parseFloat(areaInput);
    if (isNaN(num)) return 0;
    return Math.min(Math.max(0, num), 10000); // Max 10,000 m²
  }, [areaInput]);

  const result = useMemo(() => {
    const m2 = area;
    const valid = m2 >= PRICE_CONFIG.MIN_AREA && m2 <= 10000;

    let priceM2 = 0;
    let error = null;

    if (valid) {
      if (m2 >= PRICE_CONFIG.THRESHOLDS.HIGH) {
        priceM2 = PRICE_CONFIG.PRICES.HIGH;
      } else if (m2 >= PRICE_CONFIG.THRESHOLDS.MEDIUM) {
        priceM2 = PRICE_CONFIG.PRICES.MEDIUM;
      } else {
        priceM2 = PRICE_CONFIG.PRICES.LOW;
      }
    }

    const excl = m2 * priceM2;
    const vatRate = vatType === "particulier" ? 0.09 : 0.21;
    const vat = excl * vatRate;
    const incl = excl + vat;

    // Fix: 1-component prijsberekening
    let oneCompMin, oneCompMax;
    if (m2 >= ONE_COMP_CONFIG.HIGH_THRESHOLD) {
      const price = m2 * ONE_COMP_CONFIG.HIGH_PRICE;
      oneCompMin = price;
      oneCompMax = price;
    } else {
      oneCompMin = m2 * ONE_COMP_CONFIG.LOW_MIN;
      oneCompMax = m2 * ONE_COMP_CONFIG.LOW_MAX;
    }

    const bitumenMin = m2 * BITUMEN_CONFIG.MIN_PRICE;
    const bitumenMax = m2 * BITUMEN_CONFIG.MAX_PRICE;

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
      error,
    };
  }, [area, vatType]);

  // Format currency
  const euro = (v, showZero = false) => {
    if (!showZero && (!v || v === 0)) return "Offerte";
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v);
  };

  // Format price range
  const formatRange = (min, max) => {
    if (min === max) return euro(min, true);
    return `${euro(min, true)} - ${euro(max, true)}`;
  };

  // Handle input change
  const handleAreaChange = (e) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setAreaInput(value);
    }
  };

  // Load/save preferences
  useEffect(() => {
    const saved = localStorage.getItem("coolshield_prefs");
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        if (prefs.vatType) setVatType(prefs.vatType);
        if (prefs.color) setColor(prefs.color);
        if (prefs.areaInput) setAreaInput(prefs.areaInput);
      } catch (e) {
        console.error("Failed to load preferences:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "coolshield_prefs",
      JSON.stringify({ vatType, color, areaInput })
    );
  }, [vatType, color, areaInput]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border border-cyan-400/20 p-6 md:p-10 shadow-2xl">
          <p className="text-cyan-300 text-sm font-black uppercase tracking-[0.25em]">
            ProDakcoating
          </p>
          <h1 className="text-4xl md:text-6xl font-black mt-3 leading-tight">
            CoolShield Rekenapp
          </h1>
          <p className="text-slate-300 mt-4 max-w-3xl text-lg">
            Bereken direct de richtprijs voor uw platte dak en vergelijk
            CoolShield NextGen 2K met 1-component coating en complete bitumen
            dakvervanging.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <USP
              title="Geen sloopwerk"
              text="Bestaande dakbedekking blijft liggen"
            />
            <USP
              title="Tot 70% goedkoper"
              text="Dan volledige dakvervanging"
            />
            <USP
              title="Levensduur 30–60 jaar"
              text="Professioneel 2K siliconensysteem"
            />
          </div>
        </section>

        {/* Calculator Section */}
        <section className="mt-6 rounded-3xl bg-slate-900 border border-white/10 p-6 md:p-8 shadow-xl">
          <h2 className="text-3xl font-black mb-6">1. Kosten & coatingkeuze</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="area"
                className="text-sm font-bold text-slate-300 block"
              >
                Dakoppervlak in m²
              </label>
              <input
                id="area"
                type="text"
                inputMode="decimal"
                value={areaInput}
                onChange={handleAreaChange}
                placeholder="Bijv. 250"
                className="mt-2 w-full rounded-2xl bg-white text-slate-950 p-4 text-xl outline-none focus:ring-2 focus:ring-cyan-400"
                aria-describedby="area-help"
              />
              <p id="area-help" className="text-xs text-slate-400 mt-2">
                Vanaf 80 m² tot 10.000 m². Voor kleinere of grotere daken:
                offerte aanvragen.
              </p>
              {area > 10000 && (
                <p className="text-xs text-amber-400 mt-1">
                  Oppervlakte boven 10.000 m² - neem contact op voor
                  maatwerkofferte
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="vatType"
                className="text-sm font-bold text-slate-300 block"
              >
                BTW type
              </label>
              <select
                id="vatType"
                value={vatType}
                onChange={(e) => setVatType(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-white text-slate-950 p-4 text-xl outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="bedrijf">Bedrijf / 21% BTW</option>
                <option value="particulier">Particulier / 9% BTW</option>
              </select>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-sm font-bold text-slate-300 mb-3">
              Kleur coating (prijsidentiek)
            </p>
            <div className="grid md:grid-cols-4 gap-3">
              <ColorButton
                active={color === "wit"}
                onClick={() => setColor("wit")}
                name="Wit"
                sub="Maximale reflectie"
                dot="#ffffff"
              />
              <ColorButton
                active={color === "7047"}
                onClick={() => setColor("7047")}
                name="RAL 7047"
                sub="Telegrijs 4"
                dot="#cfd3d6"
              />
              <ColorButton
                active={color === "7040"}
                onClick={() => setColor("7040")}
                name="RAL 7040"
                sub="Venstergrijs"
                dot="#8c9297"
              />
              <ColorButton
                active={color === "7042"}
                onClick={() => setColor("7042")}
                name="RAL 7042"
                sub="Verkeersgrijs A"
                dot="#4f5358"
              />
            </div>
          </div>

          {result.valid && area <= 10000 ? (
            <div className="grid md:grid-cols-4 gap-4 mt-8">
              <ResultCard
                label="Tarief CoolShield 2K"
                value={euro(result.priceM2, true) + "/m²"}
              />
              <ResultCard label="Totaal excl. BTW" value={euro(result.excl, true)} />
              <ResultCard
                label={`BTW ${Math.round(result.vatRate * 100)}%`}
                value={euro(result.vat, true)}
              />
              <ResultCard
                label="Totaal incl. BTW"
                value={euro(result.incl, true)}
                highlight
              />
            </div>
          ) : (
            <div className="mt-8 rounded-3xl bg-amber-400 text-slate-950 p-6">
              <p className="text-sm font-black uppercase tracking-wide">
                Offerte aanvragen
              </p>
              <h3 className="text-3xl font-black mt-2">
                {area < PRICE_CONFIG.MIN_AREA
                  ? `Dakoppervlak kleiner dan ${PRICE_CONFIG.MIN_AREA} m²`
                  : area > 10000
                  ? "Dakoppervlak groter dan 10.000 m²"
                  : "Ongeldig oppervlak"}
              </h3>
              <p className="mt-2 text-lg">
                {area < PRICE_CONFIG.MIN_AREA
                  ? "Voor kleinere oppervlaktes maken wij graag een maatwerkofferte."
                  : "Voor grotere projecten werken we met maatwerk. Neem contact met ons op voor een offerte."}
              </p>
            </div>
          )}
        </section>

        {/* Comparison Section */}
        <section className="mt-6 rounded-3xl bg-slate-900 border border-white/10 p-6 md:p-8 shadow-xl">
          <h2 className="text-3xl font-black mb-6">
            Prijsvergelijking & levensduur
          </h2>

          <div className="grid md:grid-cols-3 gap-5">
            <Compare
              highlight
              title="CoolShield NextGen 2K"
              type="Professioneel 2-componenten systeem"
              price={result.valid ? euro(result.excl, true) : "Offerte"}
              m2={
                result.valid
                  ? `${euro(result.priceM2, true)}/m² excl. BTW`
                  : "Maatwerk"
              }
              life="30–60 jaar"
            />

            <Compare
              title="1-component coating"
              type="Consumenten coating"
              price={
                result.valid
                  ? formatRange(result.oneCompMin, result.oneCompMax)
                  : "Offerte"
              }
              m2={
                result.valid && result.m2 >= ONE_COMP_CONFIG.HIGH_THRESHOLD
                  ? `€${ONE_COMP_CONFIG.HIGH_PRICE}/m²`
                  : result.valid
                  ? `€${ONE_COMP_CONFIG.LOW_MIN}-${ONE_COMP_CONFIG.LOW_MAX}/m²`
                  : ""
              }
              life="20–25 jaar"
              diff={
                result.valid && result.oneCompMin !== result.oneCompMax
                  ? `Verschil: ${formatRange(result.diffOneMin, result.diffOneMax)}`
                  : result.valid
                  ? `Verschil: ${euro(result.diffOneMin, true)}`
                  : ""
              }
            />

            <Compare
              title="Nieuw bitumen dak"
              type="Complete dakvervanging"
              price={
                result.valid
                  ? formatRange(result.bitumenMin, result.bitumenMax)
                  : "Offerte"
              }
              m2={`€${BITUMEN_CONFIG.MIN_PRICE}-${BITUMEN_CONFIG.MAX_PRICE}/m²`}
              life="20–30 jaar"
              diff={
                result.valid
                  ? `Verschil: ${formatRange(
                      result.diffBitumenMin,
                      result.diffBitumenMax
                    )}`
                  : ""
              }
            />
          </div>

          <div className="mt-8 p-4 bg-cyan-400/10 rounded-2xl border border-cyan-400/20">
            <p className="text-sm text-cyan-300 text-center">
              * Alle prijzen zijn richtprijzen exclusief eventuele
              voorrijkosten en ondergrond reparaties. Vraag een vrijblijvende
              offerte aan voor een exacte prijs.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

// Subcomponents
function USP({ title, text }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 p-5 hover:bg-white/15 transition-colors">
      <p className="text-xl font-black">{title}</p>
      <p className="text-slate-300 mt-2">{text}</p>
    </div>
  );
}

function ColorButton({ active, onClick, name, sub, dot }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl p-4 text-left transition-all ${
        active
          ? "bg-cyan-400 text-slate-950 border-2 border-cyan-200 shadow-lg shadow-cyan-400/20"
          : "bg-white text-slate-950 border-2 border-transparent hover:bg-cyan-100"
      }`}
      aria-pressed={active}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border border-black/20 shadow-inner"
          style={{ backgroundColor: dot }}
          aria-hidden="true"
        />
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
    <div
      className={
        highlight
          ? "rounded-2xl bg-cyan-400 text-slate-950 p-5 shadow-lg shadow-cyan-400/20"
          : "rounded-2xl bg-white/10 border border-white/10 p-5"
      }
    >
      <p
        className={
          highlight ? "text-sm font-bold opacity-80" : "text-sm text-slate-400"
        }
      >
        {label}
      </p>
      <p className="text-2xl font-black mt-2 break-words">{value}</p>
    </div>
  );
}

function Compare({ title, type, price, m2, life, diff, highlight }) {
  return (
    <div
      className={
        highlight
          ? "rounded-3xl bg-cyan-400 text-slate-950 p-6 shadow-xl"
          : "rounded-3xl bg-white/10 border border-white/10 p-6 hover:bg-white/15 transition-colors"
      }
    >
      <p
        className={
          highlight
            ? "text-sm font-bold opacity-80"
            : "text-sm text-slate-400 font-bold"
        }
      >
        {type}
      </p>
      <h3 className="text-2xl font-black mt-2">{title}</h3>

      <div className="mt-6">
        <p
          className={
            highlight ? "text-sm opacity-80" : "text-sm text-slate-400"
          }
        >
          Totale prijs
        </p>
        <p className="text-3xl font-black mt-1 break-words">{price}</p>
        {m2 && (
          <p
            className={
              highlight
                ? "text-sm opacity-80 mt-1"
                : "text-sm text-slate-400 mt-1"
            }
          >
            {m2}
          </p>
        )}
      </div>

      <div className="mt-6">
        <p
          className={
            highlight ? "text-sm opacity-80" : "text-sm text-slate-400"
          }
        >
          Levensduur
        </p>
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
