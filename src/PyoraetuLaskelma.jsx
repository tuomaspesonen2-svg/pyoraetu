import { useState, useMemo } from "react";

/* Verologia-laskuri – sivuston design-järjestelmä (Bricolage Grotesque + Inter) */
const NAVY = "#0D263F";
const NAVY_2 = "#0A1E33";
const ACCENT = "#3C72AB";
const GREEN = "#1F8A5B";
const GREEN_SOFT = "#7FDBBA";
const GREEN_PANEL = "#E3F2EA";
const RED = "#C4584A";
const AMBER = "#D4A33C";
const AMBER_SOFT = "#E8C97A";
const SAND = "#F3F2EC";
const INK = "#14202E";
const MUTED = "#5A6675";
const LINE = "#E4E0D6";
const WHITE = "#FFFFFF";

const HEAD = "'Bricolage Grotesque', system-ui, sans-serif";
const BODY = "'Inter', system-ui, sans-serif";
const SHADOW_SM = "0 10px 30px -16px rgba(28,40,30,.22)";

const ANNUAL_BENEFIT_MAX = 1200;
const ANNUAL_BENEFIT_DEFAULT = 1200;

const SALARY_EXAMPLES = [
{ label: "2 500 €/kk", gross: 2500, marginalTax: 0.30 },
{ label: "3 000 €/kk", gross: 3000, marginalTax: 0.35 },
{ label: "3 500 €/kk", gross: 3500, marginalTax: 0.40 },
{ label: "4 000 €/kk", gross: 4000, marginalTax: 0.43 },
{ label: "4 500 €/kk", gross: 4500, marginalTax: 0.45 },
{ label: "5 000 €/kk", gross: 5000, marginalTax: 0.47 },
];

const SIVUKULUT_RATE = 0.205;
const EMPLOYEES_MIN = 1;
const EMPLOYEES_MAX = 1000;

