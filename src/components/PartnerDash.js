import { useEffect, useState } from "react";
import axios from "axios";
import "./PartnerDash.css"; // Component styling
import DashPartnerLst from "./DashPartnerLst"; // Component for list of partners
import SendMSg from "./SendMSg"; // Component for messages

//----------------------------
// COMPONENT: PartnerDash
//----------------------------
const PartnerDash = ({ dashboardData, uid, email, loadParmetersPlan }) => {
  //----------------------------
  // STATE VARIABLES
  //----------------------------
  const [askForPartner, setAskForPartner] = useState(false); // Show ask form
  const [checkIftherePartnerInDb, setCheckIftherePartnerInDb] = useState(false); // Show partner list
  const [msgAgree, setMsgAgree] = useState(); // Show message box
  const [planId, setPlanId] = useState(""); // Selected plan ID
  const [preference, setPreference] = useState([]); // User preferences based on plan places
  const [startDate, setStartDate] = useState(""); // Plan start date
  const [endDate, setEndDate] = useState(""); // Plan end date
  const [planName, setPlanName] = useState(""); // Plan title
  const [msgBox, setMsgBox] = useState(""); // User message
  const [numberOfPartners, setNumberOfPartners] = useState(2); // Desired number of partners
  const [resault, setResault] = useState(""); // Response message from server
  const [eventCalender, setEventCalender] = useState([]); // Events in the plan

  //-----------------------------------------------
  console.log("dashboardData in PartnerDash:", dashboardData); // Debug log

  //----------------------------
  // FUNCTION: sendAskForPartners
  // Sends request to server to ask for partners
  //----------------------------
  const sendAskForPartners = async () => {
    if (!uid) return; // Check user ID
    const data = new FormData();
    data.append("uid", uid);
    data.append("dashboard_id", planId);
    data.append("titlePlan", planName);
    data.append("startdate", startDate);
    data.append("enddate", endDate);
    data.append("msgBox", msgBox);
    data.append("preference", JSON.stringify(preference));
    data.append("eventCalender", JSON.stringify(eventCalender));
    data.append("numberOfPartners", numberOfPartners);
    data.append("current_Num_Part", 1); // Current user is first
    data.append("joinedUsers", email);

    const url =
      "http://localhost:8080/www/tripmasterv01/public/sendToAsklist.php";

    try {
      const res = await axios.post(url, data);
      setResault(res.data); // Show server response
      setTimeout(() => setResault(""), 5000); // Clear message after 5s
      if (res.data === "Success to put your Ask") {
        await loadParmetersPlan(uid); // Reload dashboard data
      }
    } catch (err) {
      console.error("Failed", err);
    }
  };

  //----------------------------
  // HANDLER FUNCTIONS
  //----------------------------
  const handelAskForPartner = () => {
    setAskForPartner(true);
    setCheckIftherePartnerInDb(false);
    setMsgAgree(false);
  };

  const handelCheckIftherePartnerInDb = () => {
    setCheckIftherePartnerInDb(true);
    setAskForPartner(false);
    setMsgAgree(false);
  };

  const handelMsgAgree = () => {
    setMsgAgree(true);
    setAskForPartner(false);
    setCheckIftherePartnerInDb(false);
  };

  //----------------------------
  // EFFECT: Set initial planId when dashboardData changes
  //----------------------------
  useEffect(() => {
    if (dashboardData.length > 0) {
      setPlanId(dashboardData[0].id);
      console.log(dashboardData[0].id);
    }
  }, [dashboardData]);

  //----------------------------
  // EFFECT: Update plan details when planId changes
  //----------------------------
  useEffect(() => {
    if (dashboardData.length > 0 && planId !== "") {
      const plan = dashboardData.find((item) => item.id === planId);
      if (plan) {
        setStartDate(plan.startDate); // Update start date
        setEndDate(plan.endDate); // Update end date
        setPlanName(plan.titlePlan); // Update plan name
        setEventCalender(plan?.eventCalender); // Update events
      }
    }
  }, [planId, dashboardData]);

  //----------------------------
  // EFFECT: Update preferences based on selected plan places
  //----------------------------
  useEffect(() => {
    if (
      dashboardData.length > 0 &&
      startDate !== "" &&
      endDate !== "" &&
      planId !== ""
    ) {
      const filtered = dashboardData.filter(
        (item) =>
          item.id === planId &&
          item.startDate === startDate &&
          item.endDate === endDate
      );
      let prefs = [];
      filtered.forEach((item) => {
        if (item?.places) {
          let types = item.places.map((place) => place.type);
          types.forEach((type) => {
            if (!prefs.includes(type)) {
              prefs.push(type);
            }
          });
        }
      });
      setPreference(prefs); // Set preferences array
    }
  }, [planId, startDate, endDate, dashboardData]);

  //----------------------------
  // JSX RETURN
  //----------------------------
  return (
    <div className="partnerContainer">
      {/* Buttons to switch between forms */}
      <div className="btnPartnerContainer">
        <button className="btnPartner" onClick={handelAskForPartner}>
          Ask For Partner's
        </button>
        <button className="btnPartner" onClick={handelCheckIftherePartnerInDb}>
          List Of Potential Partner's
        </button>
        <button className="btnPartner" onClick={handelMsgAgree}>
          Msg Box
        </button>
      </div>

      <div className="resultPartnerContainer">
        {/* Ask for Partner Form */}
        {askForPartner && (
          <div className="formContainer">
            <label>Which Plan You Looking For Partner:</label>
            <select
              className="MyTrips"
              onChange={(e) => setPlanId(e.target.value)}>
              {dashboardData.length > 0 &&
                dashboardData.map((item, index) => {
                  if (item.isShared === "No") {
                    return (
                      <option key={index} value={`${item.id}`}>
                        {`${item.titlePlan}`}
                      </option>
                    );
                  }
                })}
            </select>

            <div className="dateInputs">
              <span className="dateLabel">From:</span>
              <input
                className="startDateInput"
                type="text"
                value={dashboardData
                  .filter((item) => item.id === planId)
                  .map((item) => item.startDate)}
                readOnly
              />
              <span className="dateLabel">To:</span>
              <input
                className="endDateInput"
                type="text"
                value={dashboardData
                  .filter((item) => item.id === planId)
                  .map((item) => item.endDate)}
                readOnly
              />
            </div>

            <div className="msgContainer">
              <textarea
                className="msgInput"
                placeholder="Type your message here..."
                value={msgBox}
                onChange={(e) => setMsgBox(e.target.value)}
              />
            </div>

            <input
              type="text"
              className="perfInput"
              value={preference}
              readOnly
            />

            <input
              className="numberOfPartners"
              type="number"
              min={2}
              max={10}
              placeholder="Number of Partners"
              value={numberOfPartners}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < 2) val = 2;
                if (val > 10) val = 10;
                setNumberOfPartners(val);
              }}
            />

            {resault && <h2>{resault}</h2>}

            <button
              className="btnPartner"
              onClick={async () => await sendAskForPartners()}>
              Send
            </button>
          </div>
        )}

        {/* Show list of partners */}
        {checkIftherePartnerInDb && (
          <DashPartnerLst uid={uid} loadParmetersPlan={loadParmetersPlan} />
        )}

        {/* Show message box */}
        {msgAgree && (
          <div>
            <SendMSg myEmail={email} dashboardData={dashboardData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDash;
