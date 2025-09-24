import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../fire";
import "./Navbar.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react"; //npm install @lottiefiles/dotlottie-react
import { GiExitDoor } from "react-icons/gi";

import {
  FcHome,
  FcAbout,
  FcViewDetails,
  FcBusinessContact,
  FcReading,
  FcManager,
} from "react-icons/fc";
const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Signout Error", error);
    }
  };

  return (
    <nav>
      <div className="nav-center">
        <ul>
          <li>
            <Link to="/" title="Home">
              {" "}
              <FcHome className="myIcons" />{" "}
            </Link>
          </li>

          <li>
            <Link to="/about" title="About">
              <FcAbout className="myIcons" />
            </Link>
          </li>

          <li>
            <Link to="/contact" title="Contact">
              {" "}
              <FcBusinessContact className="myIcons" />{" "}
            </Link>
          </li>

          {user && (
            <li>
              <Link to="/Profile" title="Profile">
                {" "}
                <FcViewDetails className="myIcons" />{" "}
              </Link>
            </li>
          )}

          {user && (
            <li>
              <Link to="/ShareYourStory" title="Share Your Story">
                <FcReading className="myIcons" />
              </Link>
            </li>
          )}
          {user && (
            <li>
              <Link to="/PlanMyTrip" title="Plan My Trip">
                {" "}
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
              <Link to="/DashBoard">DashBoard</Link>
            </li>
          )}
            {user && (
            <li>
              <Link to="/BulletinBoard">Bulletin Board</Link>
            </li>
          )}

          <li>
            {user ? (
              <button
                onClick={handleLogout}
                className="logout-button"
                title="Logout"
              >
                <GiExitDoor className="myLogOut" />
              </button>
            ) : (
              <Link to="/login" className="nav-loginLink" title="Login">
                <FcManager />
              </Link>
            )}
          </li>
        </ul>
      </div>

      <div className="nav-right">{/* אופציונלי לשים כאן תוכן בעתיד */}</div>
    </nav>
  );
};

export default Navbar;
