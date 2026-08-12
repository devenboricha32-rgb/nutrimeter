import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are an expert Indian nutritionist and EatRight food evaluator.

Whenever the user enters any food, snack, drink, or complete meal, analyze it and give accurate calorie estimates and nutrition information. Use Indian food portions by default unless the user specifies a quantity.

Health Emoji Rating:
- 😄 Healthy = nutrient-dense, balanced, minimally processed.
- 😐 Could Be Better = acceptable occasionally but needs improvement.
- ☹️ Non-Healthy = highly processed, high in sugar, salt, trans fat, or excess calories.

Important Accuracy Rules:
- Use realistic Indian serving sizes.
- Do not invent impossible numbers.
- Mention when values are approximate.
- Distinguish homemade and restaurant versions when relevant.
- If quantity is missing, assume a standard serving and clearly mention it.

Respond ONLY with a valid JSON object (no markdown, no backticks, no explanation outside JSON) in this exact structure:
{
  "food": "repeat the food item exactly",
  "assumed_portion": "state what portion you assumed if not specified",
  "rating": "😄" or "😐" or "☹️",
  "rating_label": "Healthy" or "Could Be Better" or "Non-Healthy",
  "calories": "e.g. ~250 calories",
  "carbs": "e.g. ~35 g",
  "protein": "e.g. ~6 g",
  "fat": "e.g. ~8 g",
  "fiber": "e.g. ~3 g",
  "sugar": "e.g. ~5 g",
  "sodium": "e.g. ~180 mg",
  "reason": "2-4 lines of scientific reasoning covering protein quality, fiber, vitamins, minerals, sugar level, oil content, processing level, portion size",
  "better_choice": "one healthier alternative or modification",
  "portion_size": "Small" or "Moderate" or "Large" or "Excessive",
  "verdict": "one-line final verdict suitable for school or college awareness activities"
}`;

const ratingColors = {
  "😄": { bg: "#E8F7EF", border: "#2D8C5A", text: "#1A5C3A", label: "Healthy" },
  "😐": { bg: "#FFF8E8", border: "#E8A020", text: "#7A5500", label: "Could Be Better" },
  "☹️": { bg: "#FDEAEA", border: "#D64040", text: "#8C1A1A", label: "Non-Healthy" },
};

const portionColors = {
  Small: "#4CAF7D",
  Moderate: "#2D8C5A",
  Large: "#E8A020",
  Excessive: "#D64040",
};

const suggestions = [
  { name: "2 roti with dal", img: "https://loremflickr.com/160/160/roti,dal,indian" },
  { name: "Idli sambar (2 idlis)", img: "https://loremflickr.com/160/160/idli,sambar" },
  { name: "Banana (1 medium)", img: "https://loremflickr.com/160/160/banana,fruit" },
  { name: "Sprouts chaat", img: "https://loremflickr.com/160/160/sprouts,salad,indian" },
  { name: "Vegetable poha (1 plate)", img: "https://loremflickr.com/160/160/poha,indian,breakfast" }
];

// Builds a free keyword-based food photo URL for any food name (used for quick-try
// thumbnails and the dynamic result-card image). No API key required.
function foodImageUrl(foodName, size = 400) {
  const keyword = encodeURIComponent(foodName.replace(/\(.*?\)/g, "").trim() || "food");
  return `https://loremflickr.com/${size}/${size}/${keyword}`;
}

