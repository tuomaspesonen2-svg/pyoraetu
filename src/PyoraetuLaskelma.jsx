import { useState, useMemo } from "react";

const BRAND = "#0D263F";
const ACCENT = "#2E7D6B";
const WARM = "#F5F1EC";
const RED_SOFT = "#C4584A";
const AMBER = "#D4A33C";

// Pyöräedun verovapaa raja: 1 200 €/v työntekijää kohden, edellyttäen että
// työnantaja ja työntekijä ovat sitoutuneet pyöräedun käyttöönottoon viimeistään
// 23.4.2025. Yhteinen 3 400 €/v kattoraja työsuhdematkalipun kanssa.
//
// Lakimuutos 1.1.2026 alkaen: 24.4.2025 tai myöhemmin sovituissa sopimuksissa
// pyöräetu on veronalainen luontoisetu käyvän arvon mukaan. Leasing-sopimukset
// jotka on solmittu ennen 24.4.2025 säilyttävät verovapauden sopimuskauden
// loppuun, kuitenkin enintään 5 vuotta käyttöönotosta.
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

function AnimBar({ value, max, color, label, delay = 0 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", fontSize: 11,
        color: "rgba(13,38,63,0.55)", marginBottom: 3, fontWeight: 500,
      }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{fmt(value)} €</span>
      </div>
      <div style={{
        height: 22, borderRadius: 6,
        background: "rgba(13,38,63,0.06)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 6,
          background: color, width: `${pct}%`,
          transition: `width 0.8s cubic-bezier(0.4,0,0.2,1) ${delay}s`,
        }} />
      </div>
    </div>
  );
}

