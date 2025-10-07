import { useState, useEffect } from "react";
import "./DashBoard.css";
import axios from "axios";
import { auth } from "../fire";
import { useAuthState } from "react-firebase-hooks/auth";
import PlanCalendar from "./PlanCalendar";
import { FaRegUserCircle } from "react-icons/fa"; //Icon Libary for react
import GoogleMapView from "./GoogleMapView";
import HistoryPlans from "./HistoryPlans";
import DahsBulltin from "./DahsBulltin";
import PartnerDash from "./PartnerDash";

const DashBoard = () => {
  const [editPress, setEditPress] = useState(false);
  const [finalePress, setFinalePress] = useState(true);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [user] = useAuthState(auth);
  const [dashboardData, setDashboardData] = useState([]);
  const [displayName, setDisplayName] = useState("");
  const [deletePlan, setDeletePlan] = useState(false);
  const [idDB, setIdDB] = useState(-1);
  const [changeDate, setChangeDate] = useState(false);
  const [newArrive, setNewArrive] = useState("");
  const [changed, setChanged] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [dayPlanShow, setDayPlanShow] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [myBulletin, setMyBulletin] = useState(false);
  const [findPartner, setFindPartner] = useState(false);
  //-----------------------------------------------
  //Load the parmeters value for plan
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
          places: JSON.parse(item.places || []),
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
  //-------------------------------------
  //------------------useEffect to load the parmeters and display name----------------
  // This effect runs when the component mounts or when the user changes
  // It fetches the parameters for the user's plans and sets the display name
  useEffect(() => {
    const fetchParmeters = async () => {
      if (user) {
        await loadParmetersPlan(user.uid);
        setDisplayName(user.displayName);
      }
    };
    fetchParmeters();
  }, [user]);
  //--------------------------
  // -----------------handel finale Press and Edit Press----------------
  // This function sets the state for editPress to true and finalePress to false
  // It is called when the user wants to edit a plan
  const handelfinale = () => {
    setEditPress(false);
    setFinalePress(true);
    setChangeDate(false);
    setShowHistory(false);
    setMyBulletin(false);
    setFindPartner(false);
  };
  //--------------------------------
  const handelEdit = () => {
    setEditPress(true);
    setFinalePress(false);
    setChangeDate(false);
    setShowHistory(false);
    setMyBulletin(false);
    setFindPartner(false);
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

  //---------------------------------------
  //-------------------------handel Delete Plan----------
  // This function handles the deletion of a plan
  // It takes the index of the plan to be deleted as a parameter
  // It checks if there are any plans in the dashboardData array
  const handelDeletePlan = (index) => {
    if (dashboardData.length > 0) {
      if (
        window.confirm(
          `Are you sure you want to delete ${dashboardData[index].titlePlan}`
        )
      ) {
        setIdDB(dashboardData[index].id);
        const newData = dashboardData.filter((_, i) => i !== index);
        setDashboardData(newData);

        // Update the selected index
        if (newData.length === 0) {
          setSelectedPlanIndex(-1); // none plan left
        } else if (index >= newData.length) {
          setSelectedPlanIndex(newData.length - 1); // choose the new last index
        } else {
          setSelectedPlanIndex(index); // choose the same index if possible
        }
        setDeletePlan(true);
      }
    }
  };

  //-----------------------------------------------------
  // This effect runs when the deletePlan state changes
  // It checks if deletePlan is true and idDB is not -1
  // If so, it calls the changeDB function to delete the plan from the database
  // After that, it sets deletePlan to false
  useEffect(() => {
    const fetchAfterDelete = async () => {
      if (deletePlan && idDB !== -1) {
        await changeDB(idDB, user.uid);
        setDeletePlan(false);
      }
    };
    fetchAfterDelete();
  }, [deletePlan]);

  //---------------------------------------------------
  // This function handles the events updated in the calendar
  // It takes the updated events as a parameter
  // It updates the dashboardData state with the new events for the selected plan index
  const handleEventsUpdated = (updatedEvents) => {
    setDashboardData((prev) => {
      const currentEvents = prev[selectedPlanIndex]?.eventCalender || []; // Get the current events for the selected plan index
      const same =
        JSON.stringify(currentEvents) === JSON.stringify(updatedEvents);
      if (same) return prev; // no need to change
      const newData = [...prev];
      newData[selectedPlanIndex] = {
        ...newData[selectedPlanIndex],
        eventCalender: updatedEvents,
      };
      return newData;
    });
  };

  //--------------------------------------
  //------------------handle Date Change----------------
  // This function sets the state for editPress, finalePress, and changeDate
  // It is called when the user wants to change the date of a plan
  const handleDateChange = () => {
    setEditPress(false);
    setFinalePress(false);
    setChangeDate(true);
    setShowHistory(false);
    setMyBulletin(false);
    setFindPartner(false);
  };
  //--------------------change date----
  // This function changes the date of the selected plan
  // It checks if newArrive is set, calculates the difference in days from the old arrive date,
  // and updates the startDate, endDate, dailyHours, and eventCalender accordingly
  // It then updates the dashboardData state and calls updateDashboardInDB to save changes to the database
  const dateChange = async () => {
    if (newArrive) {
      let oldArrive = new Date(
        dashboardData[selectedPlanIndex]?.dailyHours[0]?.day
      );
      let nArrive = new Date(newArrive);
      let dif = (nArrive - oldArrive) / 86400000;

      const newDashboardData = [...dashboardData];
      const startDateold = new Date(
        newDashboardData[selectedPlanIndex].startDate
      );
      const startDateobj = new Date(startDateold.getTime() + dif * 86400000);
      const updatedstartDate = startDateobj.toISOString().split("T")[0];
      const endDateold = new Date(newDashboardData[selectedPlanIndex].endDate);
      const endDateobj = new Date(endDateold.getTime() + dif * 86400000);
      const updatedEndDate = endDateobj.toISOString().split("T")[0];

      const updatedEventCalender = shiftEventCalenderDates(
        newDashboardData[selectedPlanIndex].eventCalender,
        dif
      );

      const updatedDailyHours = newDashboardData[
        selectedPlanIndex
      ].dailyHours.map((item) => {
        let oldDay = new Date(item.day);
        let newDayObj = new Date(oldDay.getTime() + dif * 86400000);
        let newDay = newDayObj.toISOString().split("T")[0];
        return {
          ...item,
          day: newDay,
        };
      });
      newDashboardData[selectedPlanIndex] = {
        ...newDashboardData[selectedPlanIndex],
        dailyHours: updatedDailyHours,
        endDate: updatedEndDate,
        startDate: updatedstartDate,
        eventCalender: updatedEventCalender,
      };

      setDashboardData(newDashboardData);
      await updateDashboardInDB(newDashboardData[selectedPlanIndex]);
      setChanged("Changed");
    }
  };
  //----------------help Function to change Date----------------------
  // This function shifts the event calendar dates by a specified number of days
  // It takes an array of events and the number of days to shift as parameters
  // It returns a new array of events with updated start and end dates
  const shiftEventCalenderDates = (eventsArr, days) => {
    return eventsArr.map((event) => {
      const oldStart = new Date(event.start);
      const newStart = new Date(oldStart.getTime() + days * 86400000);
      const oldEnd = new Date(event.end);
      const newEnd = new Date(oldEnd.getTime() + days * 86400000);

      return {
        ...event,
        start: newStart.toISOString().slice(0, 16), // yyyy-mm-ddThh:mm
        end: newEnd.toISOString().slice(0, 16),
      };
    });
  };

  //---------------Call to update Date----------------------
  // This function updates the dashboard plan in the database
  // It takes the updated plan as a parameter
  // It creates a FormData object with the plan details and sends a POST request to the server
  // If the request is successful, it does nothing; if there is an error, it catches it and does nothing
  const updateDashboardInDB = async (updatedPlan) => {
    const data = new FormData();
    data.append("uid", user.uid);
    data.append("id", updatedPlan.id);
    data.append("dailyHours", JSON.stringify(updatedPlan.dailyHours));
    data.append("startDate", updatedPlan.startDate);
    data.append("endDate", updatedPlan.endDate);
    data.append("eventCalender", JSON.stringify(updatedPlan.eventCalender));

    const url =
      "http://localhost:8080/www/tripmasterv01/public/UpdateDashboardPlan.php";
    try {
      const res = await axios.post(url, data);
    } catch (err) {}
  };
  //-------------defualt day by selected to show in the maps
  // This effect runs when the selectedPlanIndex or dashboardData changes
  useEffect(() => {
    if (
      dashboardData.length > selectedPlanIndex &&
      dashboardData[selectedPlanIndex]
    ) {
      setDayPlanShow(dashboardData[selectedPlanIndex]?.dailyHours[0]?.day);
    } else {
      setDayPlanShow("");
    }
  }, [selectedPlanIndex, dashboardData]);
  //-----------------------------------
  //-------History Parmeters---------------
  //set the history to show to the customer
  const openHistory = () => {
    setShowHistory(true);
    setChangeDate(false);
    setFinalePress(false);
    setEditPress(false);
    setMyBulletin(false);
    setFindPartner(false);
  };

  //---------Checks Logs Debugs-------------
  useEffect(() => {
    console.log("Dash Data", dashboardData);
  }, [dashboardData]);
  useEffect(() => {
    console.log("the day is", dayPlanShow);
  }, [dayPlanShow]);

  //---------------------------------
  //to make a Bulltin during the trip ask help lost.....
  const handelBulletin = () => {
    setMyBulletin(true);
    setChangeDate(false);
    setEditPress(false);
    setFinalePress(false);
    setShowHistory(false);
    setFindPartner(false);
  };
  //-------------------------------------------
  //---Partner Components----------------
  const handelFindPartner = () => {
    setFindPartner(true);
    setMyBulletin(false);
    setChangeDate(false);
    setEditPress(false);
    setFinalePress(false);
    setShowHistory(false);
  };

  return (
    <div>
      {/*-----the user name block with icon and name-----*/}
      {displayName && (
        <div className="usernameBlock">
          <FaRegUserCircle size={36} className="iconUser" />
          <p className="usershowName">{displayName}</p>
        </div>
      )}
      {/*-----shared trip indicator-----*/}
      {dashboardData.length > 0 &&
        dashboardData[selectedPlanIndex]?.isShared === "Yes" && (
          <div className="sharedTripIndicator">
            <h3>SHARED</h3>
          </div>
        )}
      {/*-----the menu and the select for the plans-----*/}
      <div className="menueDash">
        <span className="menuePart" onClick={() => handelEdit()}>
          Edite Plan
        </span>
        <span className="menuePart" onClick={() => handelfinale()}>
          Final Plan
        </span>
        <span className="menuePart" onClick={() => openHistory()}>
          History
        </span>
        <span className="menuePart" onClick={() => handelFindPartner()}>
          Find Me Partner
        </span>
        <span className="menuePart" onClick={() => handelBulletin()}>
          My Bulletin Board
        </span>
        <div className="selectMenu">
          <label htmlFor="MyTrips">Choose your Trip:</label>
          <select
            className="MyTrips"
            onChange={(e) => setSelectedPlanIndex(Number(e.target.value))}
          >
            {dashboardData.length > 0 &&
              dashboardData.map((item, index) => (
                <option
                  key={index}
                  value={index}
                >{`${item.titlePlan} start Date:${item.startDate}`}</option>
              ))}
          </select>
          {/*-----the buttons for the selected plan-----*/}
          <div className="MyTripsBtn">
            <span
              className="menuePart"
              onClick={() => handelDeletePlan(selectedPlanIndex)}
            >
              Delete Selected Plan
            </span>
            <span className="menuePart" onClick={() => handleDateChange()}>
              Change Date
            </span>
          </div>
        </div>
      </div>
      <div className="containerDash">
        {/*-----the selected plan details change date-----*/}
        {dashboardData.length > 0 && changeDate && (
          <div className="myInputs">
            Enter the new arrive Date if your total trip was n days it will
            remain the same from the new arrive Date if you want to spend more
            Days you have to go back to build anew Plan.
            <input
              type="Date"
              value={newArrive}
              onChange={(e) => setNewArrive(e.target.value)}
            ></input>
            {changed && <h2>The Date Changed Sucsses</h2>}
            <span className="menuePart" onClick={() => dateChange()}>
              Change
            </span>
          </div>
        )}
        {/*-----the selected plan details-----*/}
        {dashboardData.length > 0 && finalePress && (
          <div className="finalPlanContainer">
            <div className="innerfinalPlanContainerMenue">
              {/*-----the selected plan map details calendar-----*/}
              <span className="menuePart" onClick={() => setShowMap(!showMap)}>
                {showMap ? `Calendar Details` : `Show Map & Details`}
              </span>
            </div>
            {/*-----the selected plan map details calendar-----*/}
            {showMap ? (
              <div className="mapShow">
                <div className="mapWrapper">
                  <GoogleMapView
                    eventCalender={
                      dashboardData[selectedPlanIndex]?.eventCalender || []
                    }
                    dayPlanShow={dayPlanShow}
                    center={
                      dashboardData[selectedPlanIndex]?.startloc || {
                        lat: 0,
                        lng: 0,
                      }
                    }
                  />
                </div>

                <div className="btn-containr">
                  {dashboardData[selectedPlanIndex].dailyHours.map(
                    (daydate, idx) => (
                      <button
                        className="btnDayShow"
                        key={idx}
                        onClick={() => setDayPlanShow(daydate.day)}
                      >{`Day ${idx + 1}`}</button>
                    )
                  )}
                </div>
                <div className="infocontain">
                  {dayPlanShow &&
                    dashboardData[selectedPlanIndex]?.eventCalender
                      ?.filter(
                        (e) =>
                          e.start.split("T")[0]?.trim() === dayPlanShow.trim()
                      )
                      .map((plan, idx) => {
                        const namePlan = plan?.originalData?.name;
                        const travelInfo = plan?.originalData?.travelInfo;

                        return (
                          <div key={idx} className="transportCard">
                            {travelInfo ? (
                              <>
                                <h5 className="transportTitle">{`To Go to ${namePlan}`}</h5>
                                {travelInfo?.transitDetails.map((tran, inx) => (
                                  <div key={inx} className="transportDetails">
                                    <p>
                                      <strong>
                                        departureStop : {tran?.departureStop}
                                      </strong>
                                    </p>
                                    <p>
                                      <strong>
                                        arrivalStop : {tran?.arrivalStop}
                                      </strong>
                                    </p>
                                    <p>
                                      <strong>
                                        lineName : {tran?.lineName}
                                      </strong>
                                    </p>
                                    <p>
                                      <strong>
                                        numStops : {tran?.numStops}
                                      </strong>
                                    </p>
                                    <p>
                                      <strong>
                                        vehicleType : {tran?.vehicleType}
                                      </strong>
                                    </p>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <p> No Transport info </p>
                            )}
                          </div>
                        );
                      })}
                </div>
              </div>
            ) : (
              /*-----the selected plan calendar details-----*/
              <PlanCalendar
                editPress={editPress && !finalePress}
                finalePress={finalePress && !editPress}
                smartDailyPlans={
                  dashboardData[selectedPlanIndex]?.smartDailyPlans || []
                }
                dailyHours={dashboardData[selectedPlanIndex]?.dailyHours || []}
                places={dashboardData[selectedPlanIndex]?.places || []}
                id={dashboardData[selectedPlanIndex]?.id || -1}
                uid={user.uid}
                fEvents={dashboardData[selectedPlanIndex]?.eventCalender || []}
                onEventsUpdated={handleEventsUpdated}
              />
            )}
          </div>
        )}
        {/*-----the selected plan calendar Edit details-----*/}
        {dashboardData.length > 0 && editPress && (
          <PlanCalendar
            editPress={editPress && !finalePress}
            finalePress={finalePress && !editPress}
            smartDailyPlans={
              dashboardData[selectedPlanIndex]?.smartDailyPlans || []
            }
            dailyHours={dashboardData[selectedPlanIndex]?.dailyHours || []}
            places={dashboardData[selectedPlanIndex]?.places || []}
            id={dashboardData[selectedPlanIndex]?.id || -1}
            uid={user.uid}
            fEvents={dashboardData[selectedPlanIndex]?.eventCalender || []}
            onEventsUpdated={handleEventsUpdated}
          />
        )}
        {showHistory && <HistoryPlans uid={user.uid} />}
        {myBulletin && <DahsBulltin></DahsBulltin>}
        {findPartner && (
          <PartnerDash
            dashboardData={dashboardData || []}
            uid={user.uid}
            email={user.email}
          />
        )}
      </div>
    </div>
  );
};

export default DashBoard;
