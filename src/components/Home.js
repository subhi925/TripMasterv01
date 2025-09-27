import React, { useEffect, useState } from "react"; //imrse
import "./Home.css";
import axios from "axios";
import { auth } from "../fire";
import { useAuthState } from "react-firebase-hooks/auth";
import { DotLottieReact } from "@lottiefiles/dotlottie-react"; //npm install @lottiefiles/dotlottie-react

const Home = () => {
  //sfc
  const [user] = useAuthState(auth);
  const [dashboardData, setDashboardData] = useState([]);
  const [moveOldPlansToHistory, setMoveOldPlansToHistory] = useState([]);

  //Load the parmeters value for plan to check if the trip date pass to move to history....
  const loadParmetersPlan = async (uid) => {
    const data = new FormData();
    data.append("uid", uid);
    const url =
      "http://localhost:8080/www/tripmasterv01/public/loadtodashboard.php";
    try {
      const res = await axios.post(url, data);
      if (res.data) {
        const getData = res.data.map((item) => ({
          ...item,
          places: item.places ? JSON.parse(item.places) : [],
          smartDailyPlans: JSON.parse(item.smartDailyPlans || []),
          dailyHours: JSON.parse(item.dailyHours || []),
          eventCalender: JSON.parse(item.eventCalender || []),
          startloc: JSON.parse(item.startloc || []),
        }));
        setDashboardData(getData);
      } else {
        console.log("Invalid Format");
      }
    } catch (err) {
      console.log("Error Fetching");
    }
  };

  useEffect(() => {
    const fetchParmeters = async () => {
      if (user) {
        await loadParmetersPlan(user.uid);
      }
    };
    fetchParmeters();
  }, [user]);
  //----------------filtered the old plans if they exits save there index to move them and update the dashboard--------------------
  useEffect(() => {
    if (dashboardData.length > 0) {
      for (let i = 0; i < dashboardData.length; i++) {
        let dateToday = new Date();
        let tripLastDay = dashboardData[i]?.endDate;
        let tripLastDayDate = new Date(tripLastDay);
        if (dateToday > tripLastDayDate) {
          setMoveOldPlansToHistory((prev) => [...prev, i]);
        }
      }
    }
  }, [dashboardData]);

  //-----Move to history--------------
  const moveOldPlanToHistoryDb = async (index) => {
    if (!user) return;
    const isActive = 0;
    const data = new FormData();
    data.append("id", dashboardData[index]?.id);
    data.append("userId", dashboardData[index]?.userid);
    data.append(
      "eventCalender",
      JSON.stringify(dashboardData[index]?.eventCalender)
    );
    data.append("places", JSON.stringify(dashboardData[index]?.places));
    data.append("isActive", String(isActive ? 1 : 0));
    data.append("titlePlan", dashboardData[index]?.titlePlan);
    data.append("startDate", dashboardData[index]?.startDate);
    data.append("endDate", dashboardData[index]?.endDate);
    data.append(
      "smartDailyPlans",
      JSON.stringify(dashboardData[index]?.smartDailyPlans)
    );
    data.append("dailyHours", JSON.stringify(dashboardData[index]?.dailyHours));
    const url =
      "http://localhost:8080/www/tripmasterv01/public/movetohistory.php";
    try {
      const res = await axios.post(url, data);
      console.log("Server response:", res.data);
      console.log("succes send to database");
    } catch (err) {
      console.error("Failed", err);
    }
  };
  //-----------------Delte from DB---------------
  // This function sends a request to the server to delete a plan from the database
  // It takes the id of the plan and the user's uid as parameters
  // It uses axios to send a POST request to the server with the plan id and user uid
  // If the request is successful, it logs the response data
  // If there is an error, it catches it and does nothing
  const changeDB = async (idDB, uid) => {
    const data = new FormData();
    data.append("uid", uid);
    data.append("id", idDB);
    const url = "http://localhost:8080/www/tripmasterv01/public/DeletPlan.php";
    try {
      const res = await axios.post(url, data);
      if (res.data) {
        console.log("the delete is", res.data);
      }
    } catch (err) {}
  };
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

  //--------------------------------

  //-------------------Debug's-------------
  useEffect(() => {
    console.log("HomeDashboard", dashboardData);
  }, [dashboardData]);
  //-----------------------------------------------
  return (
    <div className="container">
      <div className="cardTravel">
        <h3> An easier trip, every time</h3>
        <p>
          Imagine having one smart place for all your travel details — with
          real-time updates as your journey unfolds. Discover why for millions
          of travelers, life without TripMaster is already in the past.
        </p>
      </div>

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
