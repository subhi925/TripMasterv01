import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth } from "../fire";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const PrivateRoute = ({ element: Component }) => {
  //----------------------------
  // Firebase Auth Hook
  //----------------------------
  // user: current logged-in user object
  // loading: boolean, true while auth state is loading
  const [user, loading] = useAuthState(auth);

  //----------------------------
  // React Router location
  //----------------------------
  // location: stores the current route info
  const location = useLocation();

  //----------------------------
  // Loading State
  //----------------------------
  // Shows lottie animation while auth state is loading
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}>
        {/* DotLottieReact shows a loading animation */}
        <DotLottieReact
          src="https://lottie.host/434cf64c-00ed-4c3d-9489-05e33b24565c/CdFG0JW6LS.lottie"
          loop
          autoplay
        />
      </div>
    );
  }

  //----------------------------
  // Redirect if not logged in
  //----------------------------
  // Navigate: redirect user to login page
  // state: keeps track of previous page to redirect back after login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  //----------------------------
  // Render Protected Component
  //----------------------------
  // Component: the element that should be rendered if user is logged in
  return <Component />;
};

export default PrivateRoute;