function fmt(n) {
return n.toLocaleString("fi-FI", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmt0(n) {
return n.toLocaleString("fi-FI", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

const sliderCSS = `
.vl-range{ -webkit-appearance:none; appearance:none; width:100%; height:6px; border-radius:999px;
  background:${LINE}; outline:none; }
.vl-range::-webkit-slider-thumb{ -webkit-appearance:none; appearance:none; width:22px; height:22px;
  border-radius:50%; background:${ACCENT}; cursor:pointer; border:3px solid #fff;
  box-shadow:0 2px 6px rgba(13,38,63,.25); }
.vl-range::-moz-range-thumb{ width:22px; height:22px; border-radius:50%; background:${ACCENT};
  cursor:pointer; border:3px solid #fff; box-shadow:0 2px 6px rgba(13,38,63,.25); }
.vl-range.amber::-webkit-slider-thumb{ background:${AMBER}; }
.vl-range.amber::-moz-range-thumb{ background:${AMBER}; }

@media(max-width:600px){ div[style*="minmax(0"]{grid-template-columns:1fr !important} div[style*="minmax(0"]>div{text-align:center !important} }
`;

function Eyebrow({ children, light = false, color }) {
return (
<div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 12, letterSpacing: ".15em", textTransform: "uppercase",
color: color || (light ? "rgba(255,255,255,0.55)" : ACCENT) }}>
{children}
</div>
);
}

function FieldLabel({ children, right }) {
return (
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
<div style={{ fontFamily: BODY, fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED }}>{children}</div>
{right}
</div>
);
}

function AnimBar({ value, max, color, label, delay = 0 }) {
const pct = Math.min((value / max) * 100, 100);
return (
<div style={{ marginBottom: 10 }}>
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: BODY, color: MUTED, marginBottom: 5, fontWeight: 500 }}>
<span>{label}</span>
<span style={{ fontFamily: HEAD, fontWeight: 700, color }}>{fmt(value)} €</span>
</div>
<div style={{ height: 20, borderRadius: 6, background: "rgba(13,38,63,0.06)", overflow: "hidden" }}>
<div style={{ height: "100%", borderRadius: 6, background: color, width: `${pct}%`, transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}s` }} />
</div>
</div>
);
}

export default function PyoraetuLaskelma() {
const [contractType, setContractType] = useState("old");
const [annualBenefit, setAnnualBenefit] = useState(ANNUAL_BENEFIT_DEFAULT);
const [salaryIdx, setSalaryIdx] = useState(2);
const [employees, setEmployees] = useState(30);

const salary = SALARY_EXAMPLES[salaryIdx];
const isOld = contractType === "old";

// Teemavärit sopimustyypin mukaan
const theme = isOld ? ACCENT : AMBER;       // identiteetti / interaktio
const goodColor = isOld ? GREEN : AMBER;    // hyöty / säästö
const goodSoft = isOld ? GREEN_SOFT : AMBER_SOFT;
const goodPanel = isOld ? GREEN_PANEL : "rgba(212,163,60,0.12)";

const handleEmployeeInput = (raw) => {
const num = Number(raw); if (Number.isNaN(num)) return;
setEmployees(Math.max(EMPLOYEES_MIN, Math.min(EMPLOYEES_MAX, Math.round(num))));
};
const handleBenefitInput = (raw) => {
const num = Number(raw); if (Number.isNaN(num)) return;
setAnnualBenefit(Math.max(0, Math.min(ANNUAL_BENEFIT_MAX, Math.round(num))));
};

const calc = useMemo(() => {
const monthlyBenefit = annualBenefit / 12;
const yearlyBenefit = annualBenefit;
const employerCostSalary = monthlyBenefit * (1 + SIVUKULUT_RATE);
const employeeNetSalary = monthlyBenefit * (1 - salary.marginalTax);
let employerCostBenefit, employeeNetBenefit;
if (isOld) {
employerCostBenefit = monthlyBenefit;
employeeNetBenefit = monthlyBenefit;
} else {
employerCostBenefit = monthlyBenefit * (1 + SIVUKULUT_RATE);
employeeNetBenefit = monthlyBenefit * (1 - salary.marginalTax);
}
const employerSavingsMonth = employerCostSalary - employerCostBenefit;
const employerSavingsYear = employerSavingsMonth * 12;
const employeeGainMonth = employeeNetBenefit - employeeNetSalary;
const employeeGainYear = employeeGainMonth * 12;
const totalEmployerSavingsYear = employerSavingsYear * employees;
const totalCostBenefitYear = employerCostBenefit * 12 * employees;
const totalCostSalaryYear = employerCostSalary * 12 * employees;
return {
monthlyBenefit, yearlyBenefit, employerCostSalary, employeeNetSalary,
employerCostBenefit, employeeNetBenefit, employerSavingsMonth, employerSavingsYear,
employeeGainMonth, employeeGainYear, totalEmployerSavingsYear, totalCostBenefitYear, totalCostSalaryYear,
};
}, [annualBenefit, salary, employees, isOld]);

const maxBar = Math.max(calc.employerCostSalary, calc.employerCostBenefit, calc.monthlyBenefit);
const card = { background: WHITE, borderRadius: 12, padding: 18, border: `1px solid ${LINE}`, boxShadow: SHADOW_SM };
const numInput = { padding: "7px 10px", fontFamily: HEAD, fontSize: 14, fontWeight: 700, color: NAVY, background: WHITE, border: `1.5px solid ${LINE}`, borderRadius: 8, textAlign: "right", outline: "none" };

return (
<div style={{ minHeight: "100vh", background: WHITE, fontFamily: BODY, color: INK }}>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>{sliderCSS}</style>

{/* Header */}
<div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_2} 100%)`, color: "#fff", padding: "34px 20px 28px", position: "relative", overflow: "hidden", textAlign: "center" }}>
<div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(60,114,171,0.22)" }} />
<div style={{ position: "relative" }}>
<Eyebrow light>Verologia · Laskuri</Eyebrow>
<h1 style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, margin: "10px 0 0", lineHeight: 1.05, letterSpacing: "-.028em", color: "#fff" }}>Palkankorotus vai pyöräetu?</h1>
<p style={{ fontFamily: BODY, fontSize: 14.5, color: "rgba(255,255,255,0.72)", margin: "10px auto 0", lineHeight: 1.55, maxWidth: 540 }}>Vertailu: sama euromäärä bruttopalkassa vs. pyöräetuna — sopimuksen ajankohdan mukaan.</p>
</div>
</div>

