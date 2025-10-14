import React, { useEffect, useState } from "react"; // React hooks
import "./Home.css";
import axios from "axios"; // HTTP requests
import { auth } from "../fire"; // Firebase auth
import { useAuthState } from "react-firebase-hooks/auth"; // Firebase hook
import { DotLottieReact } from "@lottiefiles/dotlottie-react"; // Animated Lottie component

//----------------------------
// HOME COMPONENT
//----------------------------
const Home = () => {
  //----------------------------
  // STATE VARIABLES
  //----------------------------
  const [user] = useAuthState(auth); // Current logged-in user
  const [dashboardData, setDashboardData] = useState([]); // Array of all trips on dashboard
  const [moveOldPlansToHistory, setMoveOldPlansToHistory] = useState([]); // Indexes of old trips to move to history

  //----------------------------
  // FUNCTION: LOAD DASHBOARD DATA
  // Load user's trips from the backend and parse JSON fields
  //----------------------------
  const loadParmetersPlan = async (uid) => {
    const data = new FormData();
    data.append("uid", uid);
    const url =
      "http://localhost:8080/www/tripmasterv01/public/loadtodashboard.php";

    try {
      const res = await axios.post(url, data);
      if (res.data) {
        // Parse JSON fields for each trip
        const getData = res.data.map((item) => ({
          ...item,
          places: item.places ? JSON.parse(item.places) : [],
          smartDailyPlans: JSON.parse(item.smartDailyPlans || []),
          dailyHours: JSON.parse(item.dailyHours || []),
          eventCalender: JSON.parse(item.eventCalender || []),
          startloc: JSON.parse(item.startloc || []),
        }));
        setDashboardData(getData); // Save trips to state
      } else {
        console.log("Invalid Format");
      }
    } catch (err) {
      console.log("Error Fetching");
    }
  };

  //----------------------------
  // USE EFFECT: FETCH DASHBOARD DATA WHEN USER CHANGES
  //----------------------------
  useEffect(() => {
    const fetchParmeters = async () => {
      if (user) {
        await loadParmetersPlan(user.uid);
      }
    };
    fetchParmeters();
  }, [user]);

  //----------------------------
  // USE EFFECT: FIND OLD PLANS TO MOVE TO HISTORY
  //----------------------------
  useEffect(() => {
    if (dashboardData.length > 0) {
      for (let i = 0; i < dashboardData.length; i++) {
        let dateToday = new Date();
        let tripLastDay = dashboardData[i]?.endDate;
        let tripLastDayDate = new Date(tripLastDay);
        if (dateToday > tripLastDayDate) {
          // Save index of old trips
          setMoveOldPlansToHistory((prev) => [...prev, i]);
        }
      }
    }
  }, [dashboardData]);

  //----------------------------
  // FUNCTION: MOVE OLD PLAN TO HISTORY IN DB
  //----------------------------
  const moveOldPlanToHistoryDb = async (index) => {
    if (!user) return;

    const isActive = 0;
    const data = new FormData();
    const trip = dashboardData[index];

    // Append trip details
    data.append("id", trip?.id);
    data.append("userId", trip?.userid);
    data.append("eventCalender", JSON.stringify(trip?.eventCalender));
    data.append("places", JSON.stringify(trip?.places));
    data.append("isActive", String(isActive ? 1 : 0));
    data.append("titlePlan", trip?.titlePlan);
    data.append("startDate", trip?.startDate);
    data.append("endDate", trip?.endDate);
    data.append("smartDailyPlans", JSON.stringify(trip?.smartDailyPlans));
    data.append("dailyHours", JSON.stringify(trip?.dailyHours));
    data.append("startloc", JSON.stringify(trip?.startloc));

    const url =
      "http://localhost:8080/www/tripmasterv01/public/movetohistory.php";

    try {
      const res = await axios.post(url, data);
      console.log("Server response:", res.data);
    } catch (err) {
      console.error("Failed", err);
    }
  };

  //----------------------------
  // FUNCTION: DELETE PLAN FROM DASHBOARD
  //----------------------------
  const changeDB = async (idDB, uid) => {
    const data = new FormData();
    data.append("uid", uid);
    data.append("id", idDB);

    const url = "http://localhost:8080/www/tripmasterv01/public/DeletPlan.php";
    try {
      const res = await axios.post(url, data);
      if (res.data) {
        console.log("Deleted plan:", res.data);
      }
    } catch (err) {}
  };

  //----------------------------
  // USE EFFECT: MOVE OLD PLANS AND DELETE FROM DASHBOARD
  //----------------------------
  useEffect(() => {
    const updateUserData = async () => {
      if (moveOldPlansToHistory.length > 0 && user) {
        for (let i = 0; i < moveOldPlansToHistory.length; i++) {
          await moveOldPlanToHistoryDb(moveOldPlansToHistory[i]);
          await changeDB(
            dashboardData[moveOldPlansToHistory[i]].id,
            dashboardData[moveOldPlansToHistory[i]].userid
          );
        }
      }
    };
    updateUserData();
  }, [moveOldPlansToHistory]);

  //----------------------------
  // DEBUGGING
  //----------------------------
  useEffect(() => {
    console.log("HomeDashboard", dashboardData);
  }, [dashboardData]);

  //----------------------------
  // JSX / RENDER
  //----------------------------
  return (
    <div className="container">
      {/* Card 1 */}
      <div className="cardTravel">
        <h3> An easier trip, every time</h3>
        <p>
          Imagine having one smart place for all your travel details — with
          real-time updates as your journey unfolds. Discover why for millions
          of travelers, life without TripMaster is already in the past.
        </p>
      </div>

      {/* Card 2 with Lottie animation */}
      <div className="cardTravel">
        <h3>You book it — we handle the rest</h3>
        <p>
          No matter where you book, TripMaster keeps your travel plans
          organized. Just sign up, choose PlanMyTrip, and we’ll take care of
          everything from there.
        </p>

        <DotLottieReact
          src="https://lottie.host/90daef68-a25b-4598-9e1e-b9797c6cb5f2/wStMUwDVso.json"
          loop
          autoplay
        />
      </div>
    </div>
  );
};

export default Home;
