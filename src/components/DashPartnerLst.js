import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../fire";
import { useAuthState } from "react-firebase-hooks/auth";
import "./DashPartnerLst.css";

const DashPartnerLst = () => {
  //--------------------------------------
  //  State Variables
  //--------------------------------------
  const [partnerLstDb, setPartnerLstDb] = useState([]); // Stores the list of all shared trips from DB
  const [userPerf, setUserPerf] = useState([]); // Stores current user's travel preferences
  const [user] = useAuthState(auth); // Current logged-in Firebase user
  const [startuser, setStartUser] = useState(); // Start date of user's desired trip
  const [endUser, setEndUser] = useState(); // End date of user's desired trip
  const [countryToVisit, setCountryToVist] = useState(); // Country name user wants to visit
  const [potentialPartner, setPotentialPartner] = useState([]); // List of potential matching partners

  //--------------------------------------
  //  Load the partners list from the database
  //--------------------------------------
  const loadPartners = async () => {
    if (!user.uid) return;
    const url = "http://localhost:8080/www/tripmasterv01/public/loadFromAskPartner.php";
    try {
      const res = await axios.get(url);
      if (res.data) {
        const getData = res.data.map((item) => ({
          ...item,
          preference: JSON.parse(item.preference || "[]"), // Parse preference array
          eventCalender: JSON.parse(item.eventCalender || "[]"), // Parse event calendar
        }));
        setPartnerLstDb(getData);
      }
    } catch (err) {
      console.log("Error loading partners list", err);
    }
  };

  //--------------------------------------
  //  Load partners when user is authenticated
  //--------------------------------------
  useEffect(() => {
    loadPartners();
  }, [user]);

  //--------------------------------------
  //  Load current user's preferences
  //--------------------------------------
  const checkIfTherePreferences = async (uid) => {
    const data = new FormData();
    data.append("userId", uid);
    const url = "http://localhost:8080/www/tripmasterv01/public/GetProfile.php";

    try {
      const res = await axios.post(url, data);
      if (res.data) {
        const preferences = res.data;
        if (Array.isArray(preferences)) {
          setUserPerf([...preferences]); // Store user's preferences
        } else {
          console.log("Invalid format for preferences");
        }
      }
    } catch (err) {
      console.log("Error fetching preferences");
    }
  };

  //--------------------------------------
  // 🔹 Auto-load user preferences when logged in
  //--------------------------------------
  useEffect(() => {
    const fetchPreferencesStatus = async () => {
      if (user.uid) {
        await checkIfTherePreferences(user.uid);
      }
    };
    fetchPreferencesStatus();
  }, [user]);

  //--------------------------------------
  //  Function to check if two date ranges overlap or are close
  //--------------------------------------
  /** 1Sec = 1000ms
   *  1Min = 60*1000
   *  1Hour = 60*60*1000
   *  1Day = 24*60*60*1000
   */
  const datesMatchPrecent = (otherStart, otherEnd) => {
    const currentUserStart = new Date(startuser); // User's trip start date
    const currentUserEnd = new Date(endUser); // User's trip end date
    const otherStartDate = new Date(otherStart); // Partner trip start
    const otherEndDate = new Date(otherEnd); // Partner trip end

    const maxStart = Math.max(currentUserStart, otherStartDate);
    const minEnd = Math.min(currentUserEnd, otherEndDate);

    const res = (minEnd - maxStart) / (24 * 60 * 60 * 1000); // Overlap in days
    console.log(res);

    if (res > 0) {
      const myTripLength = (currentUserEnd - currentUserStart) / (24 * 60 * 60 * 1000); // Length of user's trip
      return (res / myTripLength) * 0.3; // Partial overlap adds 0.3 weight
    } else {
      if (res < 0) {
        const daysBetweenTrips = Math.abs(res); // Days difference between trips
        if (daysBetweenTrips > 0 && daysBetweenTrips <= 5) return 0.2; // Close dates add 0.2
      } else {
        if (minEnd === maxStart) return 0.2; // Exact same date counts 0.2
      }
    }
    return 0;
  };

  //--------------------------------------
  //  Merge preferences and calculate match percentage
  //--------------------------------------
  const mergAndReturnPrecentOfMatch = (prefuser, prefPartner) => {
    const merged = [...new Set([...prefuser, ...prefPartner])]; // Merge without duplicates
    const sharedPref = prefuser.filter((item) => prefPartner.includes(item)); // Common preferences
    return (sharedPref.length / merged.length) * 0.3; // Shared categories weight
  };

  //--------------------------------------
  //  Main function to find matching partners
  //--------------------------------------
  const findMyMatch = () => {
    if (!countryToVisit) {
      alert("Please enter the country you want to visit.");
      return;
    }
    if (!startuser || !endUser) {
      alert("Please select both start and end dates.");
      return;
    }

    const startDateObj = new Date(startuser);
    const endDateObj = new Date(endUser);
    if (startDateObj > endDateObj) {
      alert("Start date cannot be after end date.");
      return;
    }

    const myPotentialPar = [];
    const filterUserPref = [];

    // Extract user categories
    if (userPerf.length > 0) {
      for (let type of userPerf) {
        filterUserPref.push(type?.Category); // Add user's category
      }
    }

    // Compare each partner
    for (let partnerLst of partnerLstDb) {
      let totalMatchPrecent = 0;
      const partnerCountry = String(partnerLst?.titlePlan).toLowerCase();
      const currentCountry = String(countryToVisit).toLowerCase();

      // Match by country name
      if (partnerCountry.includes(currentCountry) && partnerLst?.uid !== user.uid) {
        totalMatchPrecent += 0.4; // Country match counts 40%
        let dMatch = datesMatchPrecent(partnerLst?.startdate, partnerLst?.enddate); // Date match weight
        totalMatchPrecent += dMatch;
        let prefMatch = mergAndReturnPrecentOfMatch(filterUserPref, partnerLst?.preference); // Preference match weight
        totalMatchPrecent += prefMatch;
      }

      // Add only if overall match ≥ 70%
      if (totalMatchPrecent * 100 >= 70) {
        myPotentialPar.push({
          ...partnerLst,
          matchPer: `${totalMatchPrecent * 100}%`,
        });
      }
    }

    setPotentialPartner(myPotentialPar); // Update state
  };

  //--------------------------------------
  //  Join a selected shared trip
  //--------------------------------------
  const joinTrip = async (trip) => {
    if (!user?.uid) {
      alert("User not logged in");
      return;
    }

    if (!trip.id_Shared_Trip) {
      alert("Invalid trip selected.");
      return;
    }

    if (trip.joinedUsers && trip.joinedUsers.includes(user.uid)) {
      alert("You already joined this trip!");
      return;
    }

    if (trip.current_Num_Part >= trip.NumOfPartners) {
      alert("Trip is full");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("id_Shared_Trip", trip.id_Shared_Trip);
      formData.append("uid", user.uid);
      formData.append("email", user.email);

      const res = await axios.post(
        "http://localhost:8080/www/tripmasterv01/public/updateTrip.php",
        formData
      );

      const response = res.data.toLowerCase();

      if (response.includes("success")) {
        alert("You joined this trip!");
        loadPartners();
      } else if (response.includes("already joined")) {
        alert("You already joined this trip!");
      } else if (response.includes("trip is full")) {
        alert("Trip is full");
      } else {
        console.log("Unknown response:", res.data);
      }
    } catch (err) {
      console.log("Error joining trip", err);
    }
  };

  //--------------------------------------
  //  Debugging logs
  //--------------------------------------
  useEffect(() => {
    console.log("Loaded partners from DB:", partnerLstDb);
    console.log("Current user preferences:", userPerf);
  }, [partnerLstDb, userPerf]);

  useEffect(() => {
    console.log("Potential partner matches:", potentialPartner);
  }, [potentialPartner]);

  //--------------------------------------
  //  Render
  //--------------------------------------
  return (
    <div className="containerLst">
      {/* Input section for user search preferences */}
      <div className="partnerslst">
        <label>To Find Match we need more Info</label>
        <input
          className="countryInput"
          type="text"
          placeholder="Country Name You want to visit"
          value={countryToVisit || ""}
          onChange={(e) => setCountryToVist(e.target.value)}
        />

        <div className="dateInputs">
          <span>From:</span>
          <input
            type="Date"
            value={startuser || ""}
            className="startDateInput"
            onChange={(e) => setStartUser(e.target.value)}
          />
          <span>To:</span>
          <input
            type="Date"
            className="endDateInput"
            value={endUser || ""}
            onChange={(e) => setEndUser(e.target.value)}
          />
        </div>

        <button className="btnPartner" onClick={findMyMatch}>
          Find Me Match
        </button>
      </div>

      {/* Display potential matches */}
      <div className="MatchContainer">
        {potentialPartner.map((p, idx) => (
          <div key={idx} className="matchCard">
            <h3>{p.titlePlan}</h3>
            <p>
              {p.startdate} ➝ {p.enddate}
            </p>
            <p>Match: {p.matchPer}</p>
            <p>Message: {p.Msg}</p>

            {/* Show event list if available */}
            {p.eventCalender && p.eventCalender.length > 0 && (
              <div className="eventList">
                <h4>Event Plan:</h4>
                <ul>
                  {p.eventCalender.map((ev, i) => (
                    <li key={i}>{ev.title}</li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={() => joinTrip(p)}>JOIN THIS TRIP</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashPartnerLst;
