import React, { useState, useEffect } from "react";
import Profile from "./components/Profile";
import Login from "./components/Login";
import {
  BrowserRouter as Router, // Router for navigation
  Route, // Route for defining path
  Routes, // Wrapper for all routes
  Navigate, // Redirect component
} from "react-router-dom";
import Navbar from "./components/Navbar";
import PriveteRoute from "./components/PriveteRoute"; // Private route wrapper
import ShareYourStory from "./components/ShareYourStory";
import Home from "./components/Home";
import About from "./components/About";
import Contact from "./components/Contact";
import PlanMyTrip from "./components/PlanMyTrip";
import Myplan from "./components/Myplan";
import DashBoard from "./components/DashBoard";
import BulletinBoard from "./components/BulletinBoard";
import "./App.css";

const App = () => {
  //----------------------------
  // Environment Variables Logging
  //----------------------------
  console.log(process.env.REACT_APP_KEY_FIREBASE); // Firebase API key
  console.log(process.env.REACT_APP_KEY_GOOGLE); // Google API key
  console.log(process.env.REACT_APP_KEY_TICKETMASTER); // TicketMaster API key

  //----------------------------
  // JSX Render
  //----------------------------
  return (
    <div className="container">
      {/* Router wraps the app for navigation */}
      <Router>
        {/* Navbar displayed on all pages */}
        <Navbar />

        {/* Routes: defines all application routes */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} /> {/* Home page */}
          <Route path="/about" element={<About />} /> {/* About page */}
          <Route path="/contact" element={<Contact />} /> {/* Contact page */}
          <Route path="/login" element={<Login />} /> {/* Login page */}
          {/* Private Routes: accessible only if user is logged in */}
          <Route
            path="/ShareYourStory"
            element={<PriveteRoute element={ShareYourStory} />}
          />
          <Route path="/Profile" element={<PriveteRoute element={Profile} />} />
          <Route
            path="/PlanMyTrip"
            element={<PriveteRoute element={PlanMyTrip} />}
          />
          <Route
            path="/DashBoard"
            element={<PriveteRoute element={DashBoard} />}
          />
          <Route path="/Myplan" element={<PriveteRoute element={Myplan} />} />
          <Route
            path="/BulletinBoard"
            element={<PriveteRoute element={BulletinBoard} />}
          />
          {/* Fallback Route: redirect to Home if path doesn't match */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
