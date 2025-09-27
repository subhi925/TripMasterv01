// path: src/components/HistoryPlans.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./HistoryPlans.css";

const API_BASE = window._API_BASE_ || "http://localhost:8080/www/tripmasterv01/public";

/* ----------------- עזר: ניקוי כותרת מ-"Cloned" ----------------- */
const cleanTitle = (t = "") =>
  t.replace(/(?:\s*·\s*)?Cloned/gi, "").replace(/^\s*·\s*/g, "").trim();

/* ----------------- עזר: לפרש JSON שמגיע כמחרוזת ----------------- */
const j = (v, f = []) => {
  try {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") return JSON.parse(v || "[]");
    return f;
  } catch { return f; }
};

/* ----------------- עזר: הצגת תאריך יפה ----------------- */
const fmt = (s) => {
  if (!s) return "";
  const d = new Date(String(s).replace(" ", "T"));
  return isNaN(d) ? s : d.toLocaleString();
};

/* ----------------- עזר: לנחש מדינה מהכותרת ----------------- */
const guessCountry = (t = "") =>
  (t.match(/my\s*trip\s*to\s*(.+)$/i)?.[1] || t).trim();

/* ----------------- כוכבי דירוג ----------------- */
const Star = ({ on, onClick, onMouseEnter }) => (
  <button type="button" className={`star ${on ? "on" : ""}`}
    onClick={onClick} onMouseEnter={onMouseEnter} aria-label="star">★</button>
);
const Stars = ({ value = 5, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="stars" onMouseLeave={() => setHover(0)}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} on={shown >= n} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} />
      ))}
    </div>
  );
};