export default function MealScorer() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function analyze() {
    const query = input.trim();
    if (!query) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: query }],
        }),
      });

      const data = await response.json();
      const raw = data.content?.map(b => b.text || "").join("").trim();
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setHistory(prev => [{ food: query, rating: parsed.rating }, ...prev].slice(0, 5));
    } catch (e) {
      setError("Could not analyze this food item. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") analyze();
  }

  const colors = result ? ratingColors[result.rating] : null;

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", background: "#FFFDF8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1A5C3A 0%, #2D8C5A 50%, #4CAF7D 100%)",
        padding: "28px 20px 24px", textAlign: "center"
      }}>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          EATRIGHT AWARENESS
        </div>
        <div style={{ color: "#fff", fontSize: "clamp(26px,6vw,40px)", fontWeight: 800, lineHeight: 1.1, marginBottom: 6 }}>
          NutriMeter 🍽️
        </div>
        <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, maxWidth: 340, margin: "0 auto" }}>
          Enter any food or meal — get instant nutrition score & health rating
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          {["😄 Healthy", "😐 Could Be Better", "☹️ Non-Healthy"].map(tag => (
            <span key={tag} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 10, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 600
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Ticker */}
      <div style={{ background: "#FF9933", overflow: "hidden", padding: "8px 0" }}>
        <div style={{
          display: "inline-block", whiteSpace: "nowrap", color: "#fff", fontWeight: 700, fontSize: 13,
          animation: "ticker 30s linear infinite"
        }}>
          &nbsp;&nbsp;&nbsp;🥗 Khao Sahi, Jiyo Achi &nbsp;•&nbsp; 🌈 Eat Right, Stay Bright &nbsp;•&nbsp; 🍎 Ek Fal Roz – Doctor Ko Dur Karo &nbsp;•&nbsp; 💧 Pehle Paani, Phir Chai! &nbsp;•&nbsp; 🛑 Cola Nahi, Nariyal Paani Piyo! &nbsp;•&nbsp; 🏠 Ghar Ka Khana = Sehat Ka Khazana &nbsp;•&nbsp;
        </div>
      </div>
      <style>{`@keyframes ticker { 0% { transform:translateX(100vw); } 100% { transform:translateX(-100%); } }`}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 60px" }}>

        {/* Input Card */}
        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: 24, marginBottom: 20, border: "1px solid #EEEEF5" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🔍 What did you eat?</div>
          <div style={{ fontSize: 13, color: "#666680", marginBottom: 14 }}>Type any food, drink, snack, or full meal — Indian portions assumed by default</div>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 2 roti with dal, samosa, mango shake…"
              style={{
                flex: 1, padding: "13px 16px", borderRadius: 12,
                border: "2px solid #EEEEF5", fontFamily: "'Nunito', sans-serif",
                fontSize: 15, outline: "none", background: "#FAFAFA", transition: "border 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "#2D8C5A"}
              onBlur={e => e.target.style.borderColor = "#EEEEF5"}
            />
            <button
              onClick={analyze}
              disabled={loading || !input.trim()}
              style={{
                padding: "13px 22px", borderRadius: 12, border: "none",
                background: loading ? "#ccc" : "linear-gradient(135deg,#1A5C3A,#4CAF7D)",
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "default" : "pointer",
                whiteSpace: "nowrap", transition: "opacity 0.2s"
              }}
            >
              {loading ? "⏳ Analyzing…" : "Score It →"}
            </button>
          </div>

          {/* Quick suggestions */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: "#666680", fontWeight: 600, marginBottom: 8 }}>QUICK TRY:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {suggestions.map(s => (
                <button key={s.name} onClick={() => { setInput(s.name); setTimeout(analyze, 50); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "4px 12px 4px 4px", borderRadius: 20, border: "1.5px solid #EEEEF5",
                    background: "#F8F8FB", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    color: "#444", transition: "all 0.15s"
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#E8F7EF"; e.currentTarget.style.borderColor = "#2D8C5A"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#F8F8FB"; e.currentTarget.style.borderColor = "#EEEEF5"; }}
                >
                  <img
                    src={s.img}
                    alt={s.name}
                    loading="lazy"
                    style={{ width: 22, height: 22, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                    onError={e => { e.target.style.display = "none"; }}
                  />
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "#FDEAEA", border: "1.5px solid #D64040", borderRadius: 12, padding: "14px 18px", color: "#8C1A1A", marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: 28, border: "1px solid #EEEEF5", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🔬</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#2D8C5A" }}>Analyzing your food…</div>
            <div style={{ fontSize: 13, color: "#666680", marginTop: 4 }}>Calculating nutrition using Indian portion standards</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 10, height: 10, borderRadius: "50%", background: "#2D8C5A",
                  animation: `bounce 1.2s ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
            <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }`}</style>
          </div>
        )}

        {/* Result Card */}
        {result && !loading && (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", border: "1px solid #EEEEF5", overflow: "hidden", marginBottom: 20 }}>
            {/* Result header */}
            <div style={{ background: colors.bg, borderBottom: `3px solid ${colors.border}`, padding: "20px 24px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                🍽️ NutriMeter Result
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <img
                  src={foodImageUrl(result.food, 200)}
                  alt={result.food}
                  loading="lazy"
                  style={{
                    width: 56, height: 56, borderRadius: 12, objectFit: "cover",
                    border: `2px solid ${colors.border}`, flexShrink: 0, background: "#fff"
                  }}
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div style={{ fontWeight: 800, fontSize: 18, color: "#1A1A2E" }}>
                  {result.food}
                </div>
              </div>
              {result.assumed_portion && (
                <div style={{ fontSize: 12, color: "#666680", fontStyle: "italic", marginBottom: 10 }}>
                  📏 Assumed: {result.assumed_portion}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#fff", borderRadius: 12, padding: "8px 16px",
                  border: `2px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                  <span style={{ fontSize: 28 }}>{result.rating}</span>
                  <div>
                    <div style={{ fontSize: 12, color: "#666680", fontWeight: 600 }}>HEALTH RATING</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: colors.text }}>{result.rating_label}</div>
                  </div>
                </div>
                <div style={{
                  background: "#fff", borderRadius: 12, padding: "8px 16px",
                  border: "2px solid #EEEEF5", boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
                }}>
                  <div style={{ fontSize: 12, color: "#666680", fontWeight: 600 }}>ESTIMATED CALORIES</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#1A1A2E" }}>{result.calories}</div>
                </div>
              </div>
            </div>

            <div style={{ padding: "20px 24px" }}>
              {/* Nutrition Grid */}
              <div style={{ fontSize: 13, fontWeight: 700, color: "#666680", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
                Nutrition Estimate
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Carbs", val: result.carbs, icon: "🌾" },
                  { label: "Protein", val: result.protein, icon: "💪" },
                  { label: "Fat", val: result.fat, icon: "🫧" },
                  { label: "Fiber", val: result.fiber, icon: "🌿" },
                  { label: "Sugar", val: result.sugar, icon: "🍬" },
                  { label: "Sodium", val: result.sodium, icon: "🧂" },
                ].map(({ label, val, icon }) => (
                  <div key={label} style={{
                    background: "#FAFAFA", borderRadius: 12, padding: "12px 10px", textAlign: "center",
                    border: "1.5px solid #EEEEF5"
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A2E" }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#666680", fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Why this score */}
              <div style={{ background: "#F8F8FB", borderRadius: 12, padding: "14px 16px", marginBottom: 14, border: "1.5px solid #EEEEF5" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 6 }}>🔬 Why this score?</div>
                <div style={{ fontSize: 14, color: "#444", lineHeight: 1.6 }}>{result.reason}</div>
              </div>

              {/* Better Choice */}
              <div style={{ background: "#E8F7EF", borderRadius: 12, padding: "14px 16px", marginBottom: 14, border: "1.5px solid #2D8C5A" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A5C3A", marginBottom: 4 }}>💡 Better Choice</div>
                <div style={{ fontSize: 14, color: "#1A5C3A" }}>{result.better_choice}</div>
              </div>

              {/* Portion + Verdict */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <div style={{
                  flex: 1, minWidth: 140, background: "#fff", borderRadius: 12, padding: "12px 14px",
                  border: `2px solid ${portionColors[result.portion_size] || "#EEEEF5"}`
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#666680", marginBottom: 4 }}>PORTION SIZE</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: portionColors[result.portion_size] || "#1A1A2E" }}>
                    {result.portion_size === "Small" ? "🥢" : result.portion_size === "Moderate" ? "🍽️" : result.portion_size === "Large" ? "🍛" : "⚠️"} {result.portion_size}
                  </div>
                </div>
                <div style={{
                  flex: 2, minWidth: 200, background: colors.bg, borderRadius: 12, padding: "12px 14px",
                  border: `2px solid ${colors.border}`
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.text, marginBottom: 4 }}>EATRIGHT VERDICT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, lineHeight: 1.4 }}>{result.verdict}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 1 && (
          <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: 20, border: "1px solid #EEEEF5" }}>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>📋 Recent Scores</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((h, i) => {
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                    borderRadius: 10, background: "#FAFAFA", border: "1.5px solid #EEEEF5"
                  }}>
                    <img
                      src={foodImageUrl(h.food, 80)}
                      alt={h.food}
                      loading="lazy"
                      style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      onError={e => { e.target.style.display = "none"; }}
                    />
                    <span style={{ fontSize: 20 }}>{h.rating}</span>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{h.food}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 28, fontSize: 12, color: "#999" }}>
          🌱 EatRight Awareness · All values are approximate · Based on standard Indian portions
        </div>
      </div>
    </div>
  );
}
