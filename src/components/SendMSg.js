import React, { useState } from "react";
import axios from "axios";

const SendMSG = ({ myEmail, dashboardData, user }) => {
  const [selectedTrip, setSelectedTrip] = useState("");
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const sharedTrips = dashboardData.filter((trip) => trip.isShared === "Yes");

  const handleTripChange = async (e) => {
    const tripId = e.target.value;
    setSelectedTrip(tripId);
    setSelectedUsers([]);
    setSubject("");
    setMessage("");

    if (tripId) {
      try {
        const formData = new FormData();
        formData.append("id_Shared_Trip", tripId);
        if (user) {
          formData.append("uid", user.uid);
          formData.append("email", user.email);
        }

        const res = await axios.post(
          "http://localhost:8080/www/tripmasterv01/public/getJoinedUsers.php",
          formData
        );

        const filteredUsers = (res.data.joinedUsers || []).filter(
          (email) => email !== myEmail
        );
        setJoinedUsers(filteredUsers);
      } catch (err) {
        console.error("Error fetching joined users:", err);
      }
    } else {
      setJoinedUsers([]);
    }
  };

  const handleCheckboxChange = (email) => {
    setSelectedUsers((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const handleSendEmail = async () => {
    if (!subject || !message || selectedUsers.length === 0) {
      alert("Please select users, write a subject and a message.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("receivers", selectedUsers.join(","));

      const res = await axios.post(
        "http://localhost:8080/www/tripmasterv01/public/sendEmail.php",
        formData
      );

      alert(res.data.status || "Emails sent!");
      setSelectedUsers([]);
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send emails.");
    }
  };

  return (
    <div>
      <label htmlFor="tripSelect">Select a shared trip:</label>
      <select
        id="tripSelect"
        value={selectedTrip}
        onChange={handleTripChange}
        style={{ marginLeft: "10px", padding: "5px" }}
      >
        <option value="">-- Select a trip --</option>
        {sharedTrips.map((trip) => (
          <option key={trip.id} value={trip.id_Shared_Trip}>
            {trip.titlePlan}
          </option>
        ))}
      </select>

      {joinedUsers.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <p>Select users to send email:</p>
          {joinedUsers.map((email) => (
            <div key={email}>
              <input
                type="checkbox"
                checked={selectedUsers.includes(email)}
                onChange={() => handleCheckboxChange(email)}
              />
              <span style={{ marginLeft: "5px" }}>{email}</span>
            </div>
          ))}

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{ display: "block", marginTop: "10px", width: "100%", padding: "5px" }}
          />

          <textarea
            placeholder="Write your message here..."
            className="msgInput"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{ display: "block", marginTop: "10px", width: "100%", padding: "5px" }}
          />

          <button
            onClick={handleSendEmail}
            className="btnPartner"
            
          >
            SEND
          </button>
        </div>
      )}
    </div>
  );
};

export default SendMSG;
