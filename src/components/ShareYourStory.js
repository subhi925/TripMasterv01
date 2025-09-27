// path: src/components/ShareYourStory.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./ShareYourStory.css";

/* ---------------- מזהי משתמש (UID) ---------------- */
// ברירת מחדל לבדיקה מקומית
const DEFAULT_UID = "AyBlBZh2UahcPz5jz2eWtjYJpRw1";
const getUID = () => localStorage.getItem("uid") || "";
const setUID = (v) => localStorage.setItem("uid", v);

/* ---------------- זיכרון מקומי ל־Clone ---------------- */
const loadCloned = () => { try { return new Set(JSON.parse(localStorage.getItem("clonedStoryIds")||"[]")); } catch { return new Set(); } };
const saveCloned = (s) => localStorage.setItem("clonedStoryIds", JSON.stringify([...s]));

/* ---------------- עזרי תצוגה/חישוב ---------------- */
// הפיכת נתיב יחסי למוחלט על בסיס API_BASE
const toSrcAbs = (base, rel) => /^https?:\/\//i.test(rel||"") ? rel : `${base}/${String(rel||"").replace(/^\//,"")}`;
// פירוק JSON לאירועים (בטוח לכשל)
const parseItin = (v)=>{ if(Array.isArray(v)) return v; try{ const j=JSON.parse(v||"[]"); return Array.isArray(j)?j:[];}catch{return[];}};
// חישוב מספר ימים מתוך start/end או לפי אירועים
const computeDays = (item)=>{
  if(+item?.duration_days>0) return +item.duration_days;
  const s=item?.start_date&&new Date(item.start_date), e=item?.end_date&&new Date(item.end_date);
  if(s&&e&&!isNaN(s)&&!isNaN(e)) return Math.max(0, Math.round((e-s)/86400000)+1);
  const set=new Set(); parseItin(item?.eventCalender).forEach(ev=>{
    const a=ev?.start&&new Date(ev.start), b=ev?.end&&new Date(ev.end||ev.start);
    if(!a&&!b) return; const st=new Date((a||b)), en=new Date((b||a));
    st.setHours(0,0,0,0); en.setHours(0,0,0,0);
    for(let d=new Date(st); d<=en; d.setDate(d.getDate()+1)) set.add(d.toISOString().slice(0,10));
  }); return set.size||0;
};
const fmt = (d)=> d? new Date(d).toLocaleString(): "Dates not specified";
const stars = (n)=> "★".repeat(Number(n)||0) || "—";

/* ---- טוסט קצר ---- */
const useToast=()=>{ const [msg,setMsg]=useState(""); return {msg,show:(m)=>{setMsg(m);setTimeout(()=>setMsg(""),1600);}}; };

// בסיס ה־API קבוע (ללא אוטו־דיטקט)
const API_BASE = window._API_BASE_ || "http://localhost:8080/www/tripmasterv01/public";

// בקשת JSON עם טיפול בשגיאות/טקסט
const tryGetJSON=async(url)=>{
  const res=await fetch(url,{cache:"no-store"});
  const text=await res.text();
  let json;
  try{ json=JSON.parse(text); }
  catch{ throw new Error(`Invalid JSON at ${url}\n\n${text.slice(0,600)}`); }
  if(!res.ok||!json?.ok) throw new Error(json?.error||`HTTP ${res.status}\n${text.slice(0,600)}`);
  return json;
};