export default function PyoraetuLaskelma() {
  // contractType: "old" = sopimus 23.4.2025 mennessä, "new" = 24.4.2025 jälkeen
  const [contractType, setContractType] = useState("old");
  const [annualBenefit, setAnnualBenefit] = useState(ANNUAL_BENEFIT_DEFAULT);
  const [salaryIdx, setSalaryIdx] = useState(2);
  const [employees, setEmployees] = useState(30);

  const salary = SALARY_EXAMPLES[salaryIdx];
  const isOld = contractType === "old";

  const handleEmployeeInput = (raw) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(EMPLOYEES_MIN, Math.min(EMPLOYEES_MAX, Math.round(num)));
    setEmployees(clamped);
  };

  const handleBenefitInput = (raw) => {
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(0, Math.min(ANNUAL_BENEFIT_MAX, Math.round(num)));
    setAnnualBenefit(clamped);
  };

  const calc = useMemo(() => {
    const monthlyBenefit = annualBenefit / 12;
    const yearlyBenefit = annualBenefit;

    // Palkankorotus aina sama: brutto + sivukulut, työntekijä saa nettoa
    const employerCostSalary = monthlyBenefit * (1 + SIVUKULUT_RATE);
    const employeeNetSalary = monthlyBenefit * (1 - salary.marginalTax);

    // Pyöräetu — riippuu sopimustyypistä
    let employerCostBenefit, employeeNetBenefit;
    if (isOld) {
      // Vanha sopimus: verovapaa 1 200 €/v, ei sivukuluja, ei verotusta työntekijälle
      employerCostBenefit = monthlyBenefit;
      employeeNetBenefit = monthlyBenefit;
    } else {
      // Uusi sopimus 1.1.2026 alkaen: veronalainen käypä arvo, kuten palkka
      // Työnantaja maksaa sivukulut etuuden arvosta, työntekijä maksaa marginaaliveron
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
      monthlyBenefit, yearlyBenefit,
      employerCostSalary, employeeNetSalary,
      employerCostBenefit, employeeNetBenefit,
      employerSavingsMonth, employerSavingsYear,
      employeeGainMonth, employeeGainYear,
      totalEmployerSavingsYear, totalCostBenefitYear, totalCostSalaryYear,
    };
  }, [annualBenefit, salary, employees, isOld]);

  const maxBar = Math.max(calc.employerCostSalary, calc.employerCostBenefit, calc.monthlyBenefit);

  return (
    <div style={{
      minHeight: "100vh", background: WARM,
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND} 0%, #1a3a5c 100%)`,
        color: "#fff", padding: "32px 20px 26px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: -30, right: -30,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(46,125,107,0.18)",
        }} />
        <div style={{ position: "relative" }}>
          <div style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 12, letterSpacing: 2, textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)", marginBottom: 6,
          }}>
            Verologia
          </div>
          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 26, fontWeight: 400, margin: 0, lineHeight: 1.25,
            color: "#fff",
          }}>
            Palkankorotus vai pyöräetu?
          </h1>
          <p style={{
            fontSize: 14, color: "rgba(255,255,255,0.7)",
            margin: "8px 0 0", lineHeight: 1.5,
          }}>
            Vertailu: sama euromäärä bruttopalkassa vs. pyöräetuna — sopimuksen ajankohdan mukaan
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 16px 100px" }}>

        {/* Contract type toggle */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 10,
          }}>
            Sopimuksen ajankohta
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setContractType("old")} style={{
              flex: 1, padding: "12px 8px", fontSize: 13, fontWeight: 600,
              border: `2px solid ${isOld ? ACCENT : "rgba(13,38,63,0.1)"}`,
              borderRadius: 10,
              background: isOld ? ACCENT : "#fff",
              color: isOld ? "#fff" : BRAND,
              cursor: "pointer", fontFamily: "inherit", lineHeight: 1.3,
              transition: "all 0.2s",
            }}>
              Sopimus 23.4.2025 mennessä
              <div style={{
                fontSize: 10, fontWeight: 400,
                opacity: isOld ? 0.85 : 0.55,
                marginTop: 4,
              }}>
                Verovapaa 1 200 €/v
              </div>
            </button>
            <button onClick={() => setContractType("new")} style={{
              flex: 1, padding: "12px 8px", fontSize: 13, fontWeight: 600,
              border: `2px solid ${!isOld ? AMBER : "rgba(13,38,63,0.1)"}`,
              borderRadius: 10,
              background: !isOld ? AMBER : "#fff",
              color: !isOld ? "#fff" : BRAND,
              cursor: "pointer", fontFamily: "inherit", lineHeight: 1.3,
              transition: "all 0.2s",
            }}>
              Sopimus 24.4.2025 jälkeen
              <div style={{
                fontSize: 10, fontWeight: 400,
                opacity: !isOld ? 0.9 : 0.55,
                marginTop: 4,
              }}>
                Veronalainen 1.1.2026 alkaen
              </div>
            </button>
          </div>
        </div>

        {/* Warning banner for new contracts */}
        {!isOld && (
          <div style={{
            background: "rgba(212,163,60,0.12)",
            border: `1px solid rgba(212,163,60,0.3)`,
            borderRadius: 10, padding: "12px 14px",
            marginBottom: 18,
            fontSize: 12, color: BRAND, lineHeight: 1.5,
          }}>
            <strong style={{ color: AMBER }}>Huom.</strong> 1.1.2026 alkaen 24.4.2025 tai myöhemmin sovittu pyöräetu on veronalainen luontoisetu käyvän arvon mukaan. Verotus vastaa palkkaa: työntekijälle marginaalivero, työnantajalle sivukulut. Pyöräetu voi olla edelleen houkutteleva työntekijän hankintaprosessin ja työnantajamielikuvan kannalta, mutta vero-etua ei enää synny.
          </div>
        )}

        {/* Annual benefit selector */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 1.2, color: "rgba(13,38,63,0.5)",
            }}>
              Pyöräedun arvo / työntekijä / vuosi
            </div>
            <input
              type="number"
              min={0}
              max={ANNUAL_BENEFIT_MAX}
              step={50}
              value={annualBenefit}
              onChange={(e) => handleBenefitInput(e.target.value)}
              style={{
                width: 100, padding: "6px 10px",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                color: BRAND, background: "#fff",
                border: `1.5px solid rgba(13,38,63,0.15)`,
                borderRadius: 8, textAlign: "right",
                outline: "none",
              }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={ANNUAL_BENEFIT_MAX}
            step={50}
            value={annualBenefit}
            onChange={(e) => setAnnualBenefit(Number(e.target.value))}
            style={{ width: "100%", accentColor: isOld ? ACCENT : AMBER }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 10, color: "rgba(13,38,63,0.3)",
          }}>
            <span>0 €</span><span>300 €</span><span>600 €</span><span>900 €</span><span>1 200 €</span>
          </div>
          {isOld && (
            <div style={{
              fontSize: 11, color: "rgba(13,38,63,0.45)", marginTop: 4,
            }}>
              Verovapaa enintään 1 200 €/v. Yhteinen kattoraja työsuhdematkalipun kanssa 3 400 €/v.
            </div>
          )}
        </div>

        {/* Salary selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 10,
          }}>
            Työntekijän palkkataso (marginaalivero {Math.round(salary.marginalTax * 100)} %)
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {SALARY_EXAMPLES.map((s, i) => (
              <button key={s.gross} onClick={() => setSalaryIdx(i)} style={{
                padding: "8px 10px", fontSize: 12, fontWeight: 500,
                border: `1.5px solid ${i === salaryIdx ? (isOld ? ACCENT : AMBER) : "rgba(13,38,63,0.1)"}`,
                borderRadius: 8,
                background: i === salaryIdx ? (isOld ? ACCENT : AMBER) : "#fff",
                color: i === salaryIdx ? "#fff" : BRAND,
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.2s",
              }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Employee count */}
        <div style={{ marginBottom: 22 }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 13, fontWeight: 600, textTransform: "uppercase",
              letterSpacing: 1.2, color: "rgba(13,38,63,0.5)",
            }}>
              Henkilöstön määrä
            </div>
            <input
              type="number"
              min={EMPLOYEES_MIN}
              max={EMPLOYEES_MAX}
              value={employees}
              onChange={(e) => handleEmployeeInput(e.target.value)}
              style={{
                width: 90, padding: "6px 10px",
                fontSize: 14, fontWeight: 700, fontFamily: "inherit",
                color: BRAND, background: "#fff",
                border: `1.5px solid rgba(13,38,63,0.15)`,
                borderRadius: 8, textAlign: "right",
                outline: "none",
              }}
            />
          </div>
          <input
            type="range"
            min={EMPLOYEES_MIN}
            max={EMPLOYEES_MAX}
            value={employees}
            onChange={(e) => setEmployees(Number(e.target.value))}
            style={{ width: "100%", accentColor: isOld ? ACCENT : AMBER }}
          />
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: 10, color: "rgba(13,38,63,0.3)",
          }}>
            <span>1</span><span>250</span><span>500</span><span>750</span><span>1000</span>
          </div>
        </div>

        {/* Comparison cards */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          marginBottom: 16,
        }}>
          {/* Salary card */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 16,
            border: `1px solid rgba(196,88,74,0.2)`,
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1.5, color: RED_SOFT, marginBottom: 12,
            }}>
              Palkankorotus
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työnantaja maksaa /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: RED_SOFT, marginBottom: 12,
            }}>
              {fmt(calc.employerCostSalary)} €
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työntekijä saa käteen /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: BRAND,
            }}>
              {fmt(calc.employeeNetSalary)} €
            </div>
          </div>

          {/* Benefit card */}
          <div style={{
            background: "#fff", borderRadius: 14, padding: 16,
            border: `2px solid ${isOld ? ACCENT : AMBER}`,
            boxShadow: isOld
              ? "0 4px 20px rgba(46,125,107,0.1)"
              : "0 4px 20px rgba(212,163,60,0.12)",
          }}>
            <div style={{
              fontSize: 12, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1.5, color: isOld ? ACCENT : AMBER, marginBottom: 12,
            }}>
              Pyöräetu {isOld && "✓"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työnantaja maksaa /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: isOld ? ACCENT : AMBER, marginBottom: 12,
            }}>
              {fmt(calc.employerCostBenefit)} €
            </div>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työntekijä saa käteen /kk
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 24, color: BRAND,
            }}>
              {fmt(calc.employeeNetBenefit)} €
            </div>
          </div>
        </div>

        {/* Visual comparison bars */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 16,
          border: "1px solid rgba(13,38,63,0.08)",
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 12,
          }}>
            Työnantajan kustannus / kuukausi
          </div>
          <AnimBar value={calc.employerCostSalary} max={maxBar} color={RED_SOFT} label="Palkankorotus (brutto + sivukulut 20,5 %)" delay={0.1} />
          <AnimBar
            value={calc.employerCostBenefit}
            max={maxBar}
            color={isOld ? ACCENT : AMBER}
            label={isOld ? "Pyöräetu (ei sivukuluja)" : "Pyöräetu (sivukulut kuten palkka)"}
            delay={0.2}
          />

          <div style={{
            marginTop: 14, fontSize: 13, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1.2, color: "rgba(13,38,63,0.5)", marginBottom: 12,
          }}>
            Työntekijän nettohyöty / kuukausi
          </div>
          <AnimBar
            value={calc.employeeNetSalary}
            max={calc.monthlyBenefit || 1}
            color={RED_SOFT}
            label={`Palkankorotus (marginaalivero ${Math.round(salary.marginalTax * 100)} %)`}
            delay={0.3}
          />
          <AnimBar
            value={calc.employeeNetBenefit}
            max={calc.monthlyBenefit || 1}
            color={isOld ? ACCENT : AMBER}
            label={isOld ? "Pyöräetu (veroton)" : "Pyöräetu (veronalainen)"}
            delay={0.4}
          />
        </div>

        {/* Key insight */}
        <div style={{
          background: `linear-gradient(135deg, ${BRAND} 0%, #1a3a5c 100%)`,
          borderRadius: 14, padding: 20, color: "#fff",
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 2, color: "rgba(255,255,255,0.5)", marginBottom: 14,
          }}>
            Yhteenveto
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Työnantaja säästää /v
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: isOld ? "#7FDBBA" : "#E8C97A",
              }}>
                {fmt(calc.employerSavingsYear)} €
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                Työntekijä hyötyy /v
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22, color: isOld ? "#7FDBBA" : "#E8C97A",
              }}>
                +{fmt(calc.employeeGainYear)} €
              </div>
            </div>
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 14,
            fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.6,
          }}>
            {isOld ? (
              <>
                {fmt0(annualBenefit)} € pyöräetuna tuottaa työntekijälle <strong style={{ color: "#7FDBBA" }}>
                {fmt(calc.employeeGainYear)} € enemmän</strong> vuodessa kuin sama summa palkankorotuksena.
                Samalla työnantaja <strong style={{ color: "#7FDBBA" }}>säästää {fmt(calc.employerSavingsYear)} €</strong> sivukuluissa.
              </>
            ) : (
              <>
                <strong style={{ color: "#E8C97A" }}>Veroetua ei synny:</strong> uudessa sopimuksessa pyöräetu verotetaan kuten palkka.
                Työnantajan ja työntekijän nettoluvut ovat samat kuin vastaava palkankorotus.
                Pyöräetu voi silti olla mielekäs työntekijälle hankinnan helppouden vuoksi sekä työnantajalle hyvinvointi- ja brändihyötyjen kautta —
                mutta puhtaasti verotuksellisesti palkankorotus on yhtä tehokas.
              </>
            )}
          </div>
        </div>

        {/* Scale card */}
        <div style={{
          background: "#fff", borderRadius: 14, padding: 16,
          border: "1px solid rgba(13,38,63,0.08)",
          marginBottom: 16,
        }}>
          <div style={{
            fontSize: 12, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: 1.5, color: "rgba(13,38,63,0.5)", marginBottom: 14,
          }}>
            Skaalattu: {employees} työntekijää / vuosi
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{
              background: "rgba(196,88,74,0.06)", borderRadius: 10, padding: 14,
            }}>
              <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
                Palkankorotus yhteensä
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 18, color: RED_SOFT,
              }}>
                {fmt(calc.totalCostSalaryYear)} €
              </div>
            </div>
            <div style={{
              background: isOld ? "rgba(46,125,107,0.06)" : "rgba(212,163,60,0.08)",
              borderRadius: 10, padding: 14,
            }}>
              <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
                Pyöräetu yhteensä
              </div>
              <div style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 18, color: isOld ? ACCENT : AMBER,
              }}>
                {fmt(calc.totalCostBenefitYear)} €
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 14, textAlign: "center",
            padding: "12px", borderRadius: 10,
            background: isOld ? "rgba(46,125,107,0.08)" : "rgba(212,163,60,0.10)",
          }}>
            <div style={{ fontSize: 11, color: "rgba(13,38,63,0.5)", marginBottom: 4 }}>
              Työnantajan kokonaissäästö vuodessa
            </div>
            <div style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 26, color: isOld ? ACCENT : AMBER, fontWeight: 400,
            }}>
              {fmt(calc.totalEmployerSavingsYear)} €
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div style={{
          fontSize: 10, color: "rgba(13,38,63,0.35)", lineHeight: 1.6,
          padding: "0 4px",
        }}>
          {isOld ? (
            <>
              Vanhassa sopimuksessa pyöräetu on verovapaa enintään 1 200 €/v työntekijää kohden, kun työnantaja ja työntekijä ovat sitoutuneet pyöräedun käyttöönottoon viimeistään 23.4.2025. Polkupyöräedun ja työsuhdematkalipun yhteinen verovapaa kattoraja on 3 400 €/v. Leasing-sopimuksilla ennen 24.4.2025 hankittu etu säilyttää verovapauden sopimuskauden loppuun, kuitenkin enintään 5 vuotta käyttöönotosta.
            </>
          ) : (
            <>
              1.1.2026 alkaen 24.4.2025 tai myöhemmin sovittu pyöräetu on veronalainen luontoisetu, joka arvostetaan käypään arvoon. Etu lisätään palkkaan ennakonpidätystä varten ja siitä peritään marginaalivero. Työnantaja maksaa sivukulut etuuden arvosta. Verotuksellisesti tilanne vastaa palkankorotusta. Pyöräetu voi silti olla houkutteleva työntekijän hankintaprosessin keventämisen ja työnantajan hyvinvointi- ja vastuullisuusprofiilin kautta.
            </>
          )}
          <br /><br />
          Sivukulut 20,5 % (TyEL, sairausvakuutus, työttömyysvakuutus, tapaturmavakuutus, ryhmähenkivakuutus). Marginaaliveroasteet ovat viitteellisiä, todelliset verovaikutukset riippuvat yksilön tilanteesta.
          <br /><br />
          Verologia.fi — Työsuhde-etujen koulutus yrityksille
        </div>
      </div>
    </div>
  );
}
