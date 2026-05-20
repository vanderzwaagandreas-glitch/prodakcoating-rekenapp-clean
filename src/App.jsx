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
    roofArea: 250,
    panels: 40,
    electricityPrice: 0.28,
    hasAirco: "yes",
    coatingColor: "wit",
    customerType: "bedrijf",
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    maintenance: "onderhoud", // Aangepast van "jaarlijks" naar "onderhoud"
  });

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  // Hulpfuncties en berekeningen (result) naar boven verplaatst voor correcte scoping
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
    // --- STRENGE CONTROLE OP CONTACTGEGEVENS ---
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
    // -------------------------------------------

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
          message: form.notes,
        },
        "znaYMMFGl6KUB2SmO"
      )
      .then(() => {
        setSubmitted(true);
        setStep(5); // <--- DEZE STUURT ZE DIRECT NAAR DE PDF!
    })
    .catch((error) => {
      })
      .catch((error) => {
        console.error("EmailJS fout:", error);
        alert("Er ging iets mis met het verzenden van de aanvraag.");
      });
  }

  function downloadPdf() {
    // 1. Check of het dak überhaupt is ingevuld
    if (!result.area || result.area <= 0) {
      alert("Vul a.u.b. eerst de afmetingen van uw dak in bij Stap 1.");
      return; 
    }

    // 2. Check of de contactgegevens zijn ingevuld
    if (!form.name || !form.email || !form.phone) {
      alert("Vul a.u.b. eerst uw naam, e-mailadres en telefoonnummer in bij Stap 4 voordat u de PDF kunt downloaden.");
      return;
    }

    // 3. Strenge controle op het e-mailadres
    const emailCheck = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailCheck.test(form.email)) {
      alert("Vul a.u.b. een geldig e-mailadres in bij Stap 4 (bijv. info@bedrijf.nl).");
      return;
    }

    // 4. Strenge controle op het telefoonnummer
    const cleanPhone = form.phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 10) {
      alert("Vul a.u.b. een geldig telefoonnummer in bij Stap 4 van minimaal 10 cijfers.");
      return;
    }

    // Pas als alles hierboven klopt, wordt de PDF gemaakt:
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("ProDakcoating - Samenvatting", 20, 20);

    doc.setFontSize(12);
    doc.text(`Dakoppervlak: ${number(result.area)} m²`, 20, 40);
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
      50
    );

    doc.text(`Totaal incl. btw: ${result.minimumAreaReached ? euro(result.incl) : "Maatwerkofferte"}`, 20, 60);
    doc.text(`Temperatuurverschil: -${result.tempDiff}°C`, 20, 70);
    doc.text(`Extra PV-opbrengst: ${number(result.pvGainKwh)} kWh/jaar`, 20, 80);
    doc.text(`Voordeel zonnepanelen: ${euro(result.pvGainEuro)}`, 20, 90);
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

  const steps = ["Kosten", "Temperatuur", "Zonnepanelen & airco", "Inspectie & onderhoud", "Samenvatting"];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans">
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

            <div className="rounded-3xl bg-white text-slate-950 p-5 shadow-xl">
              {result.minimumAreaReached ? (
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

        <nav className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
          {steps.map((label, index) => (
            <button
              key={label}
              onClick={() => setStep(index + 1)}
              className={
                step === index + 1
                  ? "rounded-2xl p-3 bg-cyan-400 text-slate-950 font-black"
                  : "rounded-2xl p-3 bg-white/10 text-slate-300 font-bold border border-white/10"
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
              <div>
                <p className="text-sm font-semibold">CoolShield NextGen 2K</p>
                <p className="text-lg font-black">{euro(result.pricePerM2)}/m²</p>
              </div>

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
          {step === 1 && (
            <div className="fade-in-stap">
              <Title title="1. Kosten dakcoating berekenen" text="Vul het dakoppervlak in en zie direct de richtprijs." />
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Dakoppervlak in m²" type="number" value={form.roofArea} onChange={(v) => update("roofArea", v)} />
                <Select 
                  label="Btw type" 
                  value={form.customerType} 
                  onChange={(v) => update("customerType", v)} 
                  options={[["bedrijf", "Bedrijf / 21% btw"], ["particulier", "Particulier / 9% btw"]]} 
                  // Geen showColorCircle prop hier!
                />
                <Select 
                  label="Kleur coating" 
                  value={form.coatingColor} 
                  onChange={(v) => update("coatingColor", v)} 
                  options={[["wit", "Wit - maximale reflectie"], ["7047", "RAL 7047 - Telegrijs 4"], ["7040", "RAL 7040 - Venstergrijs"], ["7042", "RAL 7042 - Verkeersgrijs A"]]} 
                  showColorCircle={true} // Deze toont wel de kleur bolletjes
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

              <div className="mt-8">
                <h3 className="text-2xl font-black mb-4">Prijsvergelijking & levensduur</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <CompareCard
                    title="CoolShield 2K"
                    subtitle="Professioneel systeem"
                    price={`${euro(result.pricePerM2)}/m²`}
                    lifespan="30-60 jaar"
                    highlight
                  />

                  <CompareCard
                    title="1-component coating"
                    subtitle="Consumenten coating"
                    price={result.area >= 500 ? "± €30/m²" : "€40 - €50/m²"}
                    lifespan="20-25 jaar"
                  />

                  <CompareCard
                    title="Nieuw bitumen dak"
                    subtitle="Traditionele vervanging"
                    price="€75 - €160/m²"
                    lifespan="20-30 jaar"
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="fade-in-stap">
              <Title title="2. Temperatuurvergelijking" text="Indicatieve vergelijking: wit geeft het sterkste verkoelende effect. Grijstinten zijn vooral esthetisch en worden terughoudend berekend." />
              <div className="rounded-3xl overflow-hidden border border-white/10 bg-slate-950 shadow-2xl">
                <div className="grid md:grid-cols-2 min-h-[420px]">
                  
                  {/* ---- LINKER VAK: OUD ZWART DAK ---- */}
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

                  {/* ---- RECHTER VAK: NIEUW WIT DAK ---- */}
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
            </>
          )}

          {step === 3 && (
            <div className="fade-in-stap">
              <Title title="3. Voordeel zonnepanelen en airco" text="Indicatieve berekening op basis van een koeler dakoppervlak." />
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Aantal zonnepanelen" type="number" value={form.panels} onChange={(v) => update("panels", v)} />
                <Input label="Stroomprijs €/kWh" type="number" step="0.01" value={form.electricityPrice} onChange={(v) => update("electricityPrice", v)} />
                <Select 
                  label="Airco aanwezig?" 
                  value={form.hasAirco} 
                  onChange={(v) => update("hasAirco", v)} 
                  options={[["yes", "Ja"], ["no", "Nee"]]} 
                  // Geen showColorCircle prop hier!
                />
              </div>
              <Grid items={[
                ["Basisopbrengst PV", `${number(result.basePv)} kWh/jaar`],
                ["Extra PV-opbrengst", `${number(result.pvGainKwh)} kWh/jaar`],
                ["Voordeel zonnepanelen", euro(result.pvGainEuro)],
                ["Airco-besparing", euro(result.aircoEuro)],
                ["Totaal voordeel per jaar", euro(result.yearlyBenefit)],
                ["Indicatieve terugverdientijd", result.payback ? `${result.payback.toFixed(1)} jaar` : "n.v.t."],
              ]} />
            </>
          )}

          {step === 4 && (
            <div className="fade-in-stap">
              <Title title="4. Inspectie & onderhoud" text="Vraag eenvoudig een dakinspectie of onderhoud aan. Ook geschikt voor bestaande bitumen daken." />

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

          {step === 5 && (
            <div className="fade-in-stap">
              <Title title="5. Samenvatting" text="Overzicht van uw gekozen dakcoating, kostenindicatie, temperatuurverschil en mogelijke voordelen." />

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
                  <p className="text-sm text-slate-400 uppercase font-bold">Dakoppervlak</p>
                  <p className="text-5xl font-black mt-2">{number(result.area)} m²</p>
                  <p className="text-slate-300 mt-3">Tarief: {result.minimumAreaReached ? `${euro(result.pricePerM2)}/m²` : "maatwerkofferte"}</p>
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

              <div className="mt-6 rounded-3xl bg-white/10 border border-white/10 p-6">
                <p className="text-sm uppercase tracking-wide text-slate-400 font-bold">Prijsverschil op basis van {number(result.area)} m²</p>

                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="rounded-2xl bg-cyan-400 text-slate-950 p-4">
                    <p className="text-sm font-bold uppercase">CoolShield 2K</p>
                    <p className="text-3xl font-black mt-2">{result.minimumAreaReached ? euro(result.excl) : "Offerte"}</p>
                    <p className="text-sm mt-2">{result.minimumAreaReached ? `${euro(result.pricePerM2)}/m² excl. btw` : "Maatwerk"}</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-sm font-bold uppercase text-slate-400">1-component coating</p>
                    <p className="text-3xl font-black mt-2">
                      {result.area >= 500
                        ? euro(result.oneComponentMinTotal)
                        : `${euro(result.oneComponentMinTotal)} - ${euro(result.oneComponentMaxTotal)}`}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      Verschil t.o.v. CoolShield: {result.area >= 500
                        ? euro(result.oneComponentDifferenceMin)
                        : `${euro(result.oneComponentDifferenceMin)} - ${euro(result.oneComponentDifferenceMax)}`}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-sm font-bold uppercase text-slate-400">Nieuw bitumen dak</p>
                    <p className="text-3xl font-black mt-2">{euro(result.bitumenMinTotal)} - {euro(result.bitumenMaxTotal)}</p>
                    <p className="text-sm text-slate-400 mt-2">
                      Verschil t.o.v. CoolShield: {euro(result.bitumenDifferenceMin)} - {euro(result.bitumenDifferenceMax)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <button
                  onClick={downloadPdf}
                  className="rounded-3xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xl py-5 px-6 transition-all"
                >
                  Download PDF samenvatting
                </button>

                <div className="rounded-3xl bg-green-500/15 border border-green-400/20 p-6">
                  <p className="text-sm uppercase tracking-wide text-green-300 font-bold">Volgende stap</p>
                  <h3 className="text-3xl font-black mt-2">Aanvraag controleren en verzenden</h3>
                  <p className="text-slate-300 mt-3">Ga terug naar pagina 4 om uw gegevens in te vullen of de aanvraag te verzenden.</p>
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="flex justify-between mt-5">
          <button disabled={step === 1} onClick={() => setStep(step - 1)} className="rounded-2xl px-5 py-3 bg-white/10 disabled:opacity-30 font-bold">Vorige</button>
          <button disabled={step === 5} onClick={() => setStep(Math.min(5, step + 1))} className="rounded-2xl px-5 py-3 bg-cyan-400 text-slate-950 disabled:opacity-30 font-black">Volgende</button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          Let op: dit is een indicatieve berekening. Definitieve prijs en technische geschiktheid worden bepaald na dakinspectie.
        </p>
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

// Aangepaste Select component: Nu met showColorCircle prop
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

function CompareCard({ title, subtitle, price, lifespan, highlight }) {
  return (
    <div className={highlight ? "rounded-3xl bg-cyan-400 text-slate-950 p-6" : "rounded-3xl bg-white/10 border border-white/10 p-6"}>
      <p className="text-sm font-bold opacity-80">{subtitle}</p>
      <h4 className="text-2xl font-black mt-1">{title}</h4>

      <div className="mt-5">
        <p className={highlight ? "text-slate-700 text-sm" : "text-slate-400 text-sm"}>Indicatieve prijs</p>
        <p className="text-3xl font-black">{price}</p>
      </div>

      <div className="mt-5">
        <p className={highlight ? "text-slate-700 text-sm" : "text-slate-400 text-sm"}>Levensduur</p>
        <p className="text-2xl font-black">{lifespan}</p>
      </div>
    </div>
  );
}

function Choice({ active, onClick, title, text }) {
  return (
    <button onClick={onClick} className={active ? "text-left rounded-3xl bg-cyan-400 text-slate-950 p-5" : "text-left rounded-3xl bg-white/10 border border-white/10 p-5"}>
      <p className="text-lg font-black">{title}</p>
      <p className={active ? "text-sm mt-2 text-slate-800" : "text-sm mt-2 text-slate-300"}>{text}</p>
    </button>
  );
}
