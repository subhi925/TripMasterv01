import { useEffect, useState } from "react";
import axios from "axios";
import { auth } from "../fire";
import { useAuthState } from "react-firebase-hooks/auth";
import "./DashPartnerLst.css";

const DashPartnerLst = () => {
  const [partnerLstDb, setPartnerLstDb] = useState([]);
  const [userPerf, setUserPerf] = useState([]);
  const [user] = useAuthState(auth);
  const [startuser, setStartUser] = useState();
  const [enduser, setEndUser] = useState();
  const [countryToVisit, setCountryToVist] = useState();
  const [potentialPartner, setPotentialPartner] = useState([]);

  //--------------
  //------------Load Lst From DB-----
  const loadPartners = async () => {
    if (!user.uid) return;
    const url =
      "http://localhost:8080/www/tripmasterv01/public/loadFromAskPartner.php";
    try {
      const res = await axios.get(url);
      //console.log("the get method return", res);
      if (res.data) {
        const getData = res?.data.map((item) => ({
          ...item,
          preference: JSON.parse(item.preference || []),
          eventCalender: JSON.parse(item.eventCalender || []),
        }));
        setPartnerLstDb(getData);
      }
    } catch (err) {}
  };
  //----------------
  useEffect(() => {
    loadPartners();
  }, [user]);
  //-------------------------------------
  //-----Load Current User Perfe-------
  const checkIfTherePreferences = async (uid) => {
    const data = new FormData();
    data.append("userId", uid);
    const url = "http://localhost:8080/www/tripmasterv01/public/GetProfile.php";
    try {
      const res = await axios.post(url, data);
      if (res.data) {
        const preferences = res.data;
        if (preferences) {
          if (Array.isArray(preferences)) {
            //check If it becom an Array
            setUserPerf([...preferences]);
          } else {
            console.log("Invalid Format");
          }
        }
      }
    } catch (err) {
      console.log("Error Fetching");
    }
  };
  //----------------------------------------------------------------------
  //-------Function to check if the dates are matchs or close return number------
  //------/** 1Sec= 1000milsec
  //          1Min= 60*1000
  //          1hour=60*60*1000
  //          1Day=24*60*60*1000 */
  const datesMatchPrecent = (otherStart, otherEnd) => {
    const currentUserStart = new Date(startuser);
    const currentUserEnd = new Date(enduser);
    const otherStartDate = new Date(otherStart);
    const otherEndDate = new Date(otherEnd);
    const maxStart = Math.max(currentUserStart, otherStartDate);
    const minEnd = Math.min(currentUserEnd, otherEndDate);
    const res = (minEnd - maxStart) / (24 * 60 * 60 * 1000);
    console.log(res);
    if (res > 0) {
      const myTriplong =
        (currentUserEnd - currentUserStart) / (24 * 60 * 60 * 1000);
      return (res / myTriplong) * 0.3;
    } else {
      if (res < 0) {
        const disbetweentheTrips = Math.abs(res);
        if (disbetweentheTrips > 0 && disbetweentheTrips <= 5) return 0.2;
      }
      else{
        if(minEnd===maxStart)return 0.2

      }
    }
    return 0;
  };

  ///----------------------------------------------------------

  //call the checkPreference Function to load for user
  useEffect(() => {
    const fetchPreferencesStatus = async () => {
      if (user.uid) {
        await checkIfTherePreferences(user.uid);
      }
    };
    fetchPreferencesStatus();
  }, [user]);
  //---------------------------------
  //------------Merg the Two perference no duplicate
  const mergAndReturnPrecentOfMatch = (prefuser, prefPartner) => {
    const merg = [...new Set([...prefuser, ...prefPartner])];
    const sharedPref = prefuser.filter((item) => prefPartner.includes(item));
    return (sharedPref.length / merg.length) * 0.3;
  };
  //--------------Find Me Match Button----
  const findMyMatch = () => {
    if (!countryToVisit) return;
    if (!enduser || !startuser) return;
    const myPotentialPar = [];
    const filterUserPref = [];
    if (userPerf.length > 0) {
      for (let type of userPerf) {
        filterUserPref.push(type?.Category);
      }
    }
    for (let partnerLst of partnerLstDb) {
      let totalMatchPrecent = 0;
      const partnerCountry = String(partnerLst?.titlePlan).toLowerCase();
      const currentCountry = String(countryToVisit).toLowerCase();
      if (
        partnerCountry.includes(currentCountry) &&
        partnerLst?.uid !== user.uid
      ) {
        totalMatchPrecent += 0.4;
        let dMatch = datesMatchPrecent(
          partnerLst?.startdate,
          partnerLst?.enddate
        );
        console.log("dateMatch", dMatch);
        totalMatchPrecent += dMatch;
        let prefMatch = mergAndReturnPrecentOfMatch(
          filterUserPref,
          partnerLst?.preference
        );
        console.log("prefMatch", prefMatch);
        totalMatchPrecent += prefMatch;
      }
      if (totalMatchPrecent * 100 >= 70) {
        myPotentialPar.push({
          ...partnerLst,
          matchPer: `${totalMatchPrecent * 100}%`,
        });
      }
    }
    setPotentialPartner(myPotentialPar);
  };
  //----------------------------
  //--------------Join Trip---------------
  const joinTrip = async (trip) => {
  if (!user?.uid) {
    alert("User not logged in");
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



  //---------------------Debugs
  useEffect(() => {
    console.log("the listDB", partnerLstDb);
    console.log("the user pref", userPerf);
  }, [partnerLstDb, userPerf]);

  useEffect(() => {
    console.log("potential", potentialPartner);
  }, [potentialPartner]);

  return (
    <div className="containerLst">
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
            value={enduser || ""}
            onChange={(e) => setEndUser(e.target.value)}
          />
        </div>
        <button className="btnPartner" onClick={findMyMatch}>
          Find Me Match
        </button>
      </div>
      <div className="MatchContainer">
        {potentialPartner.map((p, idx) => (
          <div key={idx} className="matchCard">
            <h3>{p.titlePlan}</h3>
            <p>
              {p.startdate} ➝ {p.enddate}
            </p>
            <p>Match: {p.matchPer}</p>
            <p>Message: {p.Msg}</p>

            {/* Event plan - only places */}
            {p.eventCalender && p.eventCalender.length > 0 && (
              <div className="eventList">
                <h4> Event Plan:</h4>
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
