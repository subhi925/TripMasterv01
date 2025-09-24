// path: src/components/HistoryPlans.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./HistoryPlans.css";

/* בסיס API אחיד מהחלון (בלי אוטודיטקט) */
const API_BASE = window._API_BASE_ || "http://localhost:8012/www/tripmasterv01/public";

/* כוכב דירוג */
const Star = ({ on, onClick, onMouseEnter }) => (
  <button type="button" className={`star ${on ? "on" : ""}`}
    onClick={onClick} onMouseEnter={onMouseEnter} aria-label="star">★</button>
);
/* קומפוננטת דירוג חמשה כוכבים */
const Stars = ({ value = 5, onChange }) => {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="stars" onMouseLeave={()=>setHover(0)}>
      {[1,2,3,4,5].map(n=>(
        <Star key={n} on={shown>=n} onClick={()=>onChange(n)} onMouseEnter={()=>setHover(n)}/>
      ))}
    </div>
  );
};
/* ניחוש מדינה מתוך כותרת (עדין) */
const guessCountry = (t="") => (t.match(/my\s*trip\s*to\s*(.+)$/i)?.[1] || t).trim();

export default function HistoryPlans({ uid = (localStorage.getItem("uid")||"") }) {
  /* טאבים והמצב הכללי */
  const [tab, setTab] = useState("history");
  const [rawHistory, setRawHistory] = useState([]);
  const [rawShared, setRawShared] = useState([]);
  const [open, setOpen] = useState({});
  const [rating, setRating] = useState({});
  const [note, setNote] = useState({});
  const [files, setFiles] = useState({});
  const [saving, setSaving] = useState({});
  const [msg, setMsg] = useState({});
  const [details, setDetails] = useState(null);

  /* טעינת נסיעות עבר (history) */
  const loadHistory = useCallback(async () => {
    if (!uid) return;
    try {
      const fd = new FormData(); fd.append("uid", uid);
      const res = await fetch(`${API_BASE}/loadHistory.php`, { method:"POST", body: fd });
      const data = await res.json().catch(()=>[]);
      setRawHistory(Array.isArray(data) ? data.map((item)=>({
        ...item,
        places: safeParse(item.places),
        eventCalender: safeParse(item.eventCalender),
        images: safeParse(item.images),
      })) : []);
    } catch { setRawHistory([]); }
  }, [uid]);

  /* עזר: פריסת שדות שעשויים להגיע כמחרוזת JSON */
  const safeParse = (v, f=[]) => { try{ if(Array.isArray(v)) return v; if(typeof v==="string") return JSON.parse(v||"[]"); return f; }catch{return f;} };

  /* טעינת סיפורים משותפים עבור המשתמש */
  const loadShared = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/get_stories.php?user_id=${encodeURIComponent(uid)}`, { cache:"no-store" });
      const payload = await res.json().catch(()=>({ok:false,items:[]}));
      setRawShared(payload?.ok ? payload.items : []);
    } catch { setRawShared([]); }
  }, [uid]);

  useEffect(()=>{ loadHistory(); loadShared(); }, [loadHistory, loadShared]);

  /* חישוב רשימות מוצגות */
  const sharedIds = useMemo(()=> new Set(rawShared.map(t=>Number(t.trip_id || t.id))), [rawShared]);
  const historyList = useMemo(()=> rawHistory.filter(t=>!sharedIds.has(Number(t.id))), [rawHistory, sharedIds]);
  const sharedList  = useMemo(()=> rawShared, [rawShared]);
  const list = tab === "history" ? historyList : sharedList;

  /* בחירת קבצים */
  const onPickFiles = (tripId, list) => {
    const incoming = Array.from(list || []);
    setFiles(prev=>{
      const merged = [...(prev[tripId]||[]), ...incoming];
      const seen = new Set(); const out=[];
      for (const f of merged) {
        const key = [f.name,f.size,f.lastModified].join("|");
        if (!seen.has(key)) { seen.add(key); out.push(f); }
      }
      return { ...prev, [tripId]: out.slice(0,12) };
    });
  };
  const removePicked = (tripId, idx) => {
    setFiles(prev => {
      const arr = [...(prev[tripId] || [])]; arr.splice(idx,1);
      return { ...prev, [tripId]: arr };
    });
  };

  /* שיתוף נסיעה (הכנסה לטבלת stories) */
  const submitShare = useCallback(async (trip) => {
    const id = Number(trip.id);
    const r  = rating[id] || 5;
    const n  = (note[id] || "").trim();
    if (!n) return setMsg(m=>({...m,[id]:"Please write a short note."}));

    setSaving(s=>({...s,[id]:true}));
    try {
      const fd = new FormData();
      fd.append("user_id", uid);
      fd.append("trip_id", String(id));
      fd.append("title", trip.titlePlan || "My Trip");
      fd.append("rating", String(r));
      fd.append("notes", n);
      fd.append("country", guessCountry(trip.titlePlan || ""));
      fd.append("eventCalender", JSON.stringify(trip.eventCalender || []));
      fd.append("start_date", trip.startDate || "");
      fd.append("end_date",   trip.endDate   || "");
      (files[id]||[]).forEach(f => fd.append("photos[]", f));

      const res = await fetch(`${API_BASE}/insert_story.php`, { method:"POST", body: fd });
      const data = await res.json().catch(()=>null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Error saving trip.");

      setOpen(o=>({...o,[id]:false}));
      setNote(ns=>({...ns,[id]:""}));
      setFiles(fs=>({...fs,[id]:[]}));
      setMsg(m=>({...m,[id]:"Shared ✓"}));
      await loadShared();

    } catch (e) {
      setMsg(m=>({...m,[id]: e.message || "Network error"}));
    } finally {
      setSaving(s=>({...s,[id]:false}));
    }
  }, [uid, rating, note, files, loadShared]);

  return (
    <div className="history-container">
      <h2>My Trips</h2>
      <div className="tabs">
        <button type="button" className={`tab ${tab==="history"?"active":""}`} onClick={()=>setTab("history")}>History</button>
        <button type="button" className={`tab ${tab==="shared"?"active":""}`} onClick={()=>setTab("shared")}>Shared/Archived</button>
      </div>

      {list.length===0 ? <p className="msg">{tab==="history"?"No trips left to share.":"No shared trips yet."}</p> : (
        <div className="history-grid">
          {list.map((trip)=>{
            const id = Number(trip.id || trip.trip_id);
            const isOpen = !!open[id];
            const preview = (trip.eventCalender || []).slice(0,3);

            return (
              <div key={id} className="history-card">
                <div className="card-header">
                  <h3 className="card-title">{trip.titlePlan || trip.title || "My Trip"}</h3>
                  <p className="dates">{tab==="shared" ? "✔️ Shared" : "— Ended"}</p>
                </div>

                <div className="card-body">
                  <div className="vp-title">Visited Places</div>
                  <ul className="visited-places">
                    {preview.length ? preview.map((p,i)=>(
                      <li key={i}><strong>{p?.title||"Untitled"}</strong> {p?.type? `(${p.type})`: ""}</li>
                    )) : <li>No visited places recorded.</li>}
                  </ul>

                  {tab==="history" && !isOpen && (
                    <div className="actions">
                      <button type="button" className="btn btn-ghost" onClick={()=>setDetails(trip)}>More details</button>
                      <button type="button" className="btn btn-primary" onClick={()=>setOpen(o=>({...o,[id]:true}))}>Share</button>
                    </div>
                  )}

                  {tab==="history" && isOpen && (
                    <div className="share-editor">
                      <label className="lbl">Rate your trip</label>
                      <Stars value={rating[id] || 5} onChange={(v)=>setRating(r=>({...r,[id]:v}))}/>

                      <label className="lbl">Notes</label>
                      <textarea className="input textarea"
                        value={note[id] || ""} onChange={(e)=>setNote(ns=>({...ns,[id]:e.target.value}))}
                        placeholder="What stood out? Any tips for others?"/>

                      <label className="lbl">Photos (optional)</label>
                      <input className="input" type="file" accept="image/*" multiple
                        onChange={(e)=>{ onPickFiles(id, e.target.files); e.target.value=""; }}/>
                      {(files[id]?.length)>0 && (
                        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>
                          {files[id].map((f,i)=>(
                            <div key={i} style={{position:"relative"}}>
                              <img src={URL.createObjectURL(f)} alt=""
                                style={{width:64,height:64,objectFit:"cover",borderRadius:8,border:"1px solid #eee"}} />
                              <button type="button" onClick={()=>removePicked(id,i)} title="Remove"
                                style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",
                                  border:"none",background:"#0008",color:"#fff",cursor:"pointer",lineHeight:"20px"}}>×</button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="actions">
                        <button type="button" className="btn btn-primary" onClick={()=>submitShare(trip)} disabled={!!saving[id]}>
                          {saving[id] ? "Saving..." : "Done"}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={()=>setOpen(o=>({...o,[id]:false}))}>Cancel</button>
                      </div>
                      {msg[id] && <div className="msg">{msg[id]}</div>}
                    </div>
                  )}

                  {tab==="shared" && (
                    <div className="actions">
                      <button type="button" className="btn btn-ghost" onClick={()=>setDetails(trip)}>More details</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {details && (
        <div className="sys-layer" onClick={()=>setDetails(null)}>
          <div className="sys-dialog" onClick={(e)=>e.stopPropagation()}>
            <button type="button" className="sys-close" onClick={()=>setDetails(null)}>×</button>
            <h3 className="sys-dialog-title">{details.titlePlan || "Trip details"}</h3>
            <ul className="sys-dialog-meta">
              {(details.eventCalender || []).map((e,i)=>(
                <li key={i}><b>{e.title}</b> — {e.type} — {e.start} → {e.end}</li>
              ))}
            </ul>
            <div className="sys-dialog-actions">
              <button type="button" className="sys-btn sys-btn-primary" onClick={()=>setDetails(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
