import { useState, useEffect } from "react";
import "./DashBoard.css";
import axios from "axios";
import { auth } from "../fire";
import { useAuthState } from "react-firebase-hooks/auth";
import PlanCalendar from "./PlanCalendar";
import { FaRegUserCircle } from "react-icons/fa";
import GoogleMapView from "./GoogleMapView";
import HistoryPlans from "./HistoryPlans";
import DahsBulltin from "./DahsBulltin";
import PartnerDash from "./PartnerDash";

const DashBoard = () => {
  //----------------------------
  // STATE VARIABLES
  //----------------------------
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

  //----------------------------
  // FETCH DASHBOARD DATA
  // Loads user trip plans from PHP backend using user ID
  //----------------------------
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

  //----------------------------
  // INITIAL DATA LOAD ON USER LOGIN
  //----------------------------
  useEffect(() => {
    const fetchParmeters = async () => {
      if (user) {
        await loadParmetersPlan(user.uid);
        setDisplayName(user.displayName);
      }
    };
    fetchParmeters();
  }, [user]);

  //----------------------------
  // MENU ACTIONS (EDIT / FINAL VIEW)
  //----------------------------
  const handelfinale = () => {
    setEditPress(false);
    setFinalePress(true);
    setChangeDate(false);
    setShowHistory(false);
    setMyBulletin(false);
    setFindPartner(false);
  };

  const handelEdit = () => {
    setEditPress(true);
    setFinalePress(false);
    setChangeDate(false);
    setShowHistory(false);
    setMyBulletin(false);
    setFindPartner(false);
  };

  //----------------------------
  // DELETE PLAN FROM DATABASE
  //----------------------------
  const changeDB = async (idDB, uid) => {
    const data = new FormData();
    data.append("uid", uid);
    data.append("id", idDB);
    const url = "http://localhost:8080/www/tripmasterv01/public/DeletPlan.php";
    try {
      const res = await axios.post(url, data);
      if (res.data) console.log("the delete is", res.data);
    } catch (err) {}
  };

  //----------------------------
  // DELETE PLAN FROM DASHBOARD VIEW
  //----------------------------
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

        if (newData.length === 0) setSelectedPlanIndex(-1);
        else if (index >= newData.length)
          setSelectedPlanIndex(newData.length - 1);
        else setSelectedPlanIndex(index);

        setDeletePlan(true);
      }
    }
  };

  //----------------------------
  // EFFECT TO DELETE PLAN FROM DATABASE AFTER CONFIRMATION
  //----------------------------
  useEffect(() => {
    const fetchAfterDelete = async () => {
      if (deletePlan && idDB !== -1) {
        await changeDB(idDB, user.uid);
        setDeletePlan(false);
      }
    };
    fetchAfterDelete();
  }, [deletePlan]);

  //----------------------------
  // HANDLE CALENDAR EVENTS UPDATE
  //----------------------------
  const handleEventsUpdated = (updatedEvents) => {
    setDashboardData((prev) => {
      const currentEvents = prev[selectedPlanIndex]?.eventCalender || [];
      const same =
        JSON.stringify(currentEvents) === JSON.stringify(updatedEvents);
      if (same) return prev;

      const newData = [...prev];
      newData[selectedPlanIndex] = {
        ...newData[selectedPlanIndex],
        eventCalender: updatedEvents,
      };
      return newData;
    });
  };

  //----------------------------
  // ENABLE DATE CHANGE MODE
  //----------------------------
  const handleDateChange = () => {
    setEditPress(false);
    setFinalePress(false);
    setChangeDate(true);
    setShowHistory(false);
    setMyBulletin(false);
    setFindPartner(false);
  };

  //----------------------------
  // UPDATE TRIP DATES
  //----------------------------
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
        return { ...item, day: newDay };
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

  //----------------------------
  // SHIFT EVENT DATES WHEN TRIP DATE CHANGES
  //----------------------------
  const shiftEventCalenderDates = (eventsArr, days) => {
    return eventsArr.map((event) => {
      const oldStart = new Date(event.start);
      const newStart = new Date(oldStart.getTime() + days * 86400000);
      const oldEnd = new Date(event.end);
      const newEnd = new Date(oldEnd.getTime() + days * 86400000);
      return {
        ...event,
        start: newStart.toISOString().slice(0, 16),
        end: newEnd.toISOString().slice(0, 16),
      };
    });
  };

  //----------------------------
  // UPDATE PLAN IN DATABASE AFTER DATE CHANGE
  //----------------------------
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
      await axios.post(url, data);
    } catch (err) {}
  };

  //----------------------------
  // SYNC DAY SELECTION AFTER PLAN CHANGE
  //----------------------------
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

  //----------------------------
  // SHOW HISTORY SECTION
  //----------------------------
  const openHistory = () => {
    setShowHistory(true);
    setChangeDate(false);
    setFinalePress(false);
    setEditPress(false);
    setMyBulletin(false);
    setFindPartner(false);
  };

  //----------------------------
  // SHOW BULLETIN BOARD SECTION
  //----------------------------
  const handelBulletin = () => {
    setMyBulletin(true);
    setChangeDate(false);
    setEditPress(false);
    setFinalePress(false);
    setShowHistory(false);
    setFindPartner(false);
  };

  //----------------------------
  // SHOW FIND PARTNER SECTION
  //----------------------------
  const handelFindPartner = () => {
    setFindPartner(true);
    setMyBulletin(false);
    setChangeDate(false);
    setEditPress(false);
    setFinalePress(false);
    setShowHistory(false);
  };

  //----------------------------
  // DEBUG: LOG DATA CHANGES
  //----------------------------
  useEffect(() => {
    console.log("dashboardData changed:", dashboardData);
  }, [dashboardData]);

  //----------------------------
  // MAIN COMPONENT RENDER
  //----------------------------
  return (
    <div>
      {/* User Display Name */}
      {displayName && (
        <div className="usernameBlock">
          <FaRegUserCircle size={36} className="iconUser" />
          <p className="usershowName">{displayName}</p>
        </div>
      )}

      {/* Shared Trip Indicator */}
      {dashboardData.length > 0 &&
        dashboardData[selectedPlanIndex]?.isShared === "Yes" && (
          <div className="sharedTripIndicator">
            <h3>SHARED</h3>
          </div>
        )}

      {/* Top Menu */}
      <div className="menueDash">
        <span className="menuePart" onClick={handelEdit}>
          Edit Plan
        </span>
        <span className="menuePart" onClick={handelfinale}>
          Final Plan
        </span>
        <span className="menuePart" onClick={openHistory}>
          History
        </span>
        <span className="menuePart" onClick={handelFindPartner}>
          Find Me Partner
        </span>
        <span className="menuePart" onClick={handelBulletin}>
          My Bulletin Board
        </span>

        {/* Plan Selector */}
        <div className="selectMenu">
          <label>Choose your Trip:</label>
          <select
            className="MyTrips"
            onChange={(e) => setSelectedPlanIndex(Number(e.target.value))}>
            {dashboardData.map((item, index) => (
              <option key={index} value={index}>
                {`${item.titlePlan} start Date: ${item.startDate}`}
              </option>
            ))}
          </select>

          <div className="MyTripsBtn">
            <span
              className="menuePart"
              onClick={() => handelDeletePlan(selectedPlanIndex)}>
              Delete Selected Plan
            </span>
            <span className="menuePart" onClick={handleDateChange}>
              Change Date
            </span>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTAINER */}
      <div className="containerDash">
        {/* Change Trip Dates */}
        {dashboardData.length > 0 && changeDate && (
          <div className="myInputs">
            Enter the new arrival date:
            <input
              type="date"
              value={newArrive}
              onChange={(e) => setNewArrive(e.target.value)}
            />
            {changed && <h2>The Date Changed Successfully</h2>}
            <span className="menuePart" onClick={dateChange}>
              Change
            </span>
          </div>
        )}

        {/* Final Plan View */}
        {dashboardData.length > 0 && finalePress && (
          <div className="finalPlanContainer">
            <div className="innerfinalPlanContainerMenue">
              <span className="menuePart" onClick={() => setShowMap(!showMap)}>
                {showMap ? `Calendar Details` : `Show Map & Details`}
              </span>
            </div>

            {/* Map & Details */}
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
                        onClick={() => setDayPlanShow(daydate.day)}>
                        {`Day ${idx + 1}`}
                      </button>
                    )
                  )}
                </div>

                {/* Transportation Info */}
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
                                {travelInfo.transitDetails.map((tran, inx) => (
                                  <div key={inx} className="transportDetails">
                                    <p>
                                      <strong>
                                        departureStop: {tran.departureStop}
                                      </strong>
                                    </p>
                                    <p>
                                      <strong>
                                        arrivalStop: {tran.arrivalStop}
                                      </strong>
                                    </p>
                                    <p>
                                      <strong>lineName: {tran.lineName}</strong>
                                    </p>
                                    <p>
                                      <strong>numStops: {tran.numStops}</strong>
                                    </p>
                                    <p>
                                      <strong>
                                        vehicleType: {tran.vehicleType}
                                      </strong>
                                    </p>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <p>No Transport info</p>
                            )}
                          </div>
                        );
                      })}
                </div>
              </div>
            ) : (
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

        {/* Edit Mode */}
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

        {/* History / Bulletin / Partner Sections */}
        {showHistory && <HistoryPlans uid={user.uid} />}
        {myBulletin && <DahsBulltin />}
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
