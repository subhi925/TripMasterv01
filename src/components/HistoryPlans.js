// path: src/components/HistoryPlans.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./HistoryPlans.css";

/* ================= إعدادات عامة ================= */
// عنوان الـAPI (يمكنك ضبطه عالميًا عبر window.API_BASE)
const API_BASE =
  window.API_BASE || "http://localhost:8080/www/tripmasterv01/public";

// ====== مساعدين عامّين ======
// (עברית) פונקציה לשחזור מערך מ־JSON
const parseArr = (v) => {
  if (Array.isArray(v)) return v;
  try {
    const j = JSON.parse(v || "[]");
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
};

// (עברית) לזהות מזהה אמין (id) שמגיע מהשרת
const getId = (row) => {
  const cand = row?.id ?? row?.trip_id ?? row?.story_id;
  const n = Number(String(cand ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
};

// (עברית) לנרמל אובייקט מסד־נתונים לשדות אחידים בפרונט
const normalizeItem = (x) => ({
  ...x,
  id: getId(x), // <-- سنعتمد عليه في كل مكان
  user_id: x.user_id || x.userid || "",
  title: x.title || x.titlePlan || "My Trip",
  start_date: x.start_date || x.startDate || "",
  end_date: x.end_date || x.endDate || "",
  eventCalender: parseArr(x.eventCalender),
  images: parseArr(x.images),
  notes: typeof x.notes === "string" ? x.notes : x.notes || "",
  rating: Number(x.rating || 0),
  created_at: x.created_at || "",
  isShared: Number(x.isShared || 0),
});

// (עברית) ימי טיול — לפי start/end או לפי יומן אירועים
const computeDays = (item) => {
  const s =
    item?.start_date && new Date(String(item.start_date).replace(" ", "T"));
  const e = item?.end_date && new Date(String(item.end_date).replace(" ", "T"));
  if (s && e && !isNaN(s) && !isNaN(e)) {
    s.setHours(0, 0, 0, 0);
    e.setHours(0, 0, 0, 0);
    const diff = Math.round((e - s) / 86400000) + 1;
    return Math.max(1, diff);
  }
  const set = new Set();
  parseArr(item?.eventCalender).forEach((ev) => {
    const a = ev?.start && new Date(ev.start);
    const b = ev?.end && new Date(ev.end || ev.start);
    if (!a && !b) return;
    const st = new Date(a || b),
      en = new Date(b || a);
    st.setHours(0, 0, 0, 0);
    en.setHours(0, 0, 0, 0);
    for (let d = new Date(st); d <= en; d.setDate(d.getDate() + 1)) {
      set.add(d.toISOString().slice(0, 10));
    }
  });
  return set.size || 0;
};

const fmt = (s) =>
  s ? new Date(String(s).replace(" ", "T")).toLocaleString() : "—";
const toAbs = (rel) =>
  /^https?:\/\//i.test(rel || "")
    ? rel
    : `${API_BASE}/${String(rel || "").replace(/^\//, "")}`;

// استبدل tryGetJSON كلها بهذا الشكل في الملفين
const tryGetJSON = async (url, fetchOpts = {}) => {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    ...fetchOpts,
  });
  const raw = await res.text();
  const clean = raw.replace(/^\uFEFF/, "").trim();

  let json;
  try {
    json = JSON.parse(clean);
  } catch {
    console.error("Invalid JSON from:", url, "\nRAW:", raw);
    throw new Error(`Invalid JSON from ${url}`);
  }

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error || `HTTP ${res.status}`);
  }
  return json;
};

/* =============== רכיבי דירוג כוכבים =============== */
const Star = ({ on, onClick, onMouseEnter }) => (
  <button
    type="button"
    className={`star ${on ? "on" : ""}`}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    aria-label="star"
  >
    ★
  </button>
);

const Stars = ({ value = 5, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="stars" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          on={shown >= n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
        />
      ))}
    </div>
  );
};

