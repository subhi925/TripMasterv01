// path: src/pages/DahsBulltin.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../fire";
import "./DahsBulltin.css";

//----------------------------
// 🔹 API Base URL
// Determines backend API base endpoint (can be defined globally or stored locally)
//----------------------------
const API_BASE =
  window.__API_BASE__ ||
  localStorage.getItem("apiBase") ||
  "http://localhost:8080/www/tripmasterv01/public";

export default function DahsBulltin() {
  //----------------------------
  // 🔹 Firebase Authentication State
  // Keeps track of the current logged-in user
  //----------------------------
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  //----------------------------
  // 🔹 Permission Check
  // Determines if a logged-in user can publish a notice
  //----------------------------
  const canPost = useMemo(() => !!user, [user]);

  //----------------------------
  // 🔹 Form State
  // Stores all form field values for the bulletin notice
  //----------------------------
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

  //----------------------------
  // 🔹 Input Change Handler
  // Updates state when any form input changes
  //----------------------------
  const onChange = useCallback(
    (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value })),
    []
  );

  //----------------------------
  // 🔹 UI Feedback States
  // Handles loading indicator, success/error messages
  //----------------------------
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  //----------------------------
  // 🔹 Submit Handler
  // Validates and sends notice data to the backend API
  //----------------------------
  const submit = useCallback(
    async (e) => {
      e.preventDefault();

      // Prevent submission if user is not logged in
      if (!canPost) {
        setMessageType("error");
        setMessage("Please sign in to publish a notice.");
        return;
      }

      // Validate required fields
      if (!form.title.trim() || !form.description.trim()) {
        setMessageType("error");
        setMessage("Title and Description are required.");
        return;
      }

      //----------------------------
      // 🔹 Prepare formatted fields before sending
      //----------------------------
      const trip_dates =
        form.trip_start && form.trip_end
          ? `${form.trip_start} → ${form.trip_end}`
          : form.trip_start || form.trip_end || "";

      const finalType =
        form.type === "other" && form.customType.trim()
          ? form.customType.trim()
          : form.type;

      //----------------------------
      // 🔹 API Request
      // Sends JSON payload to backend endpoint via POST
      //----------------------------
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

        //----------------------------
        // 🔹 Handle API Response
        //----------------------------
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

  //----------------------------
  // 🔹 Component JSX Render
  // Displays bulletin board form and status messages
  //----------------------------
  return (
    <div className="nb-wrapper">
      <h1 className="nb-h1">Bulletin Board</h1>
      <p className="nb-subtitle">
        Post and browse requests for help, ride-sharing, hotel mates,
        collaborations, and more.
      </p>

      {/* ---------------------------- CREATE NOTICE FORM ---------------------------- */}
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
                disabled={!canPost || posting}>
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

            {/* Trip End */}
            <label className="nb-field">
              <span className="nb-label">Trip End</span>
              <input
                type="date"
                name="trip_end"
                value={form.trip_end}
                onChange={onChange}
                className="nb-input"
                disabled={!canPost || posting}
              />
            </label>

            {/* Contact Info */}
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

          {/* Submit Button + Feedback */}
          <div className="nb-actions">
            <button
              type="submit"
              className="nb-btn"
              disabled={!canPost || posting}>
              {posting ? "Publishing..." : "Publish Notice"}
            </button>

            {message && (
              <span
                className="nb-msg"
                style={{
                  color: messageType === "success" ? "#16a34a" : "#dc2626",
                }}>
                {message}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
