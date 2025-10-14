import React, { useState, useEffect } from "react"; // React hooks
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"; // Firebase Google login
import axios from "axios"; // HTTP requests
import { useNavigate } from "react-router-dom"; // Navigation between pages
import { auth } from "../fire"; // Firebase auth instance
import "./Login.css";
import { FcGoogle } from "react-icons/fc"; // Google icon

//----------------------------
// LOGIN COMPONENT
//----------------------------
const Login = () => {
  //----------------------------
  // HOOKS
  //----------------------------
  const navigate = useNavigate(); // Used to navigate to other pages

  //----------------------------
  // FUNCTION: HANDLE LOGIN WITH GOOGLE
  //----------------------------
  const handleLoging = async () => {
    const provider = new GoogleAuthProvider(); // Google login provider
    try {
      const result = await signInWithPopup(auth, provider); // Popup login
      const user = result.user; // Get the logged-in user info

      //----------------------------
      // CHECK IF USER EXISTS IN PHP BACKEND
      //----------------------------
      const data = new FormData();
      data.append("userId", user.uid); // Append Firebase UID
      const url =
        "http://localhost:8080/www/tripmasterv01/public/checkuserExist.php";

      const response = await axios.post(url, data); // Send POST request

      //----------------------------
      // NAVIGATE BASED ON USER EXISTENCE
      //----------------------------
      if (response.data === "Exist") {
        console.log(response.data);
        navigate("/Home"); // Navigate to Home if user exists
      } else {
        navigate("/Profile"); // Navigate to Profile if new user
      }
    } catch (error) {
      console.error("Login failed:", error); // Error handling
    }
  };

  //----------------------------
  // JSX / RENDER
  //----------------------------
  return (
    <div className="page-w">
      <div className="login-container">
        {/* Login header */}
        <h1 className="Login-header">Login</h1>
        {/* Instruction */}
        Sign in with :{/* Google login button */}
        <FcGoogle onClick={handleLoging} className="login-GoogleLogo" />
      </div>
    </div>
  );
};

export default Login;
