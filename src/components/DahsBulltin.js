import React, { useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../fire";
import "./DahsBulltin.css";

const API_BASE =
  window.__API_BASE__ ||
  localStorage.getItem("apiBase") ||
  "http://localhost:8080/www/tripmasterv01/public";

export default function DahsBulltin() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const canPost = useMemo(() => !!user, [user]);

  const [form, setForm] = useState({
    type: "help",
    customType: "",
    title: "",
    description: "",
    location: "",
    trip_start: "",
    trip_end: "",
    contact: "",
  });

  const onChange = useCallback(
    (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value })),
    []
  );

  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const submit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!canPost) {
        setMessageType("error");
        setMessage("Please sign in to publish a notice.");
        return;
      }
      if (!form.title.trim() || !form.description.trim()) {
        setMessageType("error");
        setMessage("Title and Description are required.");
        return;
      }

      const trip_dates =
        form.trip_start && form.trip_end
          ? `${form.trip_start} → ${form.trip_end}`
          : form.trip_start || form.trip_end || "";

      const finalType =
        form.type === "other" && form.customType.trim()
          ? form.customType.trim()
          : form.type;

      setPosting(true);
      setMessage("");
      setMessageType("");

      try {
        const res = await fetch(`${API_BASE}/insert_notice.php`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user?.uid || "",
            name: user?.displayName || "",
            contact: form.contact || user?.email || "",
            type: finalType,
            title: form.title,
            description: form.description,
            location: form.location,
            trip_dates,
          }),
        });
        const data = await res.json();

        if (data?.ok && data?.id) {
          localStorage.setItem("lastPostedNoticeId", String(data.id));
          setMessageType("success");
          setMessage("✅ Published successfully.");
          setForm({
            type: "help",
            customType: "",
            title: "",
            description: "",
            location: "",
            trip_start: "",
            trip_end: "",
            contact: "",
          });
        } else {
          setMessageType("error");
          setMessage(data?.error || "Failed to save. Please try again.");
        }
      } catch (err) {
        console.error(err);
        setMessageType("error");
        setMessage("Network error. Please check your server.");
      } finally {
        setPosting(false);
      }
    },
    [canPost, form, user]
  );

  return (
    <div className="nb-wrapper">
      <h1 className="nb-h1">Bulletin Board</h1>
      <p className="nb-subtitle">
        Post and browse requests for help, ride-sharing, hotel mates, collaborations, and more.
      </p>

      <section className="nb-card">
        <div className="nb-card-head">
          <h2 className="nb-h2">Create a Notice</h2>
          {!canPost && <span className="nb-hint">Sign in to publish</span>}
        </div>

        <form onSubmit={submit} className="nb-form">
          <div className="nb-grid">
            {/* Type */}
            <label className="nb-field">
              <span className="nb-label">Type</span>
              <select
                name="type"
                value={form.type}
                onChange={onChange}
                className="nb-input"
                disabled={!canPost || posting}
              >
                <option value="help">Help Request</option>
                <option value="rideshare">Ride Share</option>
                <option value="collab">Collaboration</option>
                <option value="network">Networking</option>
                <option value="other">Other</option>
              </select>
            </label>

            {/* Custom Type */}
            {form.type === "other" && (
              <label className="nb-field">
                <span className="nb-label">Custom Type</span>
                <input
                  name="customType"
                  value={form.customType}
                  onChange={onChange}
                  placeholder="Describe your custom reason…"
                  className="nb-input"
                  disabled={!canPost || posting}
                />
              </label>
            )}

            {/* Title */}
            <label className="nb-field nb-col-2">
              <span className="nb-label">Title</span>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Looking for a hotel mate in Tel Aviv"
                className="nb-input"
                disabled={!canPost || posting}
              />
            </label>

            {/* Description */}
            <label className="nb-field nb-col-2">
              <span className="nb-label">Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Explain your request/offer clearly."
                className="nb-input nb-textarea"
                disabled={!canPost || posting}
              />
            </label>

            {/* Location */}
            <label className="nb-field">
              <span className="nb-label">Location</span>
              <input
                name="location"
                value={form.location}
                onChange={onChange}
                placeholder="City / Country"
                className="nb-input"
                disabled={!canPost || posting}
              />
            </label>

            {/* Trip Start */}
            <label className="nb-field">
              <span className="nb-label">Trip Start</span>
              <input
                type="date"
                name="trip_start"
                value={form.trip_start}
                onChange={onChange}
                className="nb-input"
                disabled={!canPost || posting}
              />
            </label>

            {/* Contact */}
            <label className="nb-field nb-col-2">
              <span className="nb-label">Contact</span>
              <input
                name="contact"
                value={form.contact}
                onChange={onChange}
                placeholder="Email / WhatsApp (visible to others)"
                className="nb-input"
                disabled={!canPost || posting}
              />
            </label>
          </div>

          <div className="nb-actions">
            <button type="submit" className="nb-btn" disabled={!canPost || posting}>
              {posting ? "Publishing..." : "Publish Notice"}
            </button>
            {message && (
              <span
                className="nb-msg"
                style={{ color: messageType === "success" ? "#16a34a" : "#dc2626" }}
              >
                {message}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
