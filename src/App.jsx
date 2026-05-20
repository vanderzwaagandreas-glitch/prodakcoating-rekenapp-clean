import React, { useMemo, useState } from "react";
import jsPDF from "jspdf";
import emailjs from "@emailjs/browser";
import oudDakFoto from "./w1.png";
import nieuwDakFoto from "./w2.png";
import frontDakFoto from "./Front2.png";

export default function ProDakcoatingRekenApp() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    roofArea: 0, // Standaard leeg/0 om schrikreactie te voorkomen
    panels: 0,   // Standaard 0
    electricityPrice: 0.28,
    hasAirco: "yes",
    coatingColor: "wit",
    customerType: "bedrijf",
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    maintenance: "onderhoud",
    // Velden voor de Online Dak-Scan:
    substrate: "bitumen",
    challengeCrack: false,
    challengeWater: false,
    challengeLeak: false,
    challengeHeat: false,
  });

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  const euro = (v) =>
    new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v || 0);

  const number = (v) =>
    new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 }).format(v || 0);

  const result = useMemo(() => {
    const area = Number(form.roofArea) || 0;
    const panels = Math.max(0, Number(form.panels) || 0);
    const price = Number(form.electricityPrice) || 0;

    let pricePerM2 = 0;
    const minimumAreaReached = area >= 80;

    if (minimumAreaReached) {
      if (area >= 500) pricePerM2 = 21.5;
      else if (area >= 101) pricePerM2 = 26.5;
      else pricePerM2 = 35;
    }

    const excl = area * pricePerM2;
    const vatRate = form.customerType === "particulier" ? 0.09 : 0.21;
    const vat = excl * vatRate;
    const incl = excl + vat;

    const oldTemp = 80;
    const newTemp =
      form.coatingColor === "wit"
        ? 40
        : form.coatingColor === "7047"
        ? 62
        : form.coatingColor === "7040"
        ? 67
        : 72;
    const tempDiff = oldTemp - newTemp;

    const yearlyPanelKwh = 350;
    const basePv = panels * yearlyPanelKwh;
    const pvGainPercent =
      form.coatingColor === "wit"
        ? 0.07
        : form.coatingColor === "7047"
        ? 0.015
        : form.coatingColor === "7040"
        ? 0.01
        : 0.005;
    const pvGainKwh = basePv * pvGainPercent;
    const pvGainEuro = pvGainKwh * price;

    const aircoKwh = form.hasAirco === "yes" ? area * 0.8 : 0;
    const aircoEuro = aircoKwh * price;
    const yearlyBenefit = pvGainEuro + aircoEuro;

    let maintenancePricePerM2 = 0;
    if (area >= 500) maintenancePricePerM2 = 3;
    else if (area >= 101) maintenancePricePerM2 = 4;
    else if (area >= 80) maintenancePricePerM2 = 5;

    const yearlyMaintenanceCost = area * maintenancePricePerM2;

    const oneComponentMinPricePerM2 = area >= 500 ? 30 : 40;
    const oneComponentMaxPricePerM2 = area >= 500 ? 30 : 50;
    const oneComponentMinTotal = area * oneComponentMinPricePerM2;
    const oneComponentMaxTotal = area * oneComponentMaxPricePerM2;

    const bitumenMinPricePerM2 = 75;
    const bitumenMaxPricePerM2 = 160;
    const bitumenMinTotal = area * bitumenMinPricePerM2;
    const bitumenMaxTotal = area * bitumenMaxPricePerM2;

    const oneComponentDifferenceMin = oneComponentMinTotal - excl;
    const oneComponentDifferenceMax = oneComponentMaxTotal - excl;
    const bitumenDifferenceMin = bitumenMinTotal - excl;
    const bitumenDifferenceMax = bitumenMaxTotal - excl;

    const payback = yearlyBenefit > 0 ? incl / yearlyBenefit : 0;

    return {
      minimumAreaReached,
      area,
      pricePerM2,
      excl,
      vatRate,
      vat,
      incl,
      oldTemp,
      newTemp,
      tempDiff,
      basePv,
      pvGainKwh,
      pvGainEuro,
      aircoKwh,
      aircoEuro,
      yearlyBenefit,
      payback,
      maintenancePricePerM2,
      yearlyMaintenanceCost,
      oneComponentMinPricePerM2,
      oneComponentMaxPricePerM2,
      oneComponentMinTotal,
      oneComponentMaxTotal,
      bitumenMinTotal,
      bitumenMaxTotal,
      oneComponentDifferenceMin,
      oneComponentDifferenceMax,
      bitumenDifferenceMin,
      bitumenDifferenceMax,
    };
  }, [form]);

  function submitForm() {
    if (!form.name || !form.email || !form.phone) {
      alert("Vul a.u.b. uw naam, e-mailadres en telefoonnummer in.");
      return;
    }

    const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailCheck.test(form.email)) {
      alert("Vul a.u.b. een geldig e-mailadres in (bijv. info@bedrijf.nl).");
      return;
    }

    const cleanPhone = form.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      alert("Vul a.u.b. een geldig telefoonnummer in van minimaal 10 cijfers.");
      return;
    }

    const gekozenKlachten = [
      form.challengeCrack ? "Verouderd / Haarscheurtjes" : "",
      form.challengeWater ? "Stilstaand water" : "",
      form.challengeLeak ? "Lekkage of zwakke plekken" : "",
      form.challengeHeat ? "Binnenklimaat te warm" : "",
    ].filter(Boolean).join(", ") || "Geen specifieke klachten";

    emailjs
      .send(
        "service_f98h5ib",
        "template_9usnbpb",
        {
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          roofarea: `${number(result.area)} m²`,
          color:
            form.coatingColor === "wit"
              ? "Wit"
              : form.coatingColor === "7047"
              ? "RAL 7047"
              : form.coatingColor === "7040"
              ? "RAL 7040"
              : "RAL 7042",
          maintenance:
            form.maintenance === "onderhoud"
              ? "Onderhoud + reiniging"
              : "Dakinspectie",
          message: `Ondergrond: ${form.substrate}\nDak-scan kenmerken: ${gekozenKlachten}\n\nOpmerking: ${form.notes}`,
        },
        "znaYMMFGl6KUB2SmO"
      )
      .then(() => {
        setSubmitted(true);
        setStep(6);
      })
      .catch((error) => {
        console.error("EmailJS fout:", error);
        alert("Er ging iets mis met het verzenden van de aanvraag.");
      });
  }

  function downloadPdf() {
    if (!result.area || result.area <= 0) {
      alert("Vul a.u.b. eerst de afmetingen van uw dak in bij Stap 2.");
      return; 
    }

    if (!form.name || !form.email || !form.phone) {
      alert("Vul a.u.b. eerst uw naam, e-mailadres en telefoonnummer in bij Stap 5 voordat u de PDF kunt downloaden.");
      return;
    }

    const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailCheck.test(form.email)) {
      alert("Vul a.u.b. een geldig e-mailadres in bij Stap 5 (bijv. info@bedrijf.nl).");
      return;
    }

    const cleanPhone = form.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      alert("Vul a.u.b. een geldig telefoonnummer in bij Stap 5 van minimaal 10 cijfers.");
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("ProDakcoating - Samenvatting", 20, 20);

    doc.setFontSize(12);
    doc.text(`Type ondergrond: ${form.substrate.toUpperCase()}`, 20, 35);
    doc.text(`Dakoppervlak: ${number(result.area)} m²`, 20, 45);
    doc.text(
      `Kleur coating: ${
        form.coatingColor === "wit"
          ? "Wit"
          : form.coatingColor === "7047"
          ? "RAL 7047"
          : form.coatingColor === "7040"
          ? "RAL 7040"
          : "RAL 7042"
      }`,
      20,
      55
    );

    doc.text(`Totaal incl. btw: ${result.minimumAreaReached ? euro(result.incl) : "Maatwerkofferte"}`, 20, 65);
    doc.text(`Temperatuurverschil: -${result.tempDiff}°C`, 20, 75);
    doc.text(`Extra PV-opbrengst: ${number(result.pvGainKwh)} kWh/jaar`, 20, 85);
    doc.text(`Voordeel zonnepanelen: ${euro(result.pvGainEuro)}`, 20, 95);
    doc.text(`Airco-besparing: ${euro(result.aircoEuro)}`, 20, 100);
    doc.text(`Totaal voordeel per jaar: ${euro(result.yearlyBenefit)}`, 20, 110);

    doc.text(
      `Gekozen dienst: ${
        form.maintenance === "onderhoud" ? "Onderhoud + reiniging" : "Dakinspectie"
      }`,
      20,
      120
    );

    if (form.maintenance === "onderhoud") {
      doc.text(`Onderhoudskosten: ${euro(result.yearlyMaintenanceCost)} per onderhoudsbeurt`, 20, 135);
    }

    doc.setFontSize(10);
    doc.text("Indicatieve berekening van ProDakcoating.", 20, 270);

    doc.save("ProDakcoating-samenvatting.pdf");
  }

  const steps = ["Dak-scan", "Berekening", "Temperatuur", "Zonnepanelen & airco", "Inspectie & contact", "Samenvatting"];

  const substrateLabels = {
    bitumen: "Bitumen (Teer)",
    epdm: "EPDM (Rubber)",
    pvc: "PVC (Kunststof)",
    beton: "Beton",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans pb-36">
      <div className="max-w-4xl mx-auto">
        <section className="rounded-3xl bg-slate-900 border border-white/10 p-6 mb-5 shadow-xl">
          <p className="text-cyan-300 text-sm font-bold uppercase tracking-widest">ProDakcoating</p>
          <h1 className="text-3xl md:text-5xl font-black mt-2">CoolShield Rekenapp</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">
            Bereken direct de richtprijs van CoolShield NextGen 2K, vergelijk temperaturen en ontdek het voordeel voor zonnepanelen, energiekosten en levensduur van uw dak.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">Geen sloopwerk</p>
              <p className="font-black text-lg mt-1">Tot 70% goedkoper</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">Reflecterende coating</p>
              <p className="font-black text-lg mt-1">Dak tot 40°C koeler</p>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-400 font-bold">Professioneel systeem</p>
              <p className="font-black text-lg mt-1">10 jaar garantie</p>
            </div>
          </div>
          
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-white text-slate-950 p-5 shadow-xl">
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Totale levensduur</p>
              <p className="text-4xl font-black mt-2">30-60 jaar</p>
              <p className="mt-2 text-sm text-slate-600">2-componenten silicone systeem</p>
            </div>

            <div className="rounded-3xl bg-cyan-400 text-slate-950 p-5 shadow-xl">
              <p className="text-sm font-bold uppercase tracking-wide">Reflectiewaarde wit</p>
              <p className="text-4xl font-black mt-2">TSR 90%</p>
              <p className="mt-2 text-sm font-semibold">Sterke reductie van daktemperatuur</p>
            </div>

            {/* HIERONDER WORDT DE PRIJS IN STAP 1 VERBORGEN OM AFSCHRIKKEN TE VOORKOMEN */}
            <div className="rounded-3xl bg-white text-slate-950 p-5 shadow-xl">
              {step === 1 ? (
                <>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Prijsindicatie</p>
                  <p className="text-xl font-black mt-2 text-cyan-600">Berekend na de scan</p>
                  <p className="mt-2 text-sm text-slate-600">Zie volgende stap</p>
                </>
              ) : result.minimumAreaReached ? (
                <>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Indicatie totaal incl. btw</p>
                  <p className="text-3xl font-black mt-2">{euro(result.incl)}</p>
                  <p className="mt-2 text-sm text-slate-600">Inclusief professionele applicatie</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Dak kleiner dan 80 m²</p>
                  <p className="text-2xl font-black mt-2">Offerte aanvragen</p>
                  <p className="mt-2 text-sm text-slate-600">Maatwerkofferte op aanvraag</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 rounded-3xl overflow-hidden border border-cyan-400/20 relative h-[260px] md:h-[340px] shadow-2xl">
            <img
              src={frontDakFoto} 
              alt="Cool roof coating" 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-cyan-950/40"></div>

            <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-8">
              <div className="max-w-2xl">
                <p className="text-cyan-300 font-bold uppercase tracking-[0.2em] text-sm">Cool Roof Technologie • Silicone Dakcoating</p>
                <h2 className="text-3xl md:text-5xl font-black mt-3 leading-tight">
                  Verleng de levensduur van uw platte dak zonder vervanging
                </h2>
                <p className="text-slate-200 mt-4 text-base md:text-lg">
                  Reflecterend, waterdicht en ontwikkeld voor renovatie van bitumen, EPDM en PVC daken. Geschikt voor woningen, bedrijfspanden en grote utiliteitsdaken.
                </p>
              </div>
            </div>
          </div>
        </section>

        <nav className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index + 1)}
              className={
                step === index + 1
                  ? "rounded-2xl p-2 text-xs md:p-3 bg-cyan-400 text-slate-950 font-black transition-all"
                  : "rounded-2xl p-2 text-xs md:p-3 bg-white/10 text-slate-300 font-bold border border-white/10 transition-all"
              }
            >
              {index + 1}. {label}
            </button>
          ))}
        </nav>

        <main className="rounded-3xl bg-slate-900 border border-white/10 p-6 md:p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-cyan-400 text-slate-950 px-5 py-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">Geselecteerd dakoppervlak</p>
              <p className="text-4xl font-black mt-1">{number(result.area)} m²</p>
            </div>

            <div className="text-right flex items-center gap-4">
              {/* TAALFOUT GECORRIGEERD NAAR 'Ondergrond' */}
              <div>
                <p className="text-sm font-semibold">Ondergrond</p>
                <p className="text-lg font-black">{substrateLabels[form.substrate] || "Bitumen"}</p>
              </div>

              {step !== 1 && (
                <div>
                  <p className="text-sm font-semibold">CoolShield NextGen 2K</p>
                  <p className="text-lg font-black">{result.minimumAreaReached ? `${euro(result.pricePerM2)}/m²` : "Maatwerk"}</p>
                </div>
              )}

              <div className="flex items-center gap-2 bg-white/40 rounded-2xl px-3 py-2">
                <div
                  className="w-6 h-6 rounded-full border border-black/20"
                  style={{
                    backgroundColor:
                      form.coatingColor === "wit"
                        ? "#ffffff"
                        : form.coatingColor === "7047"
                        ? "#cfd3d6"
                        : form.coatingColor === "7040"
                        ? "#8c9297"
                        : "#4f5358",
                  }}
                />

                <div className="text-left">
                  <p className="text-xs font-bold uppercase">Kleur</p>
                  <p className="text-sm font-black">
                    {form.coatingColor === "wit"
                      ? "Wit"
                      : form.coatingColor === "7047"
                      ? "RAL 7047"
                      : form.coatingColor === "7040"
                      ? "RAL 7040"
                      : "RAL 7042"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* STAP 1: INTERACTIEVE ONLINE DAK-SCAN MET ADVIESTEKSTEN & LEKKAGE-CHECK */}
          {step === 1 && (
            <div className="fade-in-stap space-y-6">
              <Title title="1. Online Dak-Scan" text="Beoordeel de huidige staat van uw dakbedekking direct online voor een advies op maat." />
              
              <div>
                <span className="text-sm font-bold text-slate-300 block mb-3">Wat is de huidige ondergrond van uw platte dak?</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(substrateLabels).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update("substrate", key)}
                      className={
                        form.substrate === key
                          ? "rounded-2xl p-4 text-center font-black bg-cyan-400 text-slate-950 border-2 border-cyan-300 transition-all"
                          : "rounded-2xl p-4 text-center font-bold bg-white/5 hover:bg-white/10 text-white border-2 border-white/10 transition-all"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
                
                {/* INTERACTIEVE ADVIESTEKSTEN LIVE OP BASIS VAN KEUZE */}
                <p className="mt-3 text-xs text-cyan-300 font-semibold bg-cyan-950/40 border border-cyan-800/20 rounded-xl p-3">
                  {form.substrate === "bitumen" && (
                    <span>💡 <strong>Ideaal fundament!</strong> Onze ademende CoolShield NextGen 2K siliconen-coating vloeit perfect in verouderde bitumen toplagen en vult haarscheurtjes volledig op. Dit vormt een 100% naadloos membraan zonder dat er open vuur of sloopwerk aan te pas komt.</span>
                  )}
                  {form.substrate === "epdm" && (
                    <span>💡 <strong>Perfecte match!</strong> Dankzij de extreme elasticiteit van <strong>250%</strong> beweegt de siliconencoating moeiteloos mee met de sterke thermische werking en temperatuurverschillen van EPDM. Een speciale primer garandeert hierbij een onverwoestbare moleculaire verbinding.</span>
                  )}
                  {form.substrate === "pvc" && (
                    <span>💡 <strong>Maximale bescherming!</strong> Kunststof daken worden door jarenlange uv-straling poreus, met scheurvorming tot gevolg. Onze coating is <strong>100% uv- en weersbestendig</strong>, stopt deze veroudering direct en herstelt de flexibiliteit van uw PVC.</span>
                  )}
                  {form.substrate === "beton" && (
                    <span>💡 <strong>Unieke dampopen werking!</strong> Beton kan makkelijk vocht vasthouden. Onze coating is <strong>100% hydrofoob</strong> (waterafstotend) maar blijft ademend. Eventueel restvocht in de constructie kan wel naar buiten verdampen, maar regenwater kan absoluut niet naar binnen.</span>
                  )}
                </p>
              </div>

              <div className="border-t border-white/10 pt-5">
                <span className="text-sm font-bold text-slate-300 block mb-3">Welke uitdagingen of klachten herkent u bij uw dak? (Meerdere opties mogelijk)</span>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={form.challengeCrack}
                      onChange={(e) => update("challengeCrack", e.target.checked)}
                      className="w-5 h-5 rounded accent-cyan-400"
                    />
                    <div>
                      <p className="font-bold">Het dak is verouderd of vertoont haarscheurtjes</p>
                      <p className="text-xs text-slate-400">Ideaal fundament voor directe renovatie zonder dure sloopkosten.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={form.challengeWater}
                      onChange={(e) => update("challengeWater", e.target.checked)}
                      className="w-5 h-5 rounded accent-cyan-400"
                    />
                    <div>
                      <p className="font-bold">Er blijft regelmatig stilstaand water op het dak liggen</p>
                      <p className="text-xs text-slate-400">Onze 2K coating is extreem goed bestand tegen permanente waterbelasting en microbiologische invloeden (ASTM D4012).</p>
                    </div>
                  </label>

                  {/* DE NIEUWE LEKKAGE OPTIE */}
                  <label className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={form.challengeLeak}
                      onChange={(e) => update("challengeLeak", e.target.checked)}
                      className="w-5 h-5 rounded accent-cyan-400"
                    />
                    <div>
                      <p className="font-bold">Er is momenteel sprake van lekkage(s) of zwakke plekken</p>
                      <p className="text-xs text-slate-400">Lekkages en doorvoeren worden tijdens de voorbereiding (Fase 2) extra verstevigd met specifieke glasvezelbewapening voor 100% waterdichte zekerheid.</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      checked={form.challengeHeat}
                      onChange={(e) => update("challengeHeat", e.target.checked)}
                      className="w-5 h-5 rounded accent-cyan-400"
                    />
                    <div>
                      <p className="font-bold">Het binnenklimaat in het gebouw wordt in de zomer veel te warm</p>
                      <p className="text-xs text-slate-400">De witte variant weerkaatst 90% van het zonlicht, waardoor de binnentemperatuur drastisch daalt.</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* GROTE GROENE WHATSAPP VERWIJZING */}
              <div className="border-t border-white/10 pt-5">
                <span className="text-sm font-bold text-slate-300 block mb-2">Foto van uw dak doorsturen (Aanbevolen)</span>
                <a
                  href="https://wa.me/31621694200?text=Hallo%20ProDakcoating%2C%20ik%20heb%20zojuist%20de%20calculator%20ingevuld%20en%20stuur%20hierbij%20een%20foto%20van%20mijn%20dak."
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-6 bg-emerald-500/5 text-center transition-all group cursor-pointer"
                >
                  <span className="text-3xl mb-1">💬</span>
                  <span className="text-base font-black text-emerald-400 group-hover:text-emerald-300 transition-colors">Stuur foto('s) direct via WhatsApp</span>
                  <span className="text-xs text-slate-400 mt-2 max-w-md">
                    Klik hier om direct een chat te openen. Onze specialisten controleren de huidige laag gratis op afstand op hechting en eventuele vochtinsluiting.
                  </span>
                </a>
              </div>
            </div>
          )}

          {/* STAP 2: BEREKENING (HERNOEMD VAN KOSTEN) */}
          {step === 2 && (
            <div className="fade-in-stap">
              <Title title="2. Kosten dakcoating berekenen" text="Vul het dakoppervlak in en zie direct de richtprijs." />
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Dakoppervlak in m²" type="number" value={form.roofArea || ""} onChange={(v) => update("roofArea", v)} />
                <Select 
                  label="Btw type" 
                  value={form.customerType} 
                  onChange={(v) => update("customerType", v)} 
                  options={[["bedrijf", "Bedrijf / 21% btw"], ["particulier", "Particulier / 9% btw"]]} 
                />
                <Select 
                  label="Kleur coating" 
                  value={form.coatingColor} 
                  onChange={(v) => update("coatingColor", v)} 
                  options={[["wit", "Wit - maximale reflectie"], ["7047", "RAL 7047 - Telegrijs 4"], ["7040", "RAL 7040 - Venstergrijs"], ["7042", "RAL 7042 - Verkeersgrijs A"]]} 
                  showColorCircle={true} 
                />
              </div>
              {result.minimumAreaReached ? (
                <Grid items={[
                  ["Tarief CoolShield 2K per m²", euro(result.pricePerM2)],
                  ["Totaal excl. btw", euro(result.excl)],
                  [`Btw ${Math.round(result.vatRate * 100)}%`, euro(result.vat)],
                  ["Totaal incl. btw", euro(result.incl)],
                ]} />
              ) : (
                <div className="mt-6 rounded-3xl bg-amber-400 text-slate-950 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide">Offerte aanvraag</p>
                  <h3 className="text-3xl font-black mt-2">Dakoppervlak kleiner dan 80 m²</h3>
                  <p className="mt-3 text-lg">
                    Voor kleinere oppervlaktes maken wij graag een maatwerkofferte.
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-3xl bg-green-500/15 border border-green-400/20 p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-green-300 font-bold">Besparing</p>
                    <h3 className="text-3xl font-black mt-1">Tot 70% goedkoper dan dakvervanging</h3>
                    <p className="text-slate-300 mt-2">Geen sloopwerkzaamheden, minimale overlast en behoud van bestaande dakbedekking.</p>
                  </div>
                </div>
              </div>

              {/* LIVE PRIJSVERGELIJKING MET M2 EN TOTAALPRIJZEN ONDER ELKAAR */}
              <div className="mt-8">
                <h3 className="text-2xl font-black mb-4">Prijsvergelijking &amp; levensduur</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <CompareCard
                    title="CoolShield 2K"
                    subtitle="Professioneel systeem"
                    price={`${euro(result.pricePerM2)}/m²`}
                    totalPrice={result.area > 0 ? (result.minimumAreaReached ? euro(result.excl) : "Maatwerkofferte") : "Vul m² in voor totaalprijs"}
                    lifespan="30-60 jaar"
                    highlight
                  />

                  <CompareCard
                    title="1-component coating"
                    subtitle="Consumenten coating"
                    price={result.area >= 500 ? "± €30/m²" : "€40 - €50/m²"}
                    totalPrice={result.area > 0 ? (result.area >= 500 ? euro(result.oneComponentMinTotal) : `${euro(result.oneComponentMinTotal)} - ${euro(result.oneComponentMaxTotal)}`) : "Vul m² in voor totaalprijs"}
                    lifespan="20-25 jaar"
                  />

                  <CompareCard
                    title="Nieuw bitumen dak"
                    subtitle="Traditionele vervanging"
                    price="€75 - €160/m²"
                    totalPrice={result.area > 0 ? `${euro(result.bitumenMinTotal)} - ${euro(result.bitumenMaxTotal)}` : "Vul m² in voor totaalprijs"}
                    lifespan="20-30 jaar"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STAP 3: TEMPERATUUR */}
          {step === 3 && (
            <div className="fade-in-stap">
              <Title title="3. Temperatuurvergelijking" text="Indicatieve vergelijking: wit geeft het sterkste verkoelende effect. Grijstinten zijn vooral esthetisch en worden terughoudend berekend." />
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl">
                <div className="grid md:grid-cols-2 min-h-[420px]">
                  
                  <div className="relative overflow-hidden flex flex-col justify-between p-6">
                    <img src={oudDakFoto} alt="Oud bitumen dak" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60"></div>

                    <div className="relative z-10">
                      <p className="text-white font-black uppercase tracking-wide text-sm">VEROUDERD ZWART BITUMEN</p>
                      <h3 className="text-4xl md:text-5xl font-black text-white mt-4 leading-tight">
                        Warmte geabsorbeerd
                      </h3>
                    </div>

                    <div className="relative z-10 rounded-3xl border border-red-500/40 bg-black/80 p-5 max-w-[260px] mt-8">
                      <p className="text-sm uppercase tracking-wide text-slate-300">Oppervlaktetemperatuur</p>
                      <p className="text-6xl font-black text-red-400 mt-3">80°C</p>
                    </div>
                  </div>

                  <div className="relative overflow-hidden flex flex-col justify-between p-6">
                    <img src={nieuwDakFoto} alt="Nieuw gecoat dak" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-white/60"></div>

                    <div className="relative z-10 text-right">
                      <p className="text-slate-800 font-black uppercase tracking-wide text-sm">COOLSHIELD NEXTGEN 2K</p>
                      <h3 className="text-4xl md:text-5xl font-black text-slate-950 mt-4 leading-tight">
                        Zonlicht teruggekaatst
                      </h3>
                    </div>

                    <div className="relative z-10 rounded-3xl border border-cyan-400 bg-white/90 p-5 max-w-[260px] ml-auto mt-8">
                      <p className="text-sm uppercase tracking-wide text-slate-500">Oppervlaktetemperatuur</p>
                      <p className="text-6xl font-black text-cyan-500 mt-3">40°C</p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="mt-5 rounded-3xl bg-cyan-400 text-slate-950 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide font-bold">Wilt u echt het verschil zien?</p>
                  <h3 className="text-2xl md:text-3xl font-black mt-1">Bekijk de mogelijkheden op ProDakcoating.nl</h3>
                </div>
                <a
                  href="https://www.prodakcoating.nl/"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-slate-950 text-white px-6 py-4 font-black text-center hover:bg-slate-800 transition-all"
                >
                  Naar website
                </a>
              </div>

              <div className="mt-5 rounded-3xl bg-white/10 border border-white/10 p-6">
                <div className="grid md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-slate-400 uppercase font-bold">Oud zwart dak</p>
                    <p className="text-5xl font-black text-red-400 mt-2">{result.oldTemp}°C</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 uppercase font-bold">Nieuw gecoat dak</p>
                    <p className="text-5xl font-black text-cyan-300 mt-2">{result.newTemp}°C</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 uppercase font-bold">Temperatuurverschil</p>
                    <p className="text-5xl font-black text-green-400 mt-2">-{result.tempDiff}°C</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 grid md:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-white/10 border border-white/10 p-6">
                  <p className="text-xl font-black">De witte variant is de echte cool-roof keuze met het grootste verkoelende effect.</p>
                  <p className="text-slate-300 mt-3">Grijstinten kunnen iets gunstiger zijn dan zwart bitumen, maar dit effect is bewust conservatief berekend.</p>
                </div>

                <div className="rounded-3xl bg-white/10 border border-white/10 p-6">
                  <ul className="space-y-3 text-slate-200 font-semibold">
                    <li>✓ Minder warmte in het gebouw</li>
                    <li>✓ Lagere energiekosten</li>
                    <li>✓ Langere levensduur van dak en installaties</li>
                    <li>✓ Comfortabeler binnenklimaat</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STAP 4: ZONNEPANELEN &amp; AIRCO */}
          {step === 4 && (
            <div className="fade-in-stap space-y-6">
              <Title title="4. Voordeel zonnepanelen en airco" text="Indicatieve berekening op basis van een gekoeld dakoppervlak." />
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Aantal zonnepanelen" type="number" value={form.panels || ""} onChange={(v) => update("panels", v)} />
                <Input label="Stroomprijs €/kWh" type="number" step="0.01" value={form.electricityPrice} onChange={(v) => update("electricityPrice", v)} />
                <Select 
                  label="Airco aanwezig?" 
                  value={form.hasAirco} 
                  onChange={(v) => update("hasAirco", v)} 
                  options={[["yes", "Ja"], ["no", "Nee"]]} 
                />
              </div>

              {Number(form.panels) > 0 && (
                <div className="rounded-3xl bg-cyan-500/10 border border-cyan-400/30 p-5 flex items-start gap-4 fade-in-stap">
                  <span className="text-3xl">💡</span>
                  <div>
                    <h4 className="text-xl font-black text-cyan-300">Belangrijk rendementseffect voor uw zonnepanelen:</h4>
                    <p className="text-sm text-slate-200 mt-2 leading-relaxed">
                      Zonnepanelen presteren aanzienlijk minder zodra ze extreem warm worden. Een standaard zwart dak wordt in de zomer wel <span className="text-red-400 font-bold">80°C</span>. 
                      Met onze witte CoolShield coating blijft uw dakoppervlak <span className="text-cyan-300 font-bold">onder de 40°C</span>.
                    </p>
                    <p className="text-sm text-slate-200 mt-2 font-bold">
                      Deze sterke temperatuurdaling verhoogt de jaarlijkse stroomopbrengst direct:
                    </p>
                    <ul className="list-disc list-inside text-sm text-slate-300 mt-1 space-y-1">
                      <li>🚀 <span className="text-emerald-400 font-bold">+7% extra stroomopbrengst</span> bij standaard Monopanelen</li>
                      <li>☀️ <span className="text-emerald-400 font-bold">+15% extra stroomopbrengst</span> bij Bifacial (tweezijdige) panelen</li>
                    </ul>
                  </div>
                </div>
              )}

              <Grid items={[
                ["Basisopbrengst PV", `${number(result.basePv)} kWh/jaar`],
                ["Extra PV-opbrengst", `${number(result.pvGainKwh)} kWh/jaar`],
                ["Voordeel zonnepanelen", euro(result.pvGainEuro)],
                ["Airco-besparing", euro(result.aircoEuro)],
                ["Totaal voordeel per jaar", euro(result.yearlyBenefit)],
                ["Indicatieve terugverdientijd", result.payback ? `${result.payback.toFixed(1)} jaar` : "n.v.t."],
              ]} />
            </div>
          )}

          {/* STAP 5: INSPECTIE &amp; ONDERHOUD */}
          {step === 5 && (
            <div className="fade-in-stap">
              <Title title="5. Inspectie &amp; onderhoud" text="Vraag eenvoudig een dakinspectie of onderhoud aan. Ook geschikt voor bestaande bitumen daken." />

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Choice
                  active={form.maintenance === "inspectie"}
                  onClick={() => update("maintenance", "inspectie")}
                  title="Dakinspectie"
                  text="Telefonische bevestiging van inspectie en dakbeoordeling."
                />

                <Choice
                  active={form.maintenance === "onderhoud"}
                  onClick={() => update("maintenance", "onderhoud")}
                  title="Onderhoud + reiniging"
                  text="Jaarlijkse inspectie en reiniging met low pressure warm water."
                />
              </div>

              {form.maintenance === "onderhoud" && (
                <div className="rounded-3xl bg-white/10 border border-white/10 p-6 mb-6">
                  <h3 className="text-2xl font-black mb-4">Onderhoudstarieven</h3>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                      <p className="text-sm text-slate-400">80 - 100 m²</p>
                      <p className="text-4xl font-black mt-2">€5</p>
                      <p className="text-sm text-slate-400">per m² excl. btw</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                      <p className="text-sm text-slate-400">101 - 500 m²</p>
                      <p className="text-4xl font-black mt-2">€4</p>
                      <p className="text-sm text-slate-400">per m² excl. btw</p>
                    </div>

                    <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
                      <p className="text-sm text-slate-400">500+ m²</p>
                      <p className="text-4xl font-black mt-2">€3</p>
                      <p className="text-sm text-slate-400">per m² excl. btw</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Naam" value={form.name} onChange={(v) => update("name", v)} />
                <Input label="Telefoonnummer" value={form.phone} onChange={(v) => update("phone", v)} />
                <Input label="E-mailadres" value={form.email} onChange={(v) => update("email", v)} />
                <Input label="Adres / plaats dak" value={form.address} onChange={(v) => update("address", v)} />

                <label className="block md:col-span-2">
                  <span className="text-sm font-bold text-slate-300">Opmerking</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => update("notes", e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-2xl bg-white text-slate-950 p-3 outline-none"
                    placeholder="Bijvoorbeeld lekkage, blazen, onderhoud bestaand bitumen dak, zonnepanelen..."
                  />
                </label>
              </div>

              {form.maintenance === "onderhoud" && result.minimumAreaReached && (
                <div className="mt-5 rounded-3xl bg-cyan-400 text-slate-950 p-6">
                  <p className="text-sm uppercase tracking-wide font-bold">Indicatieve onderhoudskosten</p>
                  <p className="text-5xl font-black mt-2">{euro(result.yearlyMaintenanceCost)}</p>
                  <p className="mt-2 font-semibold">per onderhoudsbeurt excl. btw</p>
                </div>
              )}

              <div className="mt-5 rounded-2xl bg-white/10 border border-white/10 p-4 text-slate-200">
                Na aanvraag nemen wij telefonisch contact op om het dak, de bereikbaarheid en een geschikt moment te bespreken.
              </div>

              <button
                type="button"
                onClick={submitForm}
                className="mt-5 w-full rounded-3xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xl py-5 transition-all"
              >
                Aanvraag verzenden
              </button>

              {submitted && (
                <div className="mt-5 rounded-3xl bg-green-500/15 border border-green-400/20 p-6">
                  <p className="text-sm uppercase tracking-wide text-green-300 font-bold">Aanvraag ontvangen</p>
                  <h3 className="text-3xl font-black mt-2">Bedankt voor uw aanvraag.</h3>
                  <p className="text-slate-300 mt-3">
                    Amarens van der Zwaag neemt telefonisch of per e-mail contact met u op voor de verdere bespreking.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STAP 6: SAMENVATTING */}
          {step === 6 && (
            <div className="fade-in-stap">
              <Title title="6. Samenvatting" text="Overzicht van uw gekozen dakcoating, kostenindicatie, temperatuurverschil en mogelijke voordelen." />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-3xl bg-cyan-400 text-slate-950 p-6">
                  <p className="text-sm font-bold uppercase tracking-wide">Gekozen systeem</p>
                  <h3 className="text-3xl font-black mt-2">CoolShield NextGen 2K</h3>
                  <p className="mt-3 font-semibold">
                    {form.coatingColor === "wit"
                      ? "Wit - maximale reflectie"
                      : form.coatingColor === "7047"
                      ? "RAL 7047 - Telegrijs 4"
                      : form.coatingColor === "7040"
                      ? "RAL 7040 - Venstergrijs"
                      : "RAL 7042 - Verkeersgrijs A"}
                  </p>
                </div>

                <div className="rounded-3xl bg-white/10 border border-white/10 p-6">
                  <p className="text-sm text-slate-400 uppercase font-bold">Dakoppervlak &amp; Type</p>
                  <p className="text-5xl font-black mt-2">{number(result.area)} m²</p>
                  <p className="text-slate-300 mt-3">Ondergrond: {substrateLabels[form.substrate]}</p>
                </div>
              </div>

              <Grid items={[
                ["Totaal excl. btw", result.minimumAreaReached ? euro(result.excl) : "Offerte aanvragen"],
                [`Btw ${Math.round(result.vatRate * 100)}%`, result.minimumAreaReached ? euro(result.vat) : "n.v.t."],
                ["Totaal incl. btw", result.minimumAreaReached ? euro(result.incl) : "Maatwerk"],
                ["Temperatuurverschil", `-${result.tempDiff}°C indicatief`],
                ["Extra PV-opbrengst", `${number(result.pvGainKwh)} kWh/jaar`],
                ["Voordeel zonnepanelen", euro(result.pvGainEuro)],
                ["Airco-besparing", euro(result.aircoEuro)],
                ["Totaal voordeel per jaar", euro(result.yearlyBenefit)],
              ]} />

              {form.maintenance === "onderhoud" && result.minimumAreaReached && (
                <div className="mt-6 rounded-3xl bg-white/10 border border-white/10 p-6">
                  <p className="text-sm text-slate-400 uppercase font-bold">Gekozen extra dienst</p>
                  <h3 className="text-2xl font-black mt-2">Onderhoud + reiniging</h3>
                  <p className="text-slate-300 mt-2">Jaarlijkse inspectie en reiniging met low pressure warm water.</p>
                  <p className="text-4xl font-black mt-4">{euro(result.yearlyMaintenanceCost)}</p>
                  <p className="text-slate-400">per onderhoudsbeurt excl. btw</p>
                </div>
              )}

              {form.maintenance === "inspectie" && (
                <div className="mt-6 rounded-3xl bg-white/10 border border-white/10 p-6">
                  <p className="text-sm text-slate-400 uppercase font-bold">Gekozen extra dienst</p>
                  <h3 className="text-2xl font-black mt-2">Dakinspectie</h3>
                  <p className="text-slate-300 mt-2">ProDakcoating neemt contact op om de inspectie telefonisch te bevestigen.</p>
                </div>
              )}

              {/* PRIJSVERGELIJKING SAMENVATTING MET BEIDE PRIJZEN LIVE BEREKEND */}
              <div className="mt-6 rounded-3xl bg-white/10 border border-white/10 p-6">
                <p className="text-sm uppercase tracking-wide text-slate-400 font-bold">Prijsverschil op basis van {number(result.area)} m²</p>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="rounded-2xl bg-cyan-400 text-slate-950 p-4">
                    <p className="text-xs font-bold uppercase">CoolShield 2K</p>
                    <p className="text-xl font-bold mt-1">{result.minimumAreaReached ? `${euro(result.pricePerM2)}/m²` : "Maatwerk"}</p>
                    <p className="text-2xl font-black mt-1">{result.area > 0 ? (result.minimumAreaReached ? euro(result.excl) : "Maatwerk") : "Vul m² in"}</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">1-component coating</p>
                    <p className="text-xl font-bold mt-1">{result.area >= 500 ? "± €30/m²" : "€40 - €50/m²"}</p>
                    <p className="text-2xl font-black mt-1">
                      {result.area > 0
                        ? (result.area >= 500
                            ? euro(result.oneComponentMinTotal)
                            : `${euro(result.oneComponentMinTotal)} - ${euro(result.oneComponentMaxTotal)}`)
                        : "Vul m² in"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">Nieuw bitumen dak</p>
                    <p className="text-xl font-bold mt-1">€75 - €160/m²</p>
                    <p className="text-2xl font-black mt-1">
                      {result.area > 0 ? `${euro(result.bitumenMinTotal)} - ${euro(result.bitumenMaxTotal)}` : "Vul m² in"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={downloadPdf}
                  className="rounded-3xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xl py-5 px-6 transition-all"
                >
                  Download PDF samenvatting
                </button>

                <div className="rounded-3xl bg-green-500/15 border border-green-400/20 p-6">
                  <p className="text-sm uppercase tracking-wide text-green-300 font-bold">Volgende stap</p>
                  <h3 className="text-3xl font-black mt-2">Aanvraag controleren en verzenden</h3>
                  <p className="text-slate-300 mt-3">Ga hierboven naar pagina 5 om uw gegevens in te vullen of de aanvraag direct te verzenden.</p>
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="flex justify-between mt-5">
          <button type="button" disabled={step === 1} onClick={() => setStep(step - 1)} className="rounded-2xl px-5 py-3 bg-white/10 disabled:opacity-30 font-bold">Vorige</button>
          <button type="button" disabled={step === 6} onClick={() => setStep(Math.min(6, step + 1))} className="rounded-2xl px-5 py-3 bg-cyan-400 text-slate-950 disabled:opacity-30 font-black">Volgende</button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Let op: dit is een indicatieve berekening. Definitieve prijs en technische geschiktheid worden bepaald na dakinspectie.
        </p>
      </div>

      {/* VERGROTE EN ROBUUSTE TRUST-BALK ONDERIN HET SCHERM (ALTIJD ZICHTBAAR) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-white/10 px-4 py-5 z-50 shadow-2xl transition-all">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="text-2xl md:text-4xl">🛡️</span>
            <div className="text-left">
              <p className="font-extrabold text-white text-xs sm:text-sm md:text-base tracking-wide">10 Jaar Garantie</p>
              <p className="text-[11px] md:text-xs text-slate-400 block mt-0.5">Volledige productzekerheid</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="text-2xl md:text-4xl">⏳</span>
            <div className="text-left">
              <p className="font-extrabold text-white text-xs sm:text-sm md:text-base tracking-wide">30-60 Jaar Levensduur</p>
              <p className="text-[11px] md:text-xs text-slate-400 block mt-0.5">Hoogwaardig 2K silicone</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="text-2xl md:text-4xl">💰</span>
            <div className="text-left">
              <p className="font-extrabold text-white text-xs sm:text-sm md:text-base tracking-wide">Tot 70% Goedkoper</p>
              <p className="text-[11px] md:text-xs text-slate-400 block mt-0.5">Bespaar direct op sloopwerk</p>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="text-2xl md:text-4xl">🔥</span>
            <div className="text-left">
              <p className="font-extrabold text-white text-xs sm:text-sm md:text-base tracking-wide">100% Brandveilig</p>
              <p className="text-[11px] md:text-xs text-slate-400 block mt-0.5">Applicatie zonder open vuur</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

function Title({ title, text }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl md:text-3xl font-black">{title}</h2>
      <p className="text-slate-300 mt-2">{text}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", step }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl bg-white text-slate-950 p-3 outline-none" />
    </label>
  );
}

function Select({ label, value, onChange, options, showColorCircle = false }) {
  const colorMap = {
    wit: "#ffffff",
    7047: "#cfd3d6",
    7040: "#8c9297",
    7042: "#4f5358",
  };

  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">{label}</span>

      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        {options.map(([optionValue, optionLabel]) => (
          <button
            type="button"
            key={optionValue}
            onClick={() => onChange(optionValue)}
            className={
              value === optionValue
                ? "w-full flex items-center justify-between rounded-2xl bg-cyan-400 text-slate-950 p-3 border-2 border-cyan-300"
                : "w-full flex items-center justify-between rounded-2xl bg-white text-slate-950 p-3 border-2 border-transparent"
            }
          >
            <div className="flex items-center gap-3">
              {showColorCircle && (
                <div
                  className="w-7 h-7 rounded-full border border-black/20"
                  style={{ backgroundColor: colorMap[optionValue] || "#ffffff" }}
                />
              )}
              <span className="font-semibold text-left">{optionLabel}</span>
            </div>

            {value === optionValue && (
              <span className="text-sm font-black">ACTIEF</span>
            )}
          </button>
        ))}
      </div>
    </label>
  );
}

function Grid({ items }) {
  return (
    <div className="grid md:grid-cols-2 gap-4 mt-6">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-white/10 border border-white/10 p-5">
          <p className="text-sm text-slate-400">{label}</p>
          <p className="text-2xl font-black mt-1">{value}</p>
        </div>
      ))}
    </div>
  );
}

{/* AANGEPASTE COMPARECARD DIE LIVE REAGEERT OP DE M2 INVOER */}
function CompareCard({ title, subtitle, price, totalPrice, lifespan, highlight }) {
  return (
    <div className={highlight ? "rounded-3xl bg-cyan-400 text-slate-950 p-6 shadow-xl" : "rounded-3xl bg-white/10 border border-white/10 p-6"}>
      <p className="text-sm font-bold opacity-80">{subtitle}</p>
      <h4 className="text-2xl font-black mt-1">{title}</h4>

      <div className="mt-4">
        <p className={highlight ? "text-slate-700 text-xs font-bold" : "text-slate-400 text-xs font-bold"}>Tarief per m²</p>
        <p className="text-xl font-black">{price}</p>
      </div>

      <div className="mt-3">
        <p className={highlight ? "text-slate-700 text-xs font-bold" : "text-slate-400 text-xs font-bold"}>Indicatieve totaalprijs</p>
        <p className="text-2xl font-black text-emerald-400">{totalPrice}</p>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3 opacity-90">
        <p className={highlight ? "text-slate-700 text-xs font-bold" : "text-slate-400 text-xs font-bold"}>Levensduur</p>
        <p className="text-xl font-black">{lifespan}</p>
      </div>
    </div>
  );
}

function Choice({ active, onClick, title, text }) {
  return (
    <button type="button" onClick={onClick} className={active ? "text-left rounded-3xl bg-cyan-400 text-slate-950 p-5" : "text-left rounded-3xl bg-white/10 border border-white/10 p-5"}>
      <p className="text-lg font-black">{title}</p>
      <p className={active ? "text-sm mt-2 text-slate-800" : "text-sm mt-2 text-slate-300"}>{text}</p>
    </button>
  );
}