/* ---------------- קומפוננטת העמוד ---------------- */
export default function ShareYourStory(){
  // אתחול UID פעם אחת
  useEffect(()=>{ if(!getUID()) setUID(DEFAULT_UID); },[]);
  const [uidInput,setUidInput]=useState(getUID());

  // לצורך אנימציה קטנה בכניסת הדף
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setMounted(true),10); return ()=>clearTimeout(t); },[]);

  // מסננים
  const [q,setQ]=useState("");
  const [ratingEq,setRatingEq]=useState("all");
  const [sort,setSort]=useState("new");
  const [showFilter,setShowFilter]=useState("all");   // all | cloned | not
  const [daysFilter,setDaysFilter]=useState("any");   // any | 1..6 | 7plus

  // נתונים כלליים
  const [items,setItems]=useState([]), [loading,setLoading]=useState(false), [err,setErr]=useState("");
  // מצבי דיאלוגים
  const [details,setDetails]=useState({open:false,item:null,loading:false,error:"",lightboxOpen:false,lightboxIndex:0});
  const [clone,setClone]=useState({open:false,item:null,date:"",submitting:false,error:""});

  const [clonedIds,setClonedIds]=useState(loadCloned);
  const toast=useToast();
  const toSrc=useCallback((rel)=>toSrcAbs(API_BASE,rel),[]);

  // בניית פרמטרים ל־GET /get_stories.php
  const params = useMemo(()=> {
    const p={}; if(q.trim()) p.q=q.trim(); if(ratingEq!=="all") p.ratingEq=String(ratingEq); if(sort) p.sort=sort;
    return p;
  },[q,ratingEq,sort]);

  // טעינת סיפורים
  const fetchStories=useCallback(async()=>{
    setLoading(true); setErr("");
    try{
      const u=new URL(`${API_BASE}/get_stories.php`);
      Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
      const data=await tryGetJSON(u.toString());
      setItems(Array.isArray(data.items)?data.items:[]);
    }catch(e){ setErr(String(e.message||e)); setItems([]); }
    finally{ setLoading(false); }
  },[params]);

  useEffect(()=>{ fetchStories(); },[fetchStories]);

  // שמירת UID
  const saveUID=()=>{ if(!uidInput.trim()) return; setUID(uidInput.trim()); toast.show("UID saved ✓"); };

  // פרטים
  const openDetails=async(it)=>{
    setDetails({open:true,item:it,loading:true,error:"",lightboxOpen:false,lightboxIndex:0});
    try{
      const j=await tryGetJSON(`${API_BASE}/get_story_by_id.php?id=${it.id}`);
      setDetails({open:true,item:j.item,loading:false,error:"",lightboxOpen:false,lightboxIndex:0});
    }
    catch(e){ setDetails(s=>({...s,loading:false,error:String(e.message||"Failed")})); }
  };
  const closeDetails=()=> setDetails({open:false,item:null,loading:false,error:"",lightboxOpen:false,lightboxIndex:0});

  const openLightbox=(i)=> setDetails(s=>({...s,lightboxOpen:true,lightboxIndex:i}));
  const closeLightbox=()=> setDetails(s=>({...s,lightboxOpen:false}));
  const navLightbox=(dir)=> setDetails(s=>{
    const imgs=Array.isArray(s.item?.images)?s.item.images:[]; if(!imgs.length) return s;
    const len=imgs.length, next=(s.lightboxIndex+(dir==="next"?1:-1)+len)%len; return {...s,lightboxIndex:next};
  });

  // ניווט במקלדת בלייטבוקס (Esc/חצים) – שיפור UX
  useEffect(()=>{
    if(!details.lightboxOpen) return;
    const onKey=(e)=>{
      if(e.key==="Escape") closeLightbox();
      if(e.key==="ArrowLeft") navLightbox("prev");
      if(e.key==="ArrowRight") navLightbox("next");
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[details.lightboxOpen]);

  // שכפול
  const openClone=(story)=> setClone({open:true,item:story,date:new Date().toISOString().slice(0,10),submitting:false,error:""});
  const closeClone=()=> setClone({open:false,item:null,date:"",submitting:false,error:""});

  // **חשוב: למנוע ריענון דף אם הכפתור נמצא בתוך <form> כלשהו**
  const doClone = async (e) => {
    e?.preventDefault();
    e?.stopPropagation?.();

    if (!clone.item) return;
    const s = clone.item;
    const uid = getUID() || s.user_id || "";

    const fd = new FormData();
    if (s.trip_id) fd.append("source_trip_id", String(s.trip_id));
    fd.append("story_id", String(s.id));
    fd.append("title", s.title || "My Trip");
    fd.append("user_id", uid);
    fd.append("new_start_date", clone.date);
    fd.append("duration_days", String(computeDays(s) || 1));

    setClone((st) => ({ ...st, submitting: true, error: "" }));

    try {
      const res = await fetch(`${API_BASE}/clone_plan.php`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      const text = await res.text();
      let json;
      try { json = JSON.parse(text); }
      catch { throw new Error(`Server did not return JSON.\n\n${text.slice(0, 400)}`); }

      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`);

      setClonedIds((prev) => {
        const set = new Set(prev);
        set.add(s.id);
        saveCloned(set);
        return set;
      });
      closeClone();
      // טוסט קטן אחרי הצלחה
      toast.show("Cloned ✓");
    } catch (err) {
      setClone((st) => ({ ...st, error: String(err.message || err) }));
    } finally {
      setClone((st) => ({ ...st, submitting: false }));
    }
  };

  // סינון לקוח
  const filtered = useMemo(()=>{
    let arr=[...items];
    if(showFilter==="cloned") arr=arr.filter(x=>clonedIds.has(x.id));
    if(showFilter==="not")    arr=arr.filter(x=>!clonedIds.has(x.id));
    if(daysFilter!=="any"){
      arr=arr.filter(x=>{
        const d=computeDays(x);
        if(daysFilter==="7plus") return d>=7;
        return d===Number(daysFilter);
      });
    }
    return arr;
  },[items,showFilter,clonedIds,daysFilter]);

  // שלדים יפים בזמן טעינה
  const skeletons = Array.from({length:6});

  return (
    <div className={`sys-wrapper ${mounted?"is-mounted":""}`}>
      <h1 className="sys-title">Share your Story</h1>
      <p className="sys-sub">Discover and filter trip experiences from our community.</p>

      {!getUID() && (
        <div className="sys-uid-banner">
          <span>Paste your <b>UID</b> (dashboard.userid)</span>
          <input className="sys-input" placeholder="Enter UID…" value={uidInput} onChange={e=>setUidInput(e.target.value)}/>
          <button type="button" className="sys-btn sys-btn-primary" onClick={saveUID}>Save</button>
        </div>
      )}

      {/* מסננים */}
      <div className="sys-filters">
        <input className="sys-input sys-input--w" placeholder="Search country, title or notes…" value={q}
               onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&fetchStories()}/>
        <select className="sys-input" value={daysFilter} onChange={e=>setDaysFilter(e.target.value)}>
          <option value="any">Any length</option>
          <option value="1">1 day</option><option value="2">2 days</option><option value="3">3 days</option>
          <option value="4">4 days</option><option value="5">5 days</option><option value="6">6 days</option>
          <option value="7plus">7+ days</option>
        </select>
        <select className="sys-input" value={ratingEq} onChange={e=>setRatingEq(e.target.value)}>
          <option value="all">All ratings</option>
          <option value="5">★★★★★ (5)</option><option value="4">★★★★ (4)</option>
          <option value="3">★★★ (3)</option><option value="2">★★ (2)</option><option value="1">★ (1)</option>
        </select>
        <select className="sys-input" value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="new">Newest</option><option value="rating">Top rated</option>
        </select>
        <select className="sys-input" value={showFilter} onChange={e=>setShowFilter(e.target.value)}>
          <option value="all">Show: All</option><option value="cloned">Show: Cloned</option><option value="not">Show: Not cloned</option>
        </select>
        <button type="button" className="sys-btn sys-btn-primary" onClick={fetchStories}>Apply</button>
        <button type="button" className="sys-btn" onClick={()=>{ setQ(""); setRatingEq("all"); setSort("new"); setShowFilter("all"); setDaysFilter("any"); fetchStories(); }}>Reset</button>
      </div>

      {/* תוכן ראשי */}
      {loading ? (
        <div className="sys-grid">
          {skeletons.map((_,i)=>(
            <article key={i} className="sys-card sys-skel" style={{'--i': i}}>
              <div className="skel skel-title" />
              <div className="skel skel-thumbs" />
              <div className="skel skel-line" />
              <div className="skel skel-line short" />
              <div className="skel skel-btns" />
            </article>
          ))}
        </div>
      ) : err ? (
        <p className="sys-err">{err}</p>
      ) : filtered.length===0 ? (
        <p className="sys-empty">No stories found.</p>
      ) : (
        <div className="sys-grid">
          {filtered.map((story, i)=>{
            const imgs=Array.isArray(story.images)?story.images:[], d=computeDays(story), isCloned=clonedIds.has(story.id);
            return (
              <article className={`sys-card ${isCloned?"sys-card--cloned":""}`} key={story.id} style={{'--i': i}}>
                <div className="sys-card-body">
                  <header className="sys-card-head">
                    <h3 className="sys-card-title">{story.title||"Untitled Trip"} {d? <span className="sys-days">{d} days</span>:null}</h3>
                    <span className="sys-stars">{stars(story.rating)}</span>
                  </header>

                  {imgs.length?(
                    <div className="sys-thumbs" onClick={()=>openDetails(story)} role="button" title="Open details">
                      {imgs.slice(0,4).map((src,idx)=>(<div className="sys-thumb" key={idx}><img src={toSrc(src)} alt=""/></div>))}
                      {imgs.length>4 && <div className="sys-more">+{imgs.length-4}</div>}
                    </div>
                  ):<div className="sys-noimg" onClick={()=>openDetails(story)} role="button" title="Open details">No photos</div>}

                  <ul className="sys-meta">
                    <li><b>From:</b> {fmt(story.start_date)}</li>
                    <li><b>To:</b> {fmt(story.end_date)}</li>
                    <li><b>Published:</b> {fmt(story.created_at)}</li>
                  </ul>
                  <p className="sys-note">{story.notes || "—"}</p>
                </div>

                <div className="sys-actions">
                  <button type="button" className="sys-btn" onClick={()=>openDetails(story)}>More details</button>
                  {isCloned
                    ? <button type="button" className="sys-btn sys-btn-success" disabled>Cloned</button>
                    : <button type="button" className="sys-btn sys-btn-primary sys-btn--clone" onClick={()=>openClone(story)}>Clone</button>
                  }
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* מודאל פרטים – עיצוב/אנימציה משודרגים */}
      {details.open && (
        <div className="sys-layer" onClick={closeDetails}>
          <div className="sys-dialog sys-dialog--xl" onClick={(e)=>e.stopPropagation()}>
            <button type="button" className="sys-close" onClick={closeDetails}>×</button>

            {details.loading? (
              <div className="sys-dialog-loading">
                <div className="skel skel-title wide" />
                <div className="skel skel-thumbs tall" />
              </div>
            ) : details.error? (
              <p className="sys-err">{details.error}</p>
            ) : (
              <>
                <header className="dlg-head">
                  <h3 className="dlg-title">{details.item?.title}</h3>
                  <div className="dlg-sub">
                    <span>{fmt(details.item?.start_date)}</span>
                    <span>—</span>
                    <span>{fmt(details.item?.end_date)}</span>
                    <span className="sys-stars">{stars(details.item?.rating)}</span>
                  </div>
                </header>

                {/* גלריה מסודרת – Grid + Lightbox */}
                {Array.isArray(details.item?.images)&&details.item.images.length>0 && (
                  <>
                    <div className="sys-gallery-grid">
                      {details.item.images.map((src,i)=>(
                        <button key={i} className="sys-gallery-cell" title="Open image" onClick={()=>openLightbox(i)}>
                          <img src={toSrc(src)} alt=""/>
                        </button>
                      ))}
                    </div>

                    {details.lightboxOpen && (
                      <div className="sys-lightbox" onClick={closeLightbox}>
                        <button className="sys-lightbox-close" onClick={closeLightbox}>×</button>
                        <button className="sys-lightbox-nav prev" onClick={(e)=>{e.stopPropagation();navLightbox("prev");}}>‹</button>
                        <img className="zoom-in" src={toSrc(details.item.images[details.lightboxIndex])} alt="" onClick={(e)=>e.stopPropagation()}/>
                        <button className="sys-lightbox-nav next" onClick={(e)=>{e.stopPropagation();navLightbox("next");}}>›</button>
                      </div>
                    )}
                  </>
                )}

                <div className="dlg-two">
                  <section>
                    <h4>Trip info</h4>
                    <table className="sys-table">
                      <tbody>
                        <tr><th>Created</th><td>{fmt(details.item?.created_at)}</td></tr>
                        <tr><th>Country</th><td>{details.item?.country || "—"}</td></tr>
                        <tr><th>Duration</th><td>{(computeDays(details.item)||"—")} days</td></tr>
                        <tr><th>Notes</th><td>{details.item?.notes || "—"}</td></tr>
                      </tbody>
                    </table>
                  </section>

                  <section>
                    <h4>Itinerary</h4>
                    {(() => {
                      const arr = parseItin(details.item?.eventCalender);
                      return arr.length? (
                        <table className="sys-table">
                          <thead><tr><th>Title</th><th>Type</th><th>Time</th></tr></thead>
                          <tbody>
                            {arr.map((ev,i)=>(
                              <tr key={i}>
                                <td>{ev.title||"Untitled"}</td>
                                <td>{ev.type||"—"}</td>
                                <td>{ev.start}{ev.end?` → ${ev.end}`:""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <div className="sys-muted">No itinerary found.</div>;
                    })()}
                  </section>
                </div>

                <div className="sys-dialog-actions">
                  <button type="button" className="sys-btn" onClick={closeDetails}>Close</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* מודאל שכפול */}
      {clone.open && (
        <div className="sys-layer" onClick={closeClone}>
          <div className="sys-dialog" onClick={(e)=>e.stopPropagation()}>
            <button type="button" className="sys-close" onClick={closeClone}>×</button>
            <h3 className="sys-dialog-title">Clone trip — {clone.item?.title}</h3>
            <div className="lbl">New start date</div>
            <input type="date" className="sys-input" value={clone.date} onChange={e=>setClone(s=>({...s,date:e.target.value}))}/>
            <div className="sys-hint">Original duration will be used automatically.</div>
            {clone.error && <div className="sys-err" style={{marginTop:8}}>{clone.error}</div>}
            <div className="sys-dialog-actions">
              <button type="button" className="sys-btn" onClick={closeClone} disabled={clone.submitting}>Cancel</button>
              <button type="button" className="sys-btn sys-btn-primary" onClick={doClone} disabled={!clone.date||clone.submitting}>
                {clone.submitting?"Cloning…":"Clone"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.msg && <div className="sys-toast">{toast.msg}</div>}
    </div>
  );
}