<div style={{ padding: "20px 16px 100px", maxWidth: 720, margin: "0 auto" }}>

{/* Contract type */}
<div style={{ marginBottom: 18 }}>
<div style={{ fontFamily: BODY, fontSize: 12, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED, marginBottom: 10 }}>Sopimuksen ajankohta</div>
<div style={{ display: "flex", gap: 8 }}>
<button onClick={() => setContractType("old")} style={{
flex: 1, padding: "12px 8px", fontFamily: BODY, fontSize: 13, fontWeight: 600,
border: `2px solid ${isOld ? ACCENT : LINE}`, borderRadius: 10,
background: isOld ? ACCENT : WHITE, color: isOld ? "#fff" : NAVY, cursor: "pointer", lineHeight: 1.3, transition: "all 0.2s",
}}>
Sopimus 23.4.2025 mennessä
<div style={{ fontSize: 10, fontWeight: 400, opacity: isOld ? 0.85 : 0.6, marginTop: 4 }}>Verovapaa 1 200 €/v</div>
</button>
<button onClick={() => setContractType("new")} style={{
flex: 1, padding: "12px 8px", fontFamily: BODY, fontSize: 13, fontWeight: 600,
border: `2px solid ${!isOld ? AMBER : LINE}`, borderRadius: 10,
background: !isOld ? AMBER : WHITE, color: !isOld ? "#fff" : NAVY, cursor: "pointer", lineHeight: 1.3, transition: "all 0.2s",
}}>
Sopimus 24.4.2025 jälkeen
<div style={{ fontSize: 10, fontWeight: 400, opacity: !isOld ? 0.9 : 0.6, marginTop: 4 }}>Veronalainen 1.1.2026 alkaen</div>
</button>
</div>
</div>

{!isOld && (
<div style={{ background: "rgba(212,163,60,0.12)", border: `1px solid rgba(212,163,60,0.35)`, borderRadius: 10, padding: "12px 16px", marginBottom: 18, fontSize: 12.5, color: NAVY, lineHeight: 1.55 }}>
<strong style={{ color: AMBER }}>Huom.</strong> 1.1.2026 alkaen 24.4.2025 tai myöhemmin sovittu pyöräetu on veronalainen luontoisetu käyvän arvon mukaan. Verotus vastaa palkkaa: työntekijälle marginaalivero, työnantajalle sivukulut. Pyöräetu voi olla edelleen houkutteleva hankintaprosessin ja työnantajamielikuvan kannalta, mutta vero-etua ei enää synny.
</div>
)}

{/* Inputs */}
<div style={{ ...card, marginBottom: 16 }}>

{/* Annual benefit */}
<div style={{ marginBottom: 22 }}>
<FieldLabel right={<input type="number" min={0} max={ANNUAL_BENEFIT_MAX} step={50} value={annualBenefit} onChange={(e) => handleBenefitInput(e.target.value)} style={{ ...numInput, width: 100 }} />}>
Pyöräedun arvo / työntekijä / vuosi
</FieldLabel>
<input className={`vl-range${isOld ? "" : " amber"}`} type="range" min={0} max={ANNUAL_BENEFIT_MAX} step={50} value={annualBenefit} onChange={(e) => setAnnualBenefit(Number(e.target.value))} />
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(13,38,63,0.4)", marginTop: 6 }}>
<span>0 €</span><span>300 €</span><span>600 €</span><span>900 €</span><span>1 200 €</span>
</div>
{isOld && (
<div style={{ fontSize: 12, color: MUTED, marginTop: 8, lineHeight: 1.5 }}>
Verovapaa enintään 1 200 €/v. Yhteinen kattoraja työsuhdematkalipun kanssa 3 400 €/v.
</div>
)}
</div>

{/* Salary */}
<div style={{ marginBottom: 22 }}>
<FieldLabel>Työntekijän palkkataso (marginaalivero {Math.round(salary.marginalTax * 100)} %)</FieldLabel>
<div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
{SALARY_EXAMPLES.map((s, i) => (
<button key={s.gross} onClick={() => setSalaryIdx(i)} style={{
padding: "9px 13px", fontFamily: BODY, fontSize: 13, fontWeight: 600,
border: `1.5px solid ${i === salaryIdx ? theme : LINE}`, borderRadius: 999,
background: i === salaryIdx ? theme : WHITE, color: i === salaryIdx ? "#fff" : NAVY,
cursor: "pointer", transition: "all 0.18s",
}}>{s.label}</button>
))}
</div>
</div>

