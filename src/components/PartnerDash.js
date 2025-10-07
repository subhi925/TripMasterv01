import { useEffect, useState } from "react";
import axios from "axios";
import "./PartnerDash.css";
import DashPartnerLst from "./DashPartnerLst";
import SendMSg from "./SendMSg";

const PartnerDash = ({ dashboardData, uid,email }) => {
  const [askForPartner, setAskForPartner] = useState(false);
  const [checkIftherePartnerInDb, setCheckIftherePartnerInDb] = useState(false);
  const [msgAgree, setMsgAgree] = useState();
  const [planId, setPlanId] = useState("");
  const [preference, setPreference] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [planName, setPlanName] = useState("");
  const [msgBox, setMsgBox] = useState("");
  const [numberOfPartners, setNumberOfPartners] = useState(2);
  const [resault, setResault] = useState("");
  const [eventCalender,setEventCalender] = useState([]);
    //-----------------------------------------------
  //-send the Ask for Partner's
  const sendAskForPartners = async () => {
    if (!uid) return;
    const data = new FormData();
    data.append("uid", uid);
    data.append("dashboard_id", planId);
    data.append("titlePlan", planName);
    data.append("startdate", startDate);
    data.append("enddate", endDate);
    data.append("msgBox", msgBox);
    data.append("preference", JSON.stringify(preference));
    data.append("eventCalender",JSON.stringify(eventCalender))
    data.append("numberOfPartners", numberOfPartners);
    data.append("current_Num_Part", 1);
    data.append("joinedUsers",email);
    const url =
      "http://localhost:8080/www/tripmasterv01/public/sendToAsklist.php";
    try {
      const res = await axios.post(url, data);
      if (res.data === "Success to put your Ask") {
        setResault(res.data);
        setTimeout(() => setResault(""), 5000);
      } else {
        setResault(res.data);
        setTimeout(() => setResault(""), 5000);
      }
    } catch (err) {
      console.error("Failed", err);
    }
  };

  //-----------------------------------------------
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
  useEffect(() => {
    if (dashboardData.length > 0) {
      setPlanId(dashboardData[0].id);
    }
  }, [dashboardData]);
  //----------------------------------------------------------------------
  useEffect(() => {
    if (dashboardData.length > 0 && planId !== "") {
      const plan = dashboardData.find((item) => item.id === planId);
      if (plan) {
        setStartDate(plan.startDate);
        setEndDate(plan.endDate);
        setPlanName(plan.titlePlan);
        setEventCalender(plan?.eventCalender);
      }
    }
  }, [planId, dashboardData]);
  //---------------------------------------
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
      setPreference(prefs);
    }
  }, [planId, startDate, endDate, dashboardData]);

  //-----------Debuges------------------

  //---------------------------------------
  return (
    <div className="partnerContainer">
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
        {askForPartner && (
          <div className="formContainer">
            <label htmlFor="myPlansLabel">
              Which Plan You Looking For Partner:
            </label>
            <select
              className="MyTrips"
              onChange={(e) => setPlanId(e.target.value)}
            >
              {dashboardData.length > 0 &&
                dashboardData.map((item, index) => (
                  <option
                    key={index}
                    value={`${item.id}`}
                  >{`${item.titlePlan}`}</option>
                ))}
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
              onClick={async () => await sendAskForPartners()}
            >
              Send
            </button>
          </div>
        )}
        {checkIftherePartnerInDb && (
          <DashPartnerLst uid={uid} ></DashPartnerLst>
        )}
        {msgAgree && (
          <div>
            <SendMSg myEmail={email} dashboardData={dashboardData}/>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerDash;