/* =============== Dialog تفاصيل موحَّد للصفحتين =============== */
function DetailsDialog({ item, onClose }) {
  if (!item) return null;
  const images = parseArr(item.images);
  const ev = parseArr(item.eventCalender);

  return (
    <div className="sys-layer" onClick={onClose}>
      <div
        className="sys-dialog sys-dialog--xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="sys-close" onClick={onClose}>
          ×
        </button>

        <header className="dlg-head">
          <h3 className="dlg-title">{item.title || "Trip details"}</h3>
          <div className="dlg-sub">
            <span>{fmt(item.start_date)}</span>
            <span>—</span>
            <span>{fmt(item.end_date)}</span>
            <span className="sys-stars">
              {"★".repeat(Number(item.rating) || 0) || "—"}
            </span>
          </div>
        </header>

        {images.length ? (
          <div className="sys-gallery-grid">
            {images.map((src, i) => (
              <div key={i} className="sys-gallery-cell">
                <img src={toAbs(src)} alt="" />
              </div>
            ))}
          </div>
        ) : (
          <div className="sys-noimg">No photos</div>
        )}

        <div className="dlg-two">
          <section>
            <h4>Trip info</h4>
            <table className="sys-table">
              <tbody>
                <tr>
                  <th>Created</th>
                  <td>{fmt(item.created_at)}</td>
                </tr>
                <tr>
                  <th>Duration</th>
                  <td>{computeDays(item) || "—"} days</td>
                </tr>
                <tr>
                  <th>Notes</th>
                  <td>{item.notes || "—"}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h4>Itinerary</h4>
            {ev.length ? (
              <table className="sys-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {ev.map((e, i) => (
                    <tr key={i}>
                      <td>{e.title || "Untitled"}</td>
                      <td>{e.type || "—"}</td>
                      <td>
                        {e.start}
                        {e.end ? ` → ${e.end}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="sys-muted">No itinerary found.</div>
            )}
          </section>
        </div>

        <div className="sys-dialog-actions">
          <button className="sys-btn sys-btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===================== الصفحة الرئيسية ===================== */
export default function HistoryPlans({
  uid = localStorage.getItem("uid") || "AyBlBZh2UahcPz5jz2eWtjYJpRw1",
}) {
  const [tab, setTab] = useState("history"); // history | shared
  const [hist, setHist] = useState([]);
  const [shared, setShared] = useState([]);

  // حالات لكل بطاقة على أساس id (כדי לא "ידביק" בין כרטיסים)
  const [open, setOpen] = useState({}); // محرّر الشير المفتوح
  const [rating, setRating] = useState({});
  const [note, setNote] = useState({});
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState({});
  const [details, setDetails] = useState(null);

  /* تحميل القائمة من history */
  const loadHistory = useCallback(async () => {
    if (!uid) {
      setHist([]);
      return;
    }
    try {
      const res = await tryGetJSON(
        `${API_BASE}/hist_list.php?uid=${encodeURIComponent(uid)}`
      );
      const items = Array.isArray(res.items)
        ? res.items.map(normalizeItem)
        : [];
      setHist(items.filter((it) => it.id > 0)); // لا نعرض بدون id
    } catch {
      setHist([]);
    }
  }, [uid]);

  /* تحميل shared (لكن نعرض فقط رحلات المستخدم الحالي) */
  const loadShared = useCallback(async () => {
    try {
      const res = await tryGetJSON(`${API_BASE}/hist_shared_list.php?sort=new`);
      const items = Array.isArray(res.items)
        ? res.items.map(normalizeItem)
        : [];
      setShared(items.filter((it) => it.id > 0));
    } catch {
      setShared([]);
    }
  }, [uid]);

  useEffect(() => {
    loadHistory();
    loadShared();
  }, [loadHistory, loadShared]);

  const list = tab === "history" ? hist : shared;

  /* اختيار صور لكل بطاقة */
  const onPick = (id, listFile) => {
    const inc = Array.from(listFile || []);
    setFiles((prev) => {
      const merged = [...(prev[id] || []), ...inc];
      const seen = new Set();
      const out = [];
      for (const f of merged) {
        const k = [f.name, f.size, f.lastModified].join("|");
        if (!seen.has(k)) {
          seen.add(k);
          out.push(f);
        }
      }
      return { ...prev, [id]: out.slice(0, 12) };
    });
  };
  const delPicked = (id, i) =>
    setFiles((p) => {
      const a = [...(p[id] || [])];
      a.splice(i, 1);
      return { ...p, [id]: a };
    });

  /* إرسال مشاركة (Story) لرحلة من الهستوري */
  const submitShare = useCallback(
    async (trip) => {
      const id = getId(trip);
      if (!id) {
        setMsg((m) => ({ ...m, 0: "Missing trip id" }));
        return;
      }
      const r = rating[id] || 5;
      const n = (note[id] || "").trim();
      if (!n) {
        setMsg((m) => ({ ...m, [id]: "Please write a short note." }));
        return;
      }

      setSaving((s) => ({ ...s, [id]: true }));
      try {
        const fd = new FormData();
        fd.append("user_id", uid);
        fd.append("trip_id", String(id)); // <-- تاريخ/هيستوري id
        fd.append("title", trip.title || "My Trip");
        fd.append("rating", String(r));
        fd.append("notes", n);
        fd.append("eventCalender", JSON.stringify(trip.eventCalender || []));
        fd.append("start_date", trip.start_date || "");
        fd.append("end_date", trip.end_date || "");
        (files[id] || []).forEach((f) => fd.append("photos[]", f));

        const res = await fetch(`${API_BASE}/insert_story.php`, {
          method: "POST",
          body: fd,
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server did not return JSON");
        }
        if (!res.ok || !data?.ok)
          throw new Error(data?.error || "Error saving trip.");

        setOpen((o) => ({ ...o, [id]: false }));
        setNote((ns) => ({ ...ns, [id]: "" }));
        setFiles((fs) => ({ ...fs, [id]: [] }));
        setMsg((m) => ({ ...m, [id]: "Shared ✓" }));
        await loadShared();
      } catch (e) {
        setMsg((m) => ({ ...m, [id]: e.message || "Network error" }));
      } finally {
        setSaving((s) => ({ ...s, [id]: false }));
      }
    },
    [uid, rating, note, files, loadShared]
  );

  /* فتح التفاصيل */
  const openDetails = useCallback(async (item) => {
    const id = getId(item);
    if (!id) {
      alert("Missing id");
      return;
    }
    try {
      const j = await tryGetJSON(`${API_BASE}/hist_get_by_id.php?id=${id}`);
      setDetails(normalizeItem(j.item));
    } catch (e) {
      alert(e.message || "Failed to load details");
    }
  }, []);

  return (
    <div className="history-container">
      <h2>My Trips</h2>
      <div className="tabs">
        <button
          className={`tab ${tab === "history" ? "active" : ""}`}
          onClick={() => setTab("history")}
        >
          History
        </button>
        <button
          className={`tab ${tab === "shared" ? "active" : ""}`}
          onClick={() => setTab("shared")}
        >
          Shared/Archived
        </button>
      </div>
      {list.length === 0 ? (
        <p className="msg">
          {tab === "history"
            ? "No trips left to share."
            : "No shared trips yet."}
        </p>
      ) : (
        <div className="history-grid">
          {list.map((t) => {
            const id = getId(t);
            const title = t.title || "My Trip";
            const days = computeDays(t);
            const previewSrc = t.eventCalender?.length
              ? t.eventCalender
              : t.places || [];
            const preview = Array.isArray(previewSrc)
              ? previewSrc.slice(0, 3)
              : [];

            return (
              <div key={`hist-${id}`} className="history-card">
                <div className="card-header">
                  <h3 className="card-title">{title}</h3>
                  {tab === "shared" ? (
                    <div className="pill blue">
                      Shared on&nbsp;{fmt(t.created_at)}
                      {days ? ` · ${days} days` : ""}
                    </div>
                  ) : (
                    <div className="pill">
                      — Ended{days ? ` · ${days} days` : ""}
                    </div>
                  )}
                </div>

                <div className="card-body">
                  <div className="vp-title">Visited Places</div>
                  <ul className="visited-places">
                    {preview.length ? (
                      preview.map((p, idx) => (
                        <li key={`${id}-vp-${idx}`}>
                          <strong>{p?.title || p?.name || "Untitled"}</strong>
                          {p?.type ? ` (${p.type})` : ""}
                        </li>
                      ))
                    ) : (
                      <li>No visited places recorded.</li>
                    )}
                  </ul>

                  {tab === "history" && !open[id] && (
                    <div className="actions">
                      <button
                        className="btn btn-ghost"
                        onClick={() => openDetails(t)}
                        disabled={!id}
                      >
                        More details
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => setOpen((o) => ({ ...o, [id]: true }))}
                        disabled={!id}
                      >
                        Share
                      </button>
                    </div>
                  )}

                  {tab === "history" && open[id] && (
                    <div className="share-editor">
                      <label className="lbl">Rate your trip</label>
                      <Stars
                        value={rating[id] || 5}
                        onChange={(v) => setRating((r) => ({ ...r, [id]: v }))}
                      />

                      <label className="lbl">Notes</label>
                      <textarea
                        className="input textarea"
                        value={note[id] || ""}
                        onChange={(e) =>
                          setNote((ns) => ({ ...ns, [id]: e.target.value }))
                        }
                        placeholder="What stood out? Any tips for others?"
                      />

                      <label className="lbl">Photos (optional)</label>
                      <input
                        className="input"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          onPick(id, e.target.files);
                          e.target.value = "";
                        }}
                      />
                      {(files[id]?.length || 0) > 0 && (
                        <div className="thumbs">
                          {files[id].map((f, ix) => (
                            <div key={`${id}-f-${ix}`} className="thumb">
                              <img src={URL.createObjectURL(f)} alt="" />
                              <button
                                type="button"
                                className="thumb-x"
                                onClick={() => delPicked(id, ix)}
                                title="Remove"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="actions">
                        <button
                          className="btn btn-primary"
                          onClick={() => submitShare(t)}
                          disabled={!id || !!saving[id]}
                        >
                          {saving[id] ? "Saving..." : "Done"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() =>
                            setOpen((o) => ({ ...o, [id]: false }))
                          }
                        >
                          Cancel
                        </button>
                      </div>
                      {msg[id] && <div className="msg">{msg[id]}</div>}
                    </div>
                  )}

                  {tab === "shared" && (
                    <div className="actions">
                      <button
                        className="btn btn-ghost"
                        onClick={() => openDetails(t)}
                        disabled={!id}
                      >
                        More details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {details && (
        <DetailsDialog item={details} onClose={() => setDetails(null)} />
      )}
         
    </div>
  );
}