{/* Employees */}
<div>
<FieldLabel right={<input type="number" min={EMPLOYEES_MIN} max={EMPLOYEES_MAX} value={employees} onChange={(e) => handleEmployeeInput(e.target.value)} style={{ ...numInput, width: 92, fontSize: 15 }} />}>
Henkilöstön määrä
</FieldLabel>
<input className={`vl-range${isOld ? "" : " amber"}`} type="range" min={EMPLOYEES_MIN} max={EMPLOYEES_MAX} value={employees} onChange={(e) => setEmployees(Number(e.target.value))} />
<div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(13,38,63,0.4)", marginTop: 6 }}>
<span>1</span><span>250</span><span>500</span><span>750</span><span>1000</span>
</div>
</div>
</div>

{/* Comparison cards */}
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginBottom: 16 }}>
<div style={{ ...card, background: SAND, boxShadow: "none" }}>
<Eyebrow color={MUTED}>Palkankorotus</Eyebrow>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työnantaja maksaa /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: INK, letterSpacing: "-.02em" }}>{fmt(calc.employerCostSalary)} €</div>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työntekijä saa käteen /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: NAVY, letterSpacing: "-.02em" }}>{fmt(calc.employeeNetSalary)} €</div>
</div>
<div style={{ ...card, border: `2px solid ${theme}`, boxShadow: `0 10px 30px -14px ${isOld ? "rgba(60,114,171,0.4)" : "rgba(212,163,60,0.4)"}` }}>
<Eyebrow color={theme}>Pyöräetu {isOld && "✓"}</Eyebrow>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työnantaja maksaa /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: theme, letterSpacing: "-.02em" }}>{fmt(calc.employerCostBenefit)} €</div>
<div style={{ fontSize: 12, color: MUTED, margin: "14px 0 4px" }}>Työntekijä saa käteen /kk</div>
<div style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 800, color: NAVY, letterSpacing: "-.02em" }}>{fmt(calc.employeeNetBenefit)} €</div>
</div>
</div>

{/* Bars */}
<div style={{ ...card, marginBottom: 16 }}>
<Eyebrow color={MUTED}>Työnantajan kustannus / kuukausi</Eyebrow>
<div style={{ marginTop: 14 }}>
<AnimBar value={calc.employerCostSalary} max={maxBar} color={RED} label="Palkankorotus (brutto + sivukulut 20,5 %)" delay={0.1} />
<AnimBar value={calc.employerCostBenefit} max={maxBar} color={goodColor} label={isOld ? "Pyöräetu (ei sivukuluja)" : "Pyöräetu (sivukulut kuten palkka)"} delay={0.2} />
</div>
<div style={{ marginTop: 12 }}><Eyebrow color={MUTED}>Työntekijän nettohyöty / kuukausi</Eyebrow></div>
<div style={{ marginTop: 14 }}>
<AnimBar value={calc.employeeNetSalary} max={calc.monthlyBenefit || 1} color={RED} label={`Palkankorotus (marginaalivero ${Math.round(salary.marginalTax * 100)} %)`} delay={0.3} />
<AnimBar value={calc.employeeNetBenefit} max={calc.monthlyBenefit || 1} color={goodColor} label={isOld ? "Pyöräetu (veroton)" : "Pyöräetu (veronalainen)"} delay={0.4} />
</div>
</div>

