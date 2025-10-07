// path: src/components/ShareYourStory.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./ShareYourStory.css";

/* ================= إعدادات عامة ================= */
const API_BASE =
  window.API_BASE || "http://localhost:8080/www/tripmasterv01/public";
const DEFAULT_UID = "AyBlBZh2UahcPz5jz2eWtjYJpRw1";
const getUID = () =>
  localStorage.getItem("uid") || "AyBlBZh2UahcPz5jz2eWtjYJpRw1";
const setUID = (v) => localStorage.setItem("uid", v);

/* ====== مساعدين ====== */
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
});
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

const fmt = (d) =>
  d ? new Date(String(d).replace(" ", "T")).toLocaleString() : "—";
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

const stars = (n) => "★".repeat(Number(n) || 0) || "—";
const useToast = () => {
  const [msg, setMsg] = useState("");
  return {
    msg,
    show: (m) => {
      setMsg(m);
      setTimeout(() => setMsg(""), 1600);
    },
  };
};

/* =============== Dialog تفاصيل مشترك (نفس تبع History) =============== */
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
            <span className="sys-stars">{stars(item.rating)}</span>
          </div>
        </header>

        {images.length ? (
          <div className="sys-gallery-grid">
            {images.map((src, i) => (
              <div className="sys-gallery-cell" key={i}>
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

/* ====================== الصفحة ====================== */
export default function ShareYourStory() {
  // UID
  useEffect(() => {
    if (!getUID()) setUID(DEFAULT_UID);
  }, []);
  const [uidInput, setUidInput] = useState(getUID());

  // فلاتر عرض
  const [q, setQ] = useState("");
  const [daysFilter, setDaysFilter] = useState("any"); // any | 1..6 | 7plus
  const [ratingEq, setRatingEq] = useState("all"); // all | 1..5
  const [sort, setSort] = useState("new"); // new | rating
  const [showFilter, setShowFilter] = useState("all"); // all | cloned | not

  // بيانات
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // تفاصيل ونسخ
  const [details, setDetails] = useState(null);
  const [clone, setClone] = useState({
    open: false,
    item: null,
    date: "",
    submitting: false,
    error: "",
  });

  // قصص مستنسخة محليًا (شارة Cloned)
  const [clonedIds, setClonedIds] = useState(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem("clonedStoryIds") || "[]")
      );
    } catch {
      return new Set();
    }
  });
  const saveCloned = (s) =>
    localStorage.setItem("clonedStoryIds", JSON.stringify([...s]));

  const toast = useToast();

  // تحميل القصص
  const fetchStories = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const u = new URL(`${API_BASE}/hist_shared_list.php`);
      if (q.trim()) u.searchParams.set("q", q.trim());
      if (ratingEq !== "all") u.searchParams.set("ratingEq", ratingEq);
      if (sort) u.searchParams.set("sort", sort);
      const data = await tryGetJSON(u.toString());
      const arr = Array.isArray(data.items)
        ? data.items.map(normalizeItem)
        : [];
      setItems(arr.filter((it) => it.id > 0));
    } catch (e) {
      setErr(String(e.message || e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [q, ratingEq, sort]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const saveUID = () => {
    if (!uidInput.trim()) return;
    setUID(uidInput.trim());
    toast.show("UID saved ✓");
  };

  // فتح التفاصيل
  const openDetails = async (it) => {
    const id = getId(it);
    if (!id) {
      setErr("Missing id");
      return;
    }
    try {
      const j = await tryGetJSON(`${API_BASE}/hist_get_by_id.php?id=${id}`);
      setDetails(normalizeItem(j.item));
    } catch (e) {
      setErr(String(e.message || e));
    }
  };

  // فتح/إغلاق Cloning
  const openClone = (story) => {
    const id = getId(story);
    if (!id) {
      setErr("Missing id");
      return;
    }
    setClone({
      open: true,
      item: story,
      date: new Date().toISOString().slice(0, 10),
      submitting: false,
      error: "",
    });
  };
  const closeClone = () =>
    setClone({
      open: false,
      item: null,
      date: "",
      submitting: false,
      error: "",
    });

  // تنفيذ النسخ
  const doClone = async (e) => {
    e?.preventDefault();
    e?.stopPropagation?.();
    if (!clone.item) return;
    const s = clone.item;
    const id = getId(s);
    if (!id) {
      setClone((st) => ({ ...st, error: "Missing id" }));
      return;
    }

    const uid = getUID() || s.user_id || "";
    const fd = new FormData();
    fd.append("story_id", String(id)); // history id
    fd.append("title", s.title || "My Trip");
    fd.append("user_id", uid);
    fd.append("new_start_date", clone.date);
    fd.append("duration_days", String(computeDays(s) || 1));

    setClone((st) => ({ ...st, submitting: true, error: "" }));
    try {
      const res = await fetch(`${API_BASE}/clone_from_shared.php`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(`Server did not return JSON`);
      }
      if (!res.ok || !json?.ok)
        throw new Error(json?.error || `HTTP ${res.status}`);

      setClonedIds((prev) => {
        const set = new Set(prev);
        set.add(id);
        saveCloned(set);
        return set;
      });
      closeClone();
      toast.show("Cloned ✓");
    } catch (err) {
      setClone((st) => ({ ...st, error: String(err.message || err) }));
    } finally {
      setClone((st) => ({ ...st, submitting: false }));
    }
  };

  // فلترة محلية
  const filtered = useMemo(() => {
    let arr = [...items];
    if (showFilter === "cloned") arr = arr.filter((x) => clonedIds.has(x.id));
    if (showFilter === "not") arr = arr.filter((x) => !clonedIds.has(x.id));
    if (daysFilter !== "any") {
      arr = arr.filter((x) => {
        const d = computeDays(x);
        if (daysFilter === "7plus") return d >= 7;
        return d === Number(daysFilter);
      });
    }
    return arr;
  }, [items, showFilter, clonedIds, daysFilter]);

  return (
    <div className="sys-wrapper">
      <h1 className="sys-title">Shared Trips</h1>
      {!getUID() && (
        <div className="sys-uid-banner">
          <span>
            Paste your <b>UID</b> (dashboard.userid)
          </span>
          <input
            className="sys-input"
            value={uidInput}
            onChange={(e) => setUidInput(e.target.value)}
            placeholder="Enter UID…"
          />
          <button
            type="button"
            className="sys-btn sys-btn-primary"
            onClick={saveUID}
          >
            Save
          </button>
        </div>
      )}
      {/* فلاتر */}
      <div className="sys-filters">
        <input
          className="sys-input sys-input--w"
          placeholder="Search country, title or notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchStories()}
        />
        <div className="sys-filters-row">
          <select
            className="sys-input"
            value={daysFilter}
            onChange={(e) => setDaysFilter(e.target.value)}
          >
            <option value="any">Any length</option>
            <option value="1">1 day</option>
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="4">4 days</option>
            <option value="5">5 days</option>
            <option value="6">6 days</option>
            <option value="7plus">7+ days</option>
          </select>
          <select
            className="sys-input"
            value={ratingEq}
            onChange={(e) => setRatingEq(e.target.value)}
          >
            <option value="all">All ratings</option>
            <option value="5">★★★★★ (5)</option>
            <option value="4">★★★★ (4)</option>
            <option value="3">★★★ (3)</option>
            <option value="2">★★ (2)</option>
            <option value="1">★ (1)</option>
          </select>
          <select
            className="sys-input"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="new">Newest</option>
            <option value="rating">Top rated</option>
          </select>
          <select
            className="sys-input"
            value={showFilter}
            onChange={(e) => setShowFilter(e.target.value)}
          >
            <option value="all">Show: All</option>
            <option value="cloned">Show: Cloned</option>
            <option value="not">Show: Not cloned</option>
          </select>
          <div className="sys-actions-right">
            <button
              type="button"
              className="sys-btn sys-btn-primary"
              onClick={fetchStories}
            >
              Apply
            </button>
            <button
              type="button"
              className="sys-btn"
              onClick={() => {
                setQ("");
                setDaysFilter("any");
                setRatingEq("all");
                setSort("new");
                setShowFilter("all");
                fetchStories();
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
      {/* المحتوى */}
      {loading ? (
        <p className="sys-muted">Loading…</p>
      ) : err ? (
        <p className="sys-err">{err}</p>
      ) : filtered.length === 0 ? (
        <p className="sys-empty">No stories found.</p>
      ) : (
        <div className="sys-grid">
          {filtered.map((story) => {
            const id = getId(story);
            const imgs = parseArr(story.images);
            const d = computeDays(story);
            const cloned = clonedIds.has(id);
            return (
              <article
                className={`sys-card ${cloned ? "sys-card--cloned" : ""}`}
                key={`story-${id}`}
              >
                <div className="sys-card-body">
                  <header className="sys-card-head">
                    <h3 className="sys-card-title">
                      {story.title || "Untitled Trip"}{" "}
                      {d ? <span className="sys-days">{d} days</span> : null}
                    </h3>
                    <span className="sys-stars">{stars(story.rating)}</span>
                  </header>

                  {imgs.length ? (
                    <div
                      className="sys-thumbs"
                      onClick={() => openDetails(story)}
                      role="button"
                      title="Open details"
                    >
                      {imgs.slice(0, 4).map((src, i) => (
                        <div className="sys-thumb" key={`${id}-${i}`}>
                          <img src={toAbs(src)} alt="" />
                        </div>
                      ))}
                      {imgs.length > 4 && (
                        <div className="sys-more">+{imgs.length - 4}</div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="sys-noimg"
                      onClick={() => openDetails(story)}
                      role="button"
                      title="Open details"
                    >
                      No photos
                    </div>
                  )}

                  <ul className="sys-meta">
                    <li>
                      <b>From:</b> {fmt(story.start_date)}
                    </li>
                    <li>
                      <b>To:</b> {fmt(story.end_date)}
                    </li>
                    <li>
                      <b>Published:</b> {fmt(story.created_at)}
                    </li>
                  </ul>
                  <p className="sys-note">{story.notes || "—"}</p>
                </div>

                <div className="sys-actions">
                  <button
                    type="button"
                    className="sys-btn"
                    onClick={() => openDetails(story)}
                    disabled={!id}
                  >
                    More details
                  </button>
                  {cloned ? (
                    <button
                      type="button"
                      className="sys-btn sys-btn-success"
                      disabled
                    >
                      Cloned
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="sys-btn sys-btn-primary"
                      onClick={() => openClone(story)}
                      disabled={!id}
                    >
                      Clone
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {/* Dialogs */}
      {details && (
        <DetailsDialog item={details} onClose={() => setDetails(null)} />
      )}
      {clone.open && (
        <div className="sys-layer" onClick={closeClone}>
          <div className="sys-dialog" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="sys-close" onClick={closeClone}>
              ×
            </button>
            <h3 className="sys-dialog-title">
              Clone trip — {clone.item?.title}
            </h3>
            <div className="lbl">New start date</div>
            <input
              type="date"
              className="sys-input"
              value={clone.date}
              onChange={(e) =>
                setClone((s) => ({ ...s, date: e.target.value }))
              }
            />
            <div className="sys-hint">
              Original duration will be used automatically.
            </div>
            {clone.error && (
              <div className="sys-err" style={{ marginTop: 8 }}>
                {clone.error}
              </div>
            )}
            <div className="sys-dialog-actions">
              <button
                type="button"
                className="sys-btn"
                onClick={closeClone}
                disabled={clone.submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sys-btn sys-btn-primary"
                onClick={doClone}
                disabled={!clone.date || clone.submitting}
              >
                {clone.submitting ? "Cloning…" : "Clone"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast.msg && <div className="sys-toast">{toast.msg}</div>}
         
    </div>
  );
}
