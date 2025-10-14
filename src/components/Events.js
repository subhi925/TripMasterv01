import React, { useEffect, useState } from "react";
import Myplan from "./Myplan";
import "./Events.css";

const Events = ({
  eventsLst, // Array of available events
  places, // Array of planned places
  spendDays, // Number of days planned for the trip
  dailyHours, // Daily schedule for the trip
  arrive, // Arrival date
  startloc, // Starting location coordinates {lat, lng}
  setPlaces, // Function to update places state in parent
  titlePlan, // Title of the plan
  shuffleArray, // Function to shuffle an array
  calculateDistance, // Function to calculate distance between points
}) => {
  //----------------------------
  // STATE VARIABLES
  //----------------------------
  const [selectedEvents, setSelectedEvents] = useState([]); // Selected events by user
  const [didSelect, setDidSelect] = useState(false); // Flag for moving to next step

  //----------------------------
  // TOGGLE EVENT SELECTION
  // Adds/removes event from selectedEvents array
  //----------------------------
  const toggleEvent = (event) => {
    if (!selectedEvents.some((evt) => evt.id === event.id)) {
      // Add event if not selected
      setSelectedEvents([...selectedEvents, event]);
    } else {
      // Remove event if already selected
      const tmp = selectedEvents.filter((item) => item.id !== event.id);
      setSelectedEvents(tmp);
    }
  };

  //----------------------------
  // JSX / RENDER
  //----------------------------
  return (
    <>
      {!didSelect ? (
        // ----------------------------
        // EVENT SELECTION STEP
        // ----------------------------
        <div>
          <span className="titlespan">Choose your Event And Buy Ticket:</span>

          <div className="myContainer">
            {eventsLst.map((event, idx) => (
              // Each event card
              <div
                key={idx}
                className="box card"
                onClick={() => toggleEvent(event)}
                style={{
                  filter: selectedEvents.includes(event)
                    ? "contrast(50%)"
                    : "none",
                }}>
                {/* Event image */}
                <img src={event.image} alt={event.name} className="event-img" />
                {/* Event details */}
                <h6>Event: {event.name}</h6>
                <h6>Place Name: {event.placeName}</h6>
                <h6>{event.date}</h6>
                <h6>{event.startTimelocal}</h6>
                <p>
                  {event.city}, {event.country}
                </p>
                {/* Ticket link */}
                <a
                  className="lnkTicket"
                  href={event.ticket}
                  target="_blank"
                  rel="noopener noreferrer">
                  Buy Ticket
                </a>
              </div>
            ))}
          </div>

          {/* Next step button */}
          <button onClick={() => setDidSelect(true)}>Done Next Step</button>
        </div>
      ) : (
        // ----------------------------
        // MYPLAN COMPONENT STEP
        // ----------------------------
        <div>
          <Myplan
            places={places} // Planned places
            spendDays={spendDays} // Number of days
            eventsList={selectedEvents} // Selected events
            setPlaces={setPlaces} // Function to update places
            arrive={arrive} // Arrival date
            dailyHours={dailyHours} // Daily schedule
            startloc={startloc} // Start location
            titlePlan={titlePlan} // Plan title
            shuffleArray={shuffleArray} // Utility function
            calculateDistance={calculateDistance} // Utility function
          />
        </div>
      )}
    </>
  );
};

export default Events;