{/* Summary */}
<div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_2} 100%)`, borderRadius: 12, padding: 22, color: "#fff", marginBottom: 16 }}>
<Eyebrow light>Yhteenveto</Eyebrow>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 16, margin: "16px 0" }}>
<div>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>Työnantaja säästää /v</div>
<div style={{ fontFamily: HEAD, fontSize: 23, fontWeight: 800, color: goodSoft, letterSpacing: "-.02em" }}>{fmt(calc.employerSavingsYear)} €</div>
</div>
<div>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>Työntekijä hyötyy /v</div>
<div style={{ fontFamily: HEAD, fontSize: 23, fontWeight: 800, color: goodSoft, letterSpacing: "-.02em" }}>+{fmt(calc.employeeGainYear)} €</div>
</div>
</div>
<div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 14, fontSize: 13.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
{isOld ? (
<>{fmt0(annualBenefit)} € pyöräetuna tuottaa työntekijälle <strong style={{ color: goodSoft }}>{fmt(calc.employeeGainYear)} € enemmän</strong> vuodessa kuin sama summa palkankorotuksena. Samalla työnantaja <strong style={{ color: goodSoft }}>säästää {fmt(calc.employerSavingsYear)} €</strong> sivukuluissa.</>
) : (
<><strong style={{ color: goodSoft }}>Veroetua ei synny:</strong> uudessa sopimuksessa pyöräetu verotetaan kuten palkka. Työnantajan ja työntekijän nettoluvut ovat samat kuin vastaava palkankorotus. Pyöräetu voi silti olla mielekäs hankinnan helppouden sekä hyvinvointi- ja brändihyötyjen kautta — mutta puhtaasti verotuksellisesti palkankorotus on yhtä tehokas.</>
)}
</div>
</div>

{/* Scale */}
<div style={{ ...card, marginBottom: 16 }}>
<Eyebrow color={MUTED}>Skaalattu: {employees} työntekijää / vuosi</Eyebrow>
<div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 12, marginTop: 14 }}>
<div style={{ background: SAND, borderRadius: 10, padding: 14 }}>
<div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Palkankorotus yhteensä</div>
<div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 800, color: RED, letterSpacing: "-.02em" }}>{fmt(calc.totalCostSalaryYear)} €</div>
</div>
<div style={{ background: goodPanel, borderRadius: 10, padding: 14 }}>
<div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>Pyöräetu yhteensä</div>
<div style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 800, color: goodColor, letterSpacing: "-.02em" }}>{fmt(calc.totalCostBenefitYear)} €</div>
</div>
</div>
<div style={{ marginTop: 14, textAlign: "center", padding: 14, borderRadius: 10, background: NAVY }}>
<div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Työnantajan kokonaissäästö vuodessa</div>
<div style={{ fontFamily: HEAD, fontSize: 28, fontWeight: 800, color: goodSoft, letterSpacing: "-.02em" }}>{fmt(calc.totalEmployerSavingsYear)} €</div>
</div>
</div>

{/* Footer note */}
<div style={{ fontSize: 11, color: MUTED, lineHeight: 1.65, padding: "0 4px" }}>
{isOld ? (
<>Vanhassa sopimuksessa pyöräetu on verovapaa enintään 1 200 €/v työntekijää kohden, kun työnantaja ja työntekijä ovat sitoutuneet pyöräedun käyttöönottoon viimeistään 23.4.2025. Polkupyöräedun ja työsuhdematkalipun yhteinen verovapaa kattoraja on 3 400 €/v. Leasing-sopimuksilla ennen 24.4.2025 hankittu etu säilyttää verovapauden sopimuskauden loppuun, kuitenkin enintään 5 vuotta käyttöönotosta.</>
) : (
<>1.1.2026 alkaen 24.4.2025 tai myöhemmin sovittu pyöräetu on veronalainen luontoisetu, joka arvostetaan käypään arvoon. Etu lisätään palkkaan ennakonpidätystä varten ja siitä peritään marginaalivero. Työnantaja maksaa sivukulut etuuden arvosta. Verotuksellisesti tilanne vastaa palkankorotusta. Pyöräetu voi silti olla houkutteleva hankintaprosessin keventämisen ja työnantajan hyvinvointi- ja vastuullisuusprofiilin kautta.</>
)}
<br /><br />
Sivukulut 20,5 % (TyEL, sairausvakuutus, työttömyysvakuutus, tapaturmavakuutus, ryhmähenkivakuutus). Marginaaliveroasteet ovat viitteellisiä, todelliset verovaikutukset riippuvat yksilön tilanteesta.
<br /><br />
<span style={{ fontFamily: HEAD, fontWeight: 700, color: NAVY }}>Verologia.fi</span> — Työsuhde-etujen koulutus yrityksille
</div>
</div>
</div>
);
}
