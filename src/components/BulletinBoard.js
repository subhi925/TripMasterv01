import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./BulletinBoard.css";

/* 
  BulletinBoard Component
  ------------------------------------------------------------
  Displays community notices (posts) with search, filters,
  sorting, and pagination. Each notice may include a title,
  description, trip dates, location, and contact info.
*/

//------------------------------------------------------------
// API Base Detection (fallback if not in localStorage)
//------------------------------------------------------------
const getApiBase = () =>
  localStorage.getItem("apiBase") ||
  window.__API_BASE__ ||
  window._API_BASE_ ||
  "http://localhost:8080/www/tripmasterv01/public";

const API_BASE = getApiBase();

//------------------------------------------------------------
// Main Component
//------------------------------------------------------------
export default function BulletinBoard() {
  //------------------------------------------------------------
  // Helper: Display human-friendly time ("5m ago", "2h ago", etc.)
  //------------------------------------------------------------
  const friendlyTime = useCallback((iso) => {
    const d = new Date(iso);
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return "Just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return d.toLocaleString();
  }, []);

  //------------------------------------------------------------
  // Helper: Check if a date is within 7 days (mark as "Urgent")
  //------------------------------------------------------------
  const isUrgent = useCallback((tripDatesOrStart) => {
    const raw = String(tripDatesOrStart || "");
    const start = raw.includes("→") ? raw.split("→")[0].trim() : raw.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return false;
    const days = (new Date(start) - new Date()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }, []);

  //------------------------------------------------------------
  // Component States
  //------------------------------------------------------------
  const [items, setItems] = useState([]); // fetched notices
  const [loading, setLoading] = useState(true); // loading indicator
  const [page, setPage] = useState(1); // current page
  const [totalPages, setTotalPages] = useState(1); // total pages from API
  const [filters, setFilters] = useState({ q: "", type: "all", sort: "new" }); // search/filter options

  //------------------------------------------------------------
  // Function: Fetch notices from API with error handling
  //------------------------------------------------------------
  const loadPage = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const url = `${API_BASE}/get_notices.php?page=${p}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status} — ${text.slice(0, 200)}`);
      }

      const data = await res.json();
      if (Array.isArray(data?.items)) {
        setItems(data.items);
        setPage(data.page || 1);
        setTotalPages(data.total_pages || 1);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error("Load notices failed:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  //------------------------------------------------------------
  // Effect: Initial load
  //------------------------------------------------------------
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  //------------------------------------------------------------
  // Highlight recently posted notice (from localStorage)
  //------------------------------------------------------------
  const [highlightId, setHighlightId] = useState(null);
  useEffect(() => {
    const id = localStorage.getItem("lastPostedNoticeId");
    if (id) {
      setHighlightId(String(id));
      localStorage.removeItem("lastPostedNoticeId");
    }
  }, []);

  //------------------------------------------------------------
  // Client-side filtering and sorting (after fetch)
  //------------------------------------------------------------
  const filtered = useMemo(() => {
    return items
      .filter((it) =>
        filters.type === "all"
          ? true
          : String(it.type).toLowerCase() === filters.type.toLowerCase()
      )
      .filter((it) =>
        filters.q
          ? (it.title + " " + it.description)
              .toLowerCase()
              .includes(filters.q.toLowerCase())
          : true
      )
      .sort((a, b) =>
        filters.sort === "new"
          ? new Date(b.created_at) - new Date(a.created_at)
          : new Date(a.created_at) - new Date(b.created_at)
      );
  }, [filters, items]);

  //------------------------------------------------------------
  // Render Component
  //------------------------------------------------------------
  return (
    <div className="bb-wrapper">
      <h1 className="nb-h1">Bulletin Board</h1>
      <p className="nb-subtitle">Browse recent notices from travelers.</p>

      {/* ===================== FILTER BAR ===================== */}
      <section className="nb-card">
        <div className="nb-filters">
          <input
            className="nb-input"
            placeholder="Search…"
            value={filters.q}
            onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
          />

          <select
            className="nb-input"
            value={filters.type}
            onChange={(e) =>
              setFilters((s) => ({ ...s, type: e.target.value }))
            }>
            <option value="all">All types</option>
            <option value="help">Help Request</option>
            <option value="rideshare">Ride Share</option>
            <option value="collab">Collaboration</option>
            <option value="network">Networking</option>
            <option value="other">Other</option>
          </select>

          <select
            className="nb-input"
            value={filters.sort}
            onChange={(e) =>
              setFilters((s) => ({ ...s, sort: e.target.value }))
            }>
            <option value="new">Newest</option>
            <option value="old">Oldest</option>
          </select>

          <button
            className="nb-pageBtn"
            onClick={() => setFilters({ q: "", type: "all", sort: "new" })}>
            Reset
          </button>
        </div>

        {/* ===================== LIST AREA ===================== */}
        {loading ? (
          <p>Loading...</p>
        ) : filtered.length === 0 ? (
          <p>No notices yet.</p>
        ) : (
          <ul className="nb-list">
            {filtered.map((it) => {
              const urgent = isUrgent(it.trip_dates);
              const pulse =
                String(it.id) === String(highlightId) ? "nb-pulse" : "";
              return (
                <li
                  key={it.id}
                  className={`nb-item ${urgent ? "is-urgent" : ""} ${pulse}`}>
                  <div className="nb-item-head">
                    <span className="nb-badge">{it.type}</span>
                    {urgent && <span className="nb-chip-urgent">Urgent</span>}
                    <time className="nb-time">
                      {friendlyTime(it.created_at)}
                    </time>
                  </div>

                  <h3 className="nb-title">{it.title}</h3>
                  <p className="nb-desc">{it.description}</p>

                  <div className="nb-meta">
                    {it.location && <span>📍 {it.location}</span>}
                    {it.trip_dates && <span>🗓 {it.trip_dates}</span>}
                    {it.contact && <span>✉️ {it.contact}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* ===================== PAGINATION ===================== */}
        <div className="nb-pagination">
          <button
            className="nb-pageBtn"
            disabled={page <= 1}
            onClick={() => loadPage(page - 1)}>
            Prev
          </button>

          <span className="nb-pageInfo">
            Page {page} of {totalPages}
          </span>

          <button
            className="nb-pageBtn"
            disabled={page >= totalPages}
            onClick={() => loadPage(page + 1)}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