export default function HistoryPlans({ uid = (localStorage.getItem("uid") || "") }) {
  const [tab, setTab] = useState("history");
  const [hist, setHist] = useState([]);      // נסיעות עבר (dashboard)
  const [shared, setShared] = useState([]);  // סיפורים (stories)
  const [open, setOpen] = useState({});
  const [rating, setRating] = useState({});
  const [note, setNote] = useState({});
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState({});
  const [details, setDetails] = useState(null);

  /* ----------------- טוען היסטוריה; נופל ל-get_history.php אם אין נתונים ----------------- */
  const loadHistory = useCallback(async () => {
    if (!uid) return;
    try {
      // ניסיון 1: הקובץ הראשי שלך
      const fd = new FormData(); fd.append("uid", uid);
      let r = await fetch(`${API_BASE}/loadHistory.php`, { method: "POST", body: fd });
      let data = await r.json().catch(() => []);
      let arr = Array.isArray(data) ? data : [];
      console.log("the array is:",arr);

      // ניסיון 2: fallback – get_history.php (תיקון ה-template literal כאן)
      if (arr.length === 0) {
        const r2 = await fetch(
          `${API_BASE}/get_history.php?uid=${encodeURIComponent(uid)}`,
          { cache: "no-store" }
        );
        const p2 = await r2.json().catch(() => ({ ok: false, items: [] }));

        // עזר קטן: לחשב משך ימים אם יש start/end
        const calcDays = (a, b) => {
          if (!a || !b) return 0;
          const d1 = new Date(a), d2 = new Date(b);
          if (isNaN(d1) || isNaN(d2)) return 0;
          return Math.max(0, Math.round((d2 - d1) / 86400000) + 1);
        };

        if (Array.isArray(p2?.items)) {
          arr = p2.items.map(x => ({
            id: Number(x.id ?? x.dashid ?? 0),
            dashid: Number(x.dashid ?? 0),
            userid: x.user_id || x.userid || "",
            titlePlan: x.title || x.titlePlan || "My Trip",
            startDate: x.start_date || x.startDate || "",
            endDate: x.end_date || x.endDate || "",
            eventCalender: [],
            places: [],
            images: [],
            duration_days:
              Number(x.duration_days || 0) ||
              calcDays(x.start_date || x.startDate, x.end_date || x.endDate),
          }));
        }
      }

      setHist(arr.map(x => ({
        ...x,
        titlePlan: cleanTitle(x.titlePlan || x.title || "My Trip"),
        eventCalender: j(x.eventCalender),
        places: j(x.places),
        images: j(x.images),
      })));
    } catch {
      setHist([]);
    }
  }, [uid]);

  /* ----------------- טוען סיפורים (stories) למשתמש ----------------- */
  const loadShared = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/get_stories.php?user_id=${encodeURIComponent(uid)}`, { cache: "no-store" });
      const p = await r.json().catch(() => ({ ok: false, items: [] }));
      const items = p?.ok ? p.items : [];
      setShared(items
        .filter(s => (s.user_id || s.userid) === uid)
        .map(s => ({
          ...s,
          title: cleanTitle(s.title || "My Trip"),
          eventCalender: j(s.eventCalender),
          images: j(s.images)
        })));
    } catch {
      setShared([]);
    }
  }, [uid]);

  useEffect(() => { loadHistory(); loadShared(); }, [loadHistory, loadShared]);

  /* ----------------- מיפוי מהיר של היסטוריה לפי מזהה ----------------- */
  const histById = useMemo(() => {
    const m = new Map(); hist.forEach(h => m.set(Number(h.id), h)); return m;
  }, [hist]);

  /* ----------------- סינון: לא להציג בהיסטוריה מה שכבר שותף ----------------- */
  const sharedIds = useMemo(() => new Set(shared.map(s => Number(s.trip_id || 0))), [shared]);
  const historyList = useMemo(() => hist.filter(h => !sharedIds.has(Number(h.id || 0))), [hist, sharedIds]);
  const list = tab === "history" ? historyList : shared;

  /* ----------------- מפתח React ייחודי לכרטיס ----------------- */
  const keyOf = (t, i) => `${tab}-${String(t.trip_id ?? t.id ?? t.dashid ?? "x")}-${i}`;

  /* ----------------- הבאת פרטי מסלול לפי dashid (אם חסרים) ----------------- */
  const fetchByDash = async (dashid) => {
    if (!dashid) return { eventCalender: [], places: [] };
    try {
      const r1 = await fetch(`${API_BASE}/get_plan_details.php?dash_id=${dashid}`, { cache: "no-store" });
      const p1 = await r1.json().catch(() => null);
      if (p1) {
        const ec = j(p1.eventCalender);
        const pl = j(p1.places || p1.days || p1.itinerary);
        if (ec.length || pl.length) return { eventCalender: ec, places: pl, startDate: p1.startDate, endDate: p1.endDate };
      }
    } catch {}
    try {
      const r2 = await fetch(`${API_BASE}/get_plan_by_id.php?id=${dashid}`, { cache: "no-store" });
      const p2 = await r2.json().catch(() => null);
      if (p2) {
        const ec = j(p2.eventCalender);
        const pl = j(p2.places || p2.days || p2.itinerary);
        return { eventCalender: ec, places: pl, startDate: p2.startDate, endDate: p2.endDate };
      }
    } catch {}
    return { eventCalender: [], places: [] };
  };

  /* ----------------- הבטחת פרטים בכרטיס (ממלא אם חסר) ----------------- */
  const ensureDetails = useCallback(async (trip) => {
    if ((trip.eventCalender?.length) || (trip.places?.length)) return trip;
    const dashid = Number(trip.dashid || 0);
    if (!dashid) return trip;
    const extra = await fetchByDash(dashid);
    const merged = { ...trip, ...extra };
    setHist(prev => prev.map(t => Number(t.id) === Number(trip.id) ? merged : t));
    return merged;
  }, []);

  /* ----------------- פתיחת חלון הפרטים ----------------- */
  const openDetails = async (trip) => {
    let t = { ...trip };
    if (tab === "shared" && t.trip_id && histById.has(Number(t.trip_id))) {
      t = { ...histById.get(Number(t.trip_id)), ...t };
    }
    const full = await ensureDetails(t);
    if (!(full.eventCalender?.length) && !(full.places?.length)) {
      alert("No structured details found for this trip."); return;
    }
    setDetails(full);
  };

  /* ----------------- העלאת קבצים לשיתוף ----------------- */
  const onPick = (id, list) => {
    const inc = Array.from(list || []);
    setFiles(prev => {
      const merged = [...(prev[id] || []), ...inc];
      const seen = new Set(); const out = [];
      for (const f of merged) {
        const k = [f.name, f.size, f.lastModified].join("|");
        if (!seen.has(k)) { seen.add(k); out.push(f); }
      }
      return { ...prev, [id]: out.slice(0, 12) };
    });
  };
  const delPicked = (id, i) =>
    setFiles(p => { const a = [...(p[id] || [])]; a.splice(i, 1); return { ...p, [id]: a }; });

  /* ----------------- שיתוף נסיעה ל-stories (כולל הערה/תמונות/דירוג) ----------------- */
  const submitShare = useCallback(async (trip) => {
    const id = Number(trip.id), r = rating[id] || 5, n = (note[id] || "").trim();
    if (!n) return setMsg(m => ({ ...m, [id]: "Please write a short note." }));
    setSaving(s => ({ ...s, [id]: true }));
    try {
      const full = await ensureDetails(trip);
      const fd = new FormData();
      fd.append("user_id", uid);
      fd.append("trip_id", String(id));
      fd.append("title", full.titlePlan || full.title || "My Trip");
      fd.append("rating", String(r));
      fd.append("notes", n);
      fd.append("country", guessCountry(full.titlePlan || full.title || ""));
      fd.append("eventCalender", JSON.stringify(full.eventCalender || []));
      fd.append("start_date", full.startDate || "");
      fd.append("end_date", full.endDate || "");
      (files[id] || []).forEach(f => fd.append("photos[]", f));

      const res = await fetch(`${API_BASE}/insert_story.php`, { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Error saving trip.");

      setOpen(o => ({ ...o, [id]: false }));
      setNote(ns => ({ ...ns, [id]: "" }));
      setFiles(fs => ({ ...fs, [id]: [] }));
      setMsg(m => ({ ...m, [id]: "Shared ✓" }));
      await loadShared();
    } catch (e) {
      setMsg(m => ({ ...m, [id]: e.message || "Network error" }));
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  }, [uid, rating, note, files, ensureDetails, loadShared]);

  return (
    <div className="history-container">
      <h2>My Trips</h2>

      <div className="tabs">
        <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>History</button>
        <button className={`tab ${tab === "shared" ? "active" : ""}`} onClick={() => setTab("shared")}>Shared/Archived</button>
      </div>

      {list.length === 0 ? (
        <p className="msg">{tab === "history" ? "No trips left to share." : "No shared trips yet."}</p>
      ) : (
        <div className="history-grid">
          {list.map((t, i) => {
            const id = Number(t.id || t.trip_id);
            const previewSrc = t.eventCalender?.length ? t.eventCalender : (t.places || []);
            const preview = Array.isArray(previewSrc) ? previewSrc.slice(0, 3) : [];
            const isOpen = !!open[id];
            const title = cleanTitle(t.titlePlan || t.title || "My Trip");

            return (
              <div key={keyOf(t, i)} className="history-card">
                <div className="card-header">
                  <h3 className="card-title">{title}</h3>
                  {tab === "shared"
                    ? <div className="pill blue">Shared on&nbsp;{fmt(t.created_at)}{t.duration_days ? ` · ${t.duration_days} days` : ""}</div>
                    : <div className="pill">— Ended</div>}
                </div>

                <div className="card-body">
                  <div className="vp-title">Visited Places</div>
                  <ul className="visited-places">
                    {preview.length
                      ? preview.map((p, idx) => (
                          <li key={idx}><strong>{p?.title || p?.name || "Untitled"}</strong>{p?.type ? ` (${p.type})` : ""}</li>
                        ))
                      : <li>No visited places recorded.</li>}
                  </ul>

                  {tab === "history" && !isOpen && (
                    <div className="actions">
                      <button className="btn btn-ghost" onClick={() => openDetails(t)}>More details</button>
                      <button className="btn btn-primary" onClick={() => setOpen(o => ({ ...o, [id]: true }))}>Share</button>
                    </div>
                  )}

                  {tab === "history" && isOpen && (
                    <div className="share-editor">
                      <label className="lbl">Rate your trip</label>
                      <Stars value={rating[id] || 5} onChange={(v) => setRating(r => ({ ...r, [id]: v }))} />
                      <label className="lbl">Notes</label>
                      <textarea className="input textarea" value={note[id] || ""}
                        onChange={(e) => setNote(ns => ({ ...ns, [id]: e.target.value }))}
                        placeholder="What stood out? Any tips for others?" />
                      <label className="lbl">Photos (optional)</label>
                      <input className="input" type="file" accept="image/*" multiple
                        onChange={(e) => { onPick(id, e.target.files); e.target.value = ""; }} />
                      {(files[id]?.length) > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          {files[id].map((f, ix) => (
                            <div key={ix} style={{ position: "relative" }}>
                              <img src={URL.createObjectURL(f)} alt=""
                                style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }} />
                              <button type="button" onClick={() => delPicked(id, ix)} title="Remove"
                                style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%",
                                  border: "none", background: "#0008", color: "#fff", cursor: "pointer", lineHeight: "20px" }}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="actions">
                        <button className="btn btn-primary" onClick={() => submitShare(t)} disabled={!!saving[id]}>
                          {saving[id] ? "Saving..." : "Done"}
                        </button>
                        <button className="btn btn-ghost" onClick={() => setOpen(o => ({ ...o, [id]: false }))}>Cancel</button>
                      </div>
                      {msg[id] && <div className="msg">{msg[id]}</div>}
                    </div>
                  )}

                  {tab === "shared" && (
                    <div className="actions">
                      <button className="btn btn-ghost" onClick={() => openDetails(t)}>More details</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {details && (
        <div className="sys-layer" onClick={() => setDetails(null)}>
          <div className="sys-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="sys-close" onClick={() => setDetails(null)}>×</button>
            <h3 className="sys-dialog-title">{cleanTitle(details.titlePlan || details.title || "Trip details")}</h3>

            <div className="meta-row">
              {details.startDate && details.endDate &&
                <div className="meta-item"><span className="meta-label">Trip dates</span>
                  <span className="meta-value">{details.startDate} → {details.endDate}</span></div>}
              {details.created_at &&
                <div className="meta-item"><span className="meta-label">Shared on</span>
                  <span className="meta-value">{fmt(details.created_at)}</span></div>}
              {details.duration_days &&
                <div className="meta-item"><span className="meta-label">Duration</span>
                  <span className="meta-value">{details.duration_days} days</span></div>}
            </div>

            <ul className="sys-dialog-meta">
              {(details.eventCalender?.length ? details.eventCalender : (details.places || []))
                .map((e, i) => (
                  <li key={i}><b>{e.title || e.name || "Untitled"}</b>
                    {e.type ? ` — ${e.type}` : ""}{(e.start && e.end) ? ` — ${e.start} → ${e.end}` : ""}</li>
                ))}
            </ul>

            <div className="sys-dialog-actions">
              <button className="sys-btn sys-btn-primary" onClick={() => setDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
