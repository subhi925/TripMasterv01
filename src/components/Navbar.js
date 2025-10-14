import React, { useState, useEffect } from "react"; // React core
import { Link, useNavigate } from "react-router-dom"; // Router links & navigation
import { signOut, onAuthStateChanged } from "firebase/auth"; // Firebase auth functions
import { auth } from "../fire"; // Firebase auth instance
import "./Navbar.css"; // Navbar styling
import { DotLottieReact } from "@lottiefiles/dotlottie-react"; // Animated icon
import { GiExitDoor } from "react-icons/gi"; // Logout icon
import {
  FcHome,
  FcAbout,
  FcViewDetails,
  FcBusinessContact,
  FcReading,
  FcManager,
} from "react-icons/fc"; // Other icons

//----------------------------
// COMPONENT: Navbar
//----------------------------
const Navbar = () => {
  //----------------------------
  // STATE VARIABLES
  //----------------------------
  const [user, setUser] = useState(null); // Stores current logged-in user
  const navigate = useNavigate(); // Router navigation function

  //----------------------------
  // AUTH STATE LISTENER
  //----------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update user state on auth change
    });
    return () => unsubscribe(); // Cleanup listener
  }, []);

  //----------------------------
  // LOGOUT FUNCTION
  //----------------------------
  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Signout Error", error); // Log error if any
    }
  };

  //----------------------------
  // JSX RETURN
  //----------------------------
  return (
    <nav>
      <div className="nav-center">
        {/* Main navigation links */}
        <ul>
          <li>
            {/* Home link */}
            <Link to="/" title="Home">
              <FcHome className="myIcons" />
            </Link>
          </li>

          <li>
            {/* About link */}
            <Link to="/about" title="About">
              <FcAbout className="myIcons" />
            </Link>
          </li>

          <li>
            {/* Contact link */}
            <Link to="/contact" title="Contact">
              <FcBusinessContact className="myIcons" />
            </Link>
          </li>

          {user && (
            <li>
              {/* Profile link, visible only if user is logged in */}
              <Link to="/Profile" title="Profile">
                <FcViewDetails className="myIcons" />
              </Link>
            </li>
          )}

          {user && (
            <li>
              {/* Share Your Story link */}
              <Link to="/ShareYourStory" title="Share Your Story">
                <FcReading className="myIcons" />
              </Link>
            </li>
          )}

          {user && (
            <li>
              {/* Plan My Trip link with animated Lottie icon */}
              <Link to="/PlanMyTrip" title="Plan My Trip">
                <DotLottieReact
                  src="https://lottie.host/94f6046e-5fda-4fce-87c0-565abc1687e5/EKqJYJHH4s.lottie"
                  loop
                  autoplay
                  style={{ width: "50px", height: "40px" }}
                />
              </Link>
            </li>
          )}

          {user && (
            <li>
              {/* Dashboard link */}
              <Link to="/DashBoard">DashBoard</Link>
            </li>
          )}

          {user && (
            <li>
              {/* Bulletin Board link */}
              <Link to="/BulletinBoard">Bulletin Board</Link>
            </li>
          )}

          <li>
            {/* Login/Logout button */}
            {user ? (
              <button
                onClick={handleLogout} // Calls logout function
                className="logout-button"
                title="Logout">
                <GiExitDoor className="myLogOut" />
              </button>
            ) : (
              <Link to="/login" className="nav-loginLink" title="Login">
                <FcManager /> {/* Login icon */}
              </Link>
            )}
          </li>
        </ul>
      </div>

      <div className="nav-right">{/* Optional right content for future */}</div>
    </nav>
  );
};

export default Navbar;
