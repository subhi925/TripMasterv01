import React, { useState, useEffect } from "react";
import Profile from "./components/Profile";
import Login from "./components/Login";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import PriveteRoute from "./components/PriveteRoute";
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
  console.log(process.env.REACT_APP_KEY_FIREBASE);
  console.log(process.env.REACT_APP_KEY_GOOGLE);
  console.log(process.env.REACT_APP_KEY_TICKETMASTER);

  return (
    <div className="container">
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
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

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
