import React, { useState } from "react";
import axios from "axios";

const SendMSG = ({ myEmail, dashboardData, user }) => {
  //----------------------------
  // State Variables
  //----------------------------
  const [selectedTrip, setSelectedTrip] = useState(""); // currently selected shared trip
  const [joinedUsers, setJoinedUsers] = useState([]); // users joined to the selected trip
  const [selectedUsers, setSelectedUsers] = useState([]); // users selected to send email
  const [subject, setSubject] = useState(""); // email subject
  const [message, setMessage] = useState(""); // email body

  //----------------------------
  // Filter shared trips from dashboardData
  //----------------------------
  const sharedTrips = dashboardData.filter((trip) => trip.isShared === "Yes"); // array of shared trips

  //----------------------------
  // Handle Trip Selection Change
  //----------------------------
  const handleTripChange = async (e) => {
    const tripId = e.target.value;
    setSelectedTrip(tripId);
    setSelectedUsers([]); // reset selected users
    setSubject(""); // reset subject
    setMessage(""); // reset message

    if (tripId) {
      try {
        const formData = new FormData();
        formData.append("id_Shared_Trip", tripId);
        if (user) {
          formData.append("uid", user.uid); // current user id
          formData.append("email", user.email); // current user email
        }

        // Fetch users joined in this trip
        const res = await axios.post(
          "http://localhost:8080/www/tripmasterv01/public/getJoinedUsers.php",
          formData
        );

        // Exclude current user from list
        const filteredUsers = (res.data.joinedUsers || []).filter(
          (email) => email !== myEmail
        );
        setJoinedUsers(filteredUsers);
      } catch (err) {
        console.error("Error fetching joined users:", err);
      }
    } else {
      setJoinedUsers([]); // no trip selected
    }
  };

  //----------------------------
  // Handle Checkbox Change
  //----------------------------
  const handleCheckboxChange = (email) => {
    setSelectedUsers(
      (prev) =>
        prev.includes(email)
          ? prev.filter((e) => e !== email) // remove if already selected
          : [...prev, email] // add if not selected
    );
  };

  //----------------------------
  // Send Email to Selected Users
  //----------------------------
  const handleSendEmail = async () => {
    if (!subject || !message || selectedUsers.length === 0) {
      alert("Please select users, write a subject and a message.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("receivers", selectedUsers.join(",")); // convert array to CSV

      const res = await axios.post(
        "http://localhost:8080/www/tripmasterv01/public/sendEmail.php",
        formData
      );

      alert(res.data.status || "Emails sent!");
      // Reset form
      setSelectedUsers([]);
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Failed to send emails.");
    }
  };

  //----------------------------
  // JSX Render
  //----------------------------
  return (
    <div>
      {/* Trip Selection */}
      <label htmlFor="tripSelect">Select a shared trip:</label>
      <select
        id="tripSelect"
        value={selectedTrip}
        onChange={handleTripChange}
        style={{ marginLeft: "10px", padding: "5px" }}>
        <option value="">-- Select a trip --</option>
        {sharedTrips.map((trip) => (
          <option key={trip.id} value={trip.id_Shared_Trip}>
            {trip.titlePlan} {/* trip title */}
          </option>
        ))}
      </select>

      {/* Show joined users only if available */}
      {joinedUsers.length > 0 && (
        <div style={{ marginTop: "10px" }}>
          <p>Select users to send email:</p>

          {/* Checkbox for each user */}
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

          {/* Subject Input */}
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              display: "block",
              marginTop: "10px",
              width: "100%",
              padding: "5px",
            }}
          />

          {/* Message Input */}
          <textarea
            placeholder="Write your message here..."
            className="msgInput"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{
              display: "block",
              marginTop: "10px",
              width: "100%",
              padding: "5px",
            }}
          />

          {/* Send Button */}
          <button onClick={handleSendEmail} className="btnPartner">
            SEND
          </button>
        </div>
      )}
    </div>
  );
};

export default SendMSG;
