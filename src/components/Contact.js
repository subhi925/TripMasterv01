// path: src/pages/Contact.js
import React, { useEffect, useState } from "react";
import "./Contact.css";

/*
  דף "Contact":
  - טופס דמו ללא שליחה לשרת.
  - ולידציה בצד לקוח + הודעת תודה.
  - אנימציית הופעה קלה + ARIA לנגישות.
*/
export default function Contact(){
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [topic,setTopic]=useState("General");
  const [msg,setMsg]=useState("");
  const [sent,setSent]=useState(false);
  const [err,setErr]=useState("");
  const [touched,setTouched]=useState({name:false,email:false,msg:false});

  // פונקציה: validate
  // מחזירה אובייקט שגיאות לפי שדות ("" אם תקין).
  const validate=()=>{
    const e={ name:"", email:"", msg:"" };
    if(!name.trim()) e.name="Please enter your name.";
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email="Please enter a valid email.";
    if(!msg.trim()) e.msg="Please write your message.";
    return e;
  };

  // פונקציה: firstError
  // תפקיד: להחזיר את שם השדה הראשון שיש בו שגיאה (או null).
  const firstError=(eObj)=>{
    return eObj.name? "name" : eObj.email? "email" : eObj.msg? "msg" : null;
  };

  // פונקציה: onSubmit
  // תפקיד: אימות, הצגת שגיאה (אם יש), או הצגת הודעת תודה (דמו).
  const onSubmit=(e)=>{
    e.preventDefault();
    const eObj=validate();
    const first=firstError(eObj);
    setErr(eObj.name || eObj.email || eObj.msg);
    if(first){
      setTouched(t=>({...t,[first]:true}));
      // פוקוס לשדה הראשון עם שגיאה
      document.getElementById(first)?.focus();
      return;
    }
    setErr("");
    // סימולציה לשליחה
    setTimeout(()=> setSent(true), 250);
  };

  // פונקציה: onBlurField
  // תפקיד: סימון שדה כ"טופל" להצגת שגיאה מיידית אחרי יציאה מהשדה.
  const onBlurField=(key)=> setTouched(t=>({...t,[key]:true}));

  // אנימציית הופעה לאלמנטים עם .reveal
  useEffect(()=>{
    const io=new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add("is-in"); });
    },{threshold:.08});
    document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
    return ()=>io.disconnect();
  },[]);

  const eObj=validate();

  return (
    <div className="c-wrap">
      <h1 className="reveal">Contact Us</h1>
      <p className="c-lead reveal">Questions, feedback, or collaboration ideas? We’d love to hear from you.</p>

      {!sent ? (
        <form className="c-form reveal" onSubmit={onSubmit} noValidate>
          <div className="c-grid2">
            <div className="c-row">
              <label className="c-lbl" htmlFor="name">Name</label>
              <input
                id="name"
                className={`c-input ${touched.name && eObj.name ? "error":""}`}
                value={name}
                onChange={e=>setName(e.target.value)}
                onBlur={()=>onBlurField("name")}
                placeholder="Your name"
                aria-invalid={!!(touched.name && eObj.name)}
                aria-describedby={touched.name && eObj.name ? "name-help": undefined}
              />
              {touched.name && eObj.name && <div id="name-help" className="c-help">{eObj.name}</div>}
            </div>

            <div className="c-row">
              <label className="c-lbl" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`c-input ${touched.email && eObj.email ? "error":""}`}
                value={email}
                onChange={e=>setEmail(e.target.value)}
                onBlur={()=>onBlurField("email")}
                placeholder="you@example.com"
                aria-invalid={!!(touched.email && eObj.email)}
                aria-describedby={touched.email && eObj.email ? "email-help": undefined}
              />
              {touched.email && eObj.email && <div id="email-help" className="c-help">{eObj.email}</div>}
            </div>
          </div>

          <div className="c-row">
            <label className="c-lbl" htmlFor="topic">Topic</label>
            <select id="topic" className="c-input" value={topic} onChange={e=>setTopic(e.target.value)}>
              <option>General</option>
              <option>Product Feedback</option>
              <option>Bug Report</option>
              <option>Partnership</option>
            </select>
          </div>

          <div className="c-row">
            <label className="c-lbl" htmlFor="msg">Message</label>
            <textarea
              id="msg"
              className={`c-input c-textarea ${touched.msg && eObj.msg ? "error":""}`}
              value={msg}
              onChange={e=>setMsg(e.target.value)}
              onBlur={()=>onBlurField("msg")}
              placeholder="Type your message here..."
              aria-invalid={!!(touched.msg && eObj.msg)}
              aria-describedby={touched.msg && eObj.msg ? "msg-help": undefined}
            />
            {touched.msg && eObj.msg && <div id="msg-help" className="c-help">{eObj.msg}</div>}
          </div>

          {err && <div className="c-err" role="alert">{err}</div>}

          <div className="c-actions">
            <button type="submit" className="c-btn c-btn-primary">Send</button>
            <button
              type="button"
              className="c-btn"
              onClick={()=>{ setName(""); setEmail(""); setTopic("General"); setMsg(""); setErr(""); setTouched({name:false,email:false,msg:false}); }}
            >
              Clear
            </button>
          </div>
        </form>
      ) : (
        <div className="c-thanks reveal">
          <h3>Thanks!</h3>
          <p>We received your message and will get back to you soon.</p>
          <button className="c-btn" onClick={()=>{ setSent(false); }}>Send another</button>
        </div>
      )}

      <div className="c-aside reveal">
        <div className="c-card">
          <h4>Support</h4>
          <p>Email: <a href="mailto:support@tripmaster.app">support@tripmaster.app</a></p>
          <p>Docs: <a href="#">docs.tripmaster.app</a></p>
        </div>
        <div className="c-card">
          <h4>Company</h4>
          <p>TripMaster, 123 Anywhere St, TLV</p>
          <p>Mon–Fri, 9:00–18:00</p>
        </div>
      </div>
    </div>
  );
}
