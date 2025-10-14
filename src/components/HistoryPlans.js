import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./HistoryPlans.css";

/* ================= إعدادات عامة ================= */
const API_BASE =
  window.API_BASE || "http://localhost:8080/www/tripmasterv01/public";

/* ====== مساعدين عامّين ====== */
const parseArr = (v) => {
  if (Array.isArray(v)) return v;
  try {
    const j = JSON.parse(v || "[]");
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
};

const getId = (row) => {
  const cand = row?.id ?? row?.trip_id ?? row?.story_id;
  const n = Number(String(cand ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const normalizeItem = (x) => ({
  ...x,
  rowid: Number(x.rowid || 0), // إن توفر
  id: getId(x),
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

const stateKey = (row) =>
  row?.rowid || getId(row) || `${row?.id}-${row?.created_at}`;

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

/* =============== نجوم التقييم =============== */
const Star = ({ on, onClick, onMouseEnter }) => (
  <button
    type="button"
    className={`star ${on ? "on" : ""}`}
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    aria-label="star">
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

/* =============== Dialog موحَّد (قابل لإخفاء المعرض) =============== */
function DetailsDialog({ item, onClose, showGallery = true }) {
  if (!item) return null;
  const images = parseArr(item.images).map(toAbs);
  const ev = parseArr(item.eventCalender);

  return (
    <div className="sys-layer" onClick={onClose}>
      <div
        className="sys-dialog sys-dialog--xl"
        onClick={(e) => e.stopPropagation()}>
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

        {showGallery && images.length ? (
          <div className="sys-gallery-grid">
            {images.map((src, i) => (
              <div key={i} className="sys-gallery-cell">
                <img src={src} alt="" />
              </div>
            ))}
          </div>
        ) : showGallery ? (
          <div className="sys-noimg">No photos</div>
        ) : null}

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

  // حالات لكل بطاقة على أساس stateKey
  const [open, setOpen] = useState({});
  const [rating, setRating] = useState({});
  const [note, setNote] = useState({});
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState({});
  const [details, setDetails] = useState(null);

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
      setHist(items.filter((it) => it.id > 0));
    } catch {
      setHist([]);
    }
  }, [uid]);

  // داخل HistoryPlans.js

  const loadShared = useCallback(async () => {
    try {
      const res = await tryGetJSON(`${API_BASE}/hist_shared_list.php?sort=new`);
      const items = Array.isArray(res.items)
        ? res.items.map(normalizeItem)
        : [];
      setShared(items.filter((it) => it.id > 0 && it.user_id === uid));
    } catch (e) {
      console.error(e);
      setShared([]);
    }
  }, []);

  const unshare = useCallback(
    async (trip) => {
      const id = getId(trip);
      const sid = stateKey(trip);
      if (!id) return;

      setSaving((s) => ({ ...s, [sid]: true }));
      try {
        const fd = new FormData();
        fd.append("id", String(id));
        fd.append("user_id", uid);

        await tryGetJSON(`${API_BASE}/unshare_story.php`, {
          method: "POST",
          body: fd,
        });
        // بعد نجاح طلب unshare:
        try {
          const id = getId(trip);
          const arr = JSON.parse(
            localStorage.getItem("clonedStoryIds") || "[]"
          );
          const i = arr.indexOf(id);
          if (i > -1) {
            arr.splice(i, 1);
            localStorage.setItem("clonedStoryIds", JSON.stringify(arr));
            // لو صفحة Share مفتوحة في تاب ثانية، خلّيها تحدث حالها
            window.dispatchEvent(
              new StorageEvent("storage", {
                key: "clonedStoryIds",
                newValue: JSON.stringify(arr),
              })
            );
          }
        } catch {}

        // شِلّها من تبويب Shared ورجّعها للـ History
        setShared((list) => list.filter((x) => getId(x) !== id));
        setHist((prev) => [normalizeItem({ ...trip, isShared: 0 }), ...prev]);
        setMsg((m) => ({ ...m, [sid]: "Unshared ✓" }));
      } catch (e) {
        setMsg((m) => ({ ...m, [sid]: e.message || "Failed" }));
      } finally {
        setSaving((s) => ({ ...s, [sid]: false }));
      }
    },
    [uid]
  );

  useEffect(() => {
    loadHistory();
    loadShared();
  }, [loadHistory, loadShared]);

  const list = tab === "history" ? hist : shared;

  /* اختيار صور لكل بطاقة */
  const onPick = (sid, listFile) => {
    const inc = Array.from(listFile || []);
    setFiles((prev) => {
      const merged = [...(prev[sid] || []), ...inc];
      const seen = new Set();
      const out = [];
      for (const f of merged) {
        const k = [f.name, f.size, f.lastModified].join("|");
        if (!seen.has(k)) {
          seen.add(k);
          out.push(f);
        }
      }
      return { ...prev, [sid]: out.slice(0, 12) };
    });
  };
  const delPicked = (sid, i) =>
    setFiles((p) => {
      const a = [...(p[sid] || [])];
      a.splice(i, 1);
      return { ...p, [sid]: a };
    });

  /* إرسال مشاركة (Story) */
  const submitShare = useCallback(
    async (trip) => {
      const id = getId(trip);
      const sid = stateKey(trip);
      if (!id) {
        setMsg((m) => ({ ...m, 0: "Missing trip id" }));
        return;
      }

      const r = rating[sid] || 5;
      const n = (note[sid] || "").trim();
      if (!n) {
        setMsg((m) => ({ ...m, [sid]: "Please write a short note." }));
        return;
      }

      setSaving((s) => ({ ...s, [sid]: true }));
      try {
        const fd = new FormData();
        fd.append("user_id", uid);
        fd.append("trip_id", String(id));
        fd.append("title", trip.title || "My Trip");
        fd.append("rating", String(r));
        fd.append("notes", n);
        fd.append("eventCalender", JSON.stringify(trip.eventCalender || []));
        fd.append("start_date", trip.start_date || "");
        fd.append("end_date", trip.end_date || "");
        (files[sid] || []).forEach((f) => fd.append("photos[]", f));

        const res = await fetch(`${API_BASE}/insert_story.php`, {
          method: "POST",
          body: fd,
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

        // أغلق المحرر ونظف الحالة
        setOpen((o) => ({ ...o, [sid]: false }));
        setNote((ns) => ({ ...ns, [sid]: "" }));
        setFiles((fs) => ({ ...fs, [sid]: [] }));
        setMsg((m) => ({ ...m, [sid]: "Shared ✓" }));
        // بعد النجاح مباشرة
        setHist((h) => h.filter((x) => getId(x) !== id)); // يحذفها محليًا فورًا
        await loadShared(); // يحدّث تبويب Shared
        await loadHistory(); // سطر جديد: يعيد جلب History من السيرفر
        setTab("shared");
        // احذف البطاقة محليًا من history
        setHist((h) => h.filter((x) => getId(x) !== id));

        // حمّل الشيرد وانتقل
        await loadShared();
        setTab("shared");
      } catch (e) {
        setMsg((m) => ({ ...m, [sid]: e.message || "Network error" }));
      } finally {
        setSaving((s) => ({ ...s, [sid]: false }));
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
          onClick={() => setTab("history")}>
          History
        </button>
        <button
          className={`tab ${tab === "shared" ? "active" : ""}`}
          onClick={() => setTab("shared")}>
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
          {list.map((t, idx) => {
            const id = getId(t);
            const KeyId = t.rowid || id || idx;
            const sid = stateKey(t);
            const title = t.title || "My Trip";
            const days = computeDays(t);
            const previewSrc = t.eventCalender?.length
              ? t.eventCalender
              : t.places || [];
            const preview = Array.isArray(previewSrc)
              ? previewSrc.slice(0, 3)
              : [];
            const publishedAt = t.shared_at || t.created_at || "";

            return (
              <div key={`hist-${sid}-${idx}`} className="history-card">
                <div className="card-header">
                  <h3 className="card-title">{title}</h3>
                  {tab === "shared" ? (
                    <div className="pill blue">
                      Shared on&nbsp;{fmt(publishedAt)}
                      {days ? ` · ${days} days` : ""}
                    </div>
                  ) : (
                    <div className="pill">
                      Ended{days ? ` · ${days} days` : ""}
                    </div>
                  )}
                </div>

                <div className="card-body">
                  <div className="vp-title">Visited Places</div>
                  <ul className="visited-places">
                    {preview.length ? (
                      preview.map((p, i) => (
                        <li key={`${sid}-vp-${i}`}>
                          <strong>{p?.title || p?.name || "Untitled"}</strong>
                          {p?.type ? ` (${p.type})` : ""}
                        </li>
                      ))
                    ) : (
                      <li>No visited places recorded.</li>
                    )}
                  </ul>

                  {tab === "history" && !open[sid] && (
                    <div className="actions">
                      <button
                        className="btn btn-ghost"
                        onClick={() => openDetails(t)}
                        disabled={!id}>
                        More details
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => setOpen((o) => ({ ...o, [sid]: true }))}
                        disabled={!id}>
                        Share
                      </button>
                    </div>
                  )}

                  {tab === "history" && open[sid] && (
                    <div className="share-editor">
                      <label className="lbl">Rate your trip</label>
                      <Stars
                        value={rating[sid] || 5}
                        onChange={(v) => setRating((r) => ({ ...r, [sid]: v }))}
                      />

                      <label className="lbl">Notes</label>
                      <textarea
                        className="input textarea"
                        value={note[sid] || ""}
                        onChange={(e) =>
                          setNote((ns) => ({ ...ns, [sid]: e.target.value }))
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
                          onPick(sid, e.target.files);
                          e.target.value = "";
                        }}
                      />
                      {(files[sid]?.length || 0) > 0 && (
                        <div className="thumbs">
                          {files[sid].map((f, ix) => (
                            <div key={`${sid}-f-${ix}`} className="thumb">
                              <img src={URL.createObjectURL(f)} alt="" />
                              <button
                                type="button"
                                className="thumb-x"
                                onClick={() => delPicked(sid, ix)}
                                title="Remove">
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
                          disabled={!id || !!saving[sid]}>
                          {saving[sid] ? "Saving..." : "Done"}
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() =>
                            setOpen((o) => ({ ...o, [sid]: false }))
                          }>
                          Cancel
                        </button>
                      </div>
                      {msg[sid] && <div className="msg">{msg[sid]}</div>}
                    </div>
                  )}
                  {tab === "shared" && (
                    <div className="actions">
                      <button
                        className="btn btn-ghost"
                        onClick={() => openDetails(t)}
                        disabled={!id}>
                        More details
                      </button>
                      <button
                        className="btn"
                        onClick={() => unshare(t)}
                        disabled={!id}>
                        Unshare
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
        <DetailsDialog
          item={details}
          onClose={() => setDetails(null)}
          showGallery={false}
        />
      )}
         
    </div>
  );
}
