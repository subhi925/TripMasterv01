import React, { useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../fire";
import "./DahsBulltin.css";

const API_BASE =
  window.__API_BASE__ ||
  localStorage.getItem("apiBase") ||
  "http://localhost:8080/www/tripmasterv01/public";

/** Renders the publish form. Stays on the same page and shows a success message on submit. */
export default function DahsBulltin() {
  /** Subscribes to Firebase auth and stores the current user. */
  const [user, setUser] = useState(null);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  /** Derived boolean: whether the user is allowed to post. */
  const canPost = useMemo(() => !!user, [user]);

  /** Controlled form state for all inputs (includes customType for "Other"). */
  const [form, setForm] = useState({
    type: "help",
    customType: "",      // ← shown only when type === "other"
    title: "",
    description: "",
    location: "",
    trip_start: "",
    trip_end: "",
    contact: "",
  });

  /** Generic change handler for inputs. */
  const onChange = useCallback(
    (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value })),
    []
  );

  /** UI feedback (button loading + success / error text). */
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" | "error" | ""

  /**
   * Handles form submit:
   * - Validates fields.
   * - Builds finalType: uses customType when type === "other".
   * - Calls insert_notice.php.
   * - On success: shows message (no navigation), resets form, and stores new id for highlighting later.
   */
  const submit = useCallback(async (e) => {
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

    // Build the trip date string as before
    const trip_dates =
      form.trip_start && form.trip_end
        ? `${form.trip_start} → ${form.trip_end}`
        : form.trip_start || form.trip_end || "";

    // Use the custom reason when "Other" is selected
    const finalType =
      form.type === "other" && form.customType.trim()
        ? form.customType.trim()
        : form.type;

    setPosting(true);
    setMessage(""); setMessageType("");

    try {
      const res = await fetch(`${API_BASE}/insert_notice.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.uid || "",
          name: user?.displayName || "",
          contact: form.contact || user?.email || "",
          type: finalType,                // ← send resolved type
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
  }, [canPost, form, user]);

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
            <div className="nb-field">
              <label className="nb-label">Type</label>
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
            </div>

            {/* Custom Type – appears only when "Other" is selected */}
            {form.type === "other" && (
              <div className="nb-field">
                <label className="nb-label">Custom Type</label>
                <input
                  name="customType"
                  value={form.customType}
                  onChange={onChange}
                  placeholder="Describe your custom reason…"
                  className="nb-input"
                  disabled={!canPost || posting}
                />
              </div>
            )}

            {/* Title */}
            <div className="nb-field nb-col-2">
              <label className="nb-label">Title</label>
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                placeholder="Looking for a hotel mate in Tel Aviv"
                className="nb-input"
                disabled={!canPost || posting}
              />
            </div>

            {/* Description */}
            <div className="nb-field nb-col-2">
              <label className="nb-label">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Explain your request/offer clearly."
                className="nb-input nb-textarea"
                disabled={!canPost || posting}
              />
            </div>

            {/* Location */}
            <div className="nb-field">
              <label className="nb-label">Location</label>
              <input
                name="location"
                value={form.location}
                onChange={onChange}
                placeholder="City / Country"
                className="nb-input"
                disabled={!canPost || posting}
              />
            </div>

            {/* Trip Start */}
            <div className="nb-field">
              <label className="nb-label">Trip Start</label>
              <input
                type="date"
                name="trip_start"
                value={form.trip_start}
                onChange={onChange}
                className="nb-input"
                disabled={!canPost || posting}
              />
            </div>

            {/* Contact */}
            <div className="nb-field nb-col-2">
              <label className="nb-label">Contact</label>
              <input
                name="contact"
                value={form.contact}
                onChange={onChange}
                placeholder="Email / WhatsApp (visible to others)"
                className="nb-input"
                disabled={!canPost || posting}
              />
            </div>
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
