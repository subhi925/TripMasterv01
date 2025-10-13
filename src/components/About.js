import "./About.css";

/* 
  About Page Component (clean, structured, and commented)
  --------------------------------------------------------
  Displays TripMaster's purpose, main features, and the user flow.
  Includes icons, feature cards, and simple step explanations.
*/

export default function About() {
  return (
    <div className="about-wrap">
      {/* ====================== HEADER ====================== */}
      <header className="about-hero">
        <h1>About TripMaster</h1>
        <p>
          TripMaster helps you plan trips, keep a clean history of finished itineraries,
          share your story with the community, and clone inspirational trips into your own calendar.
        </p>
      </header>

      {/* ====================== FEATURE SECTION ====================== */}
      <h2 className="section-title">What you can do</h2>
      <div className="about-grid">

        {/* Profile – User preferences setup */}
        <Feature
          icon={<ProfileIcon />}
          title="Profile"
          text="Pick your travel preferences (food, hiking, shows, etc.). We use them to tailor Surprise or regular plans."
        />

        {/* Plan – Create your itinerary */}
        <Feature
          icon={<PlanIcon />}
          title="Plan"
          text="Build day-by-day itineraries with timings, places, and smart reminders — or use Surprise to pick dates only."
        />

        {/* Partner – Find other travelers */}
        <Feature
          icon={<PartnerIcon />}
          title="Find a Partner"
          text="Search for travel partners with similar plans and interests (future or ongoing trips)."
        />

        {/* Bulletin Board – Quick updates */}
        <Feature
          icon={<BoardIcon />}
          title="Bulletin Board"
          text="Post quick updates and small requests during your trip and keep partners in the loop."
        />

        {/* History – Store finished trips */}
        <Feature
          icon={<HistoryIcon />}
          title="History"
          text="Finish your trip → add rating, notes & photos to keep it organized and ready for sharing."
        />

        {/* Share – Publish stories */}
        <Feature
          icon={<ShareIcon />}
          title="Share your Story"
          text="Publish a finished trip so others can view details & photos, or clone it into their calendar."
        />

        {/* Clone – Duplicate shared trips */}
        <Feature
          icon={<CloneIcon />}
          title="Clone"
          text="Copy any shared trip, auto-shift its dates to your window, then tweak days and places."
        />
      </div>

      {/* ====================== STEPS SECTION ====================== */}
      <h2 className="section-title">How it all works</h2>
      <div className="steps">
        <Step n="1" text={<><b>Sign in</b> to your account.</>} />
        <Step n="2" text={<><b>Open Profile</b> and select your preferences.</>} />
        <Step n="3" text={<><b>Go to Plan</b>: build a plan or choose <b>Surprise</b> and only set dates.</>} />
        <Step n="4" text={<><b>Get</b> a full, day-by-day itinerary — you can change dates anytime.</>} />
        <Step n="5" text={<><b>After the trip</b>, open History and add <b>rating, photos, and notes</b>.</>} />
        <Step n="6" text={<><b>Share your Story</b> or <b>Clone</b> others’ trips to your own calendar.</>} />
      </div>

      {/* ====================== PRIVACY + CONTACT ====================== */}
      <div className="privacy" style={{ marginTop: 18 }}>
        We only publish what you explicitly share. You can edit or remove shared stories at any time.
        Media uploads are stored on our server and linked to your user ID.
      </div>

      <p style={{ textAlign: "center", marginTop: 12 }}>
        <a className="cta-mail" href="mailto:support@tripmaster.app">
          <MailIcon /> Email us: support@tripmaster.app
        </a>
      </p>
    </div>
  );
}

//------------------------------------------------------------
// Feature Card Component
//------------------------------------------------------------
function Feature({ icon, title, text }) {
  return (
    <article className="card">
      <div className="icon">{icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </article>
  );
}

//------------------------------------------------------------
// Step Component (for flow steps 1–6)
//------------------------------------------------------------
function Step({ n, text }) {
  return (
    <div className="step">
      <div className="num">{n}</div>
      <div>{text}</div>
    </div>
  );
}

//------------------------------------------------------------
// Inline SVG Icons (lightweight, no dependencies)
//------------------------------------------------------------

function ProfileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm7 8a7 7 0 1 0-14 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

//------------------------------------------------------------
function PlanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M4 12h10M4 18h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

//------------------------------------------------------------
function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 6v6l4 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

//------------------------------------------------------------
function ShareIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 12l6-6M4 12h8m0 0l-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

//------------------------------------------------------------
function BoardIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12v14H6z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9 8h6M9 12h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

//------------------------------------------------------------
function PartnerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="8" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="7" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

//------------------------------------------------------------
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4 7l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

//------------------------------------------------------------
function CloneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="3"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity=".6"
      />
      <path
        d="M14 12l4-4M18 8h-4M18 8v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
