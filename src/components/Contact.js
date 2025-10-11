// path: src/pages/Contact.js
import React, { useEffect, useRef, useState } from "react";
import "./Contact.css";

export default function Contact(){
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [topic,setTopic]=useState("General");
  const [msg,setMsg]=useState("");
  const [sent,setSent]=useState(false);
  const [err,setErr]=useState("");
  const [touched,setTouched]=useState({name:false,email:false,msg:false});

  // refs לשדות במקום id
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const msgRef = useRef(null);

  const validate=()=>{
    const e={ name:"", email:"", msg:"" };
    if(!name.trim()) e.name="Please enter your name.";
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email="Please enter a valid email.";
    if(!msg.trim()) e.msg="Please write your message.";
    return e;
  };

  const firstError=(eObj)=>{
    return eObj.name? "name" : eObj.email? "email" : eObj.msg? "msg" : null;
  };

  const onSubmit=(e)=>{
    e.preventDefault();
    const eObj=validate();
    const first=firstError(eObj);
    setErr(eObj.name || eObj.email || eObj.msg);
    if(first){
      setTouched(t=>({...t,[first]:true}));
      // שימוש ב-ref במקום document.getElementById
      if(first==="name") nameRef.current?.focus();
      if(first==="email") emailRef.current?.focus();
      if(first==="msg") msgRef.current?.focus();
      return;
    }
    setErr("");
    setTimeout(()=> setSent(true), 250);
  };

  const onBlurField=(key)=> setTouched(t=>({...t,[key]:true}));

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
              <span className="c-lbl">Name</span>
              <input
                ref={nameRef}
                className={`c-input ${touched.name && eObj.name ? "error":""}`}
                value={name}
                onChange={e=>setName(e.target.value)}
                onBlur={()=>onBlurField("name")}
                placeholder="Your name"
                aria-invalid={!!(touched.name && eObj.name)}
                aria-label="Name"
              />
              {touched.name && eObj.name && <div className="c-help">{eObj.name}</div>}
            </div>

            <div className="c-row">
              <span className="c-lbl">Email</span>
              <input
                ref={emailRef}
                type="email"
                className={`c-input ${touched.email && eObj.email ? "error":""}`}
                value={email}
                onChange={e=>setEmail(e.target.value)}
                onBlur={()=>onBlurField("email")}
                placeholder="you@example.com"
                aria-invalid={!!(touched.email && eObj.email)}
                aria-label="Email"
              />
              {touched.email && eObj.email && <div className="c-help">{eObj.email}</div>}
            </div>
          </div>

          <div className="c-row">
            <span className="c-lbl">Topic</span>
            <select
              className="c-input"
              value={topic}
              onChange={e=>setTopic(e.target.value)}
              aria-label="Topic"
            >
              <option>General</option>
              <option>Product Feedback</option>
              <option>Bug Report</option>
              <option>Partnership</option>
            </select>
          </div>

          <div className="c-row">
            <span className="c-lbl">Message</span>
            <textarea
              ref={msgRef}
              className={`c-input c-textarea ${touched.msg && eObj.msg ? "error":""}`}
              value={msg}
              onChange={e=>setMsg(e.target.value)}
              onBlur={()=>onBlurField("msg")}
              placeholder="Type your message here..."
              aria-invalid={!!(touched.msg && eObj.msg)}
              aria-label="Message"
            />
            {touched.msg && eObj.msg && <div className="c-help">{eObj.msg}</div>}
          </div>

          {err && <div className="c-err" role="alert">{err}</div>}

          <div className="c-actions">
            <button type="submit" className="c-btn c-btn-primary">Send</button>
            <button
              type="button"
              className="c-btn"
              onClick={()=>{
                setName(""); setEmail(""); setTopic("General"); setMsg("");
                setErr(""); setTouched({name:false,email:false,msg:false});
              }}
            >
              Clear
            </button>
          </div>
        </form>
      ) : (
        <div className="c-thanks reveal">
          <h3>Thanks!</h3>
          <p>We received your message and will get back to you soon.</p>
          <button className="c-btn" onClick={()=>setSent(false)}>Send another</button>
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
