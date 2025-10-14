import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // Drag & drop support
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./PlanCalendar.css";
import PlacesLst from "./PlacesLst";
import axios from "axios";

const PlanCalendar = ({
  places = [], // Array of available places for drag-drop
  smartDailyPlans = [], // Array of daily plans for smart scheduling
  dailyHours = [], // Array of { day, start, end } for each travel day
  editPress, // Boolean: enables editable mode
  finalePress, // Boolean: read-only calendar mode
  id, // Trip or dashboard ID
  uid, // User ID
  fEvents = [], // Array of existing events from DB
  onEventsUpdated, // Callback when events are updated
  isShared, // Boolean: trip shared status
  id_Shared_Trip, // ID of shared trip if applicable
  startloc, // Starting location object { lat, lng }
}) => {
  //------------------------------------------
  // State Variables
  //------------------------------------------
  const [events, setEvents] = useState([]); // Array of calendar events
  const [selectedEvent, setSelectedEvent] = useState(null); // Currently selected event for modal
  const [placesLst, setPlacesLst] = useState(places); // State copy of available places
  const calendarRef = useRef(null); // Reference to FullCalendar instance
  const [calcTrans, setCalcTrans] = useState(false); // Boolean: calculating transportation

  //------------------------------------------
  // Sync places prop to state
  //------------------------------------------
  useEffect(() => {
    setPlacesLst(places);
  }, [places]);

  //------------------------------------------
  // Helper: Format date to YYYY-MM-DD
  //------------------------------------------
  const formatDate = (str) => new Date(str).toISOString().split("T")[0];

  //------------------------------------------
  // Helper: Pad number for time formatting
  //------------------------------------------
  const pad = (num) => num.toString().padStart(2, "0");

  //------------------------------------------
  // Check if a place is open at given datetime
  // place: place object, dropDate: Date object
  //------------------------------------------
  const isPlaceOpen = (place, dropDate) => {
    if (place.type === "Camping Area") return true; // Always open

    if (!place.workHours || place.workHours.length === 0) return false;

    const weekMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayLabel = weekMap[dropDate.getDay()];

    const dayLine = place.workHours.find((line) => line.includes(dayLabel));
    if (!dayLine) return false;

    const cleanedLine = dayLine.replace(/[\u202F\u2009]/g, " "); // Remove invisible chars
    const [_, hoursRaw] = cleanedLine.split(": ");
    if (!hoursRaw) return false;

    const lowerHours = hoursRaw.toLowerCase();
    if (lowerHours.includes("open 24 hours")) return true;
    if (lowerHours.includes("closed")) return false;

    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const dropMinutes = dropDate.getHours() * 60 + dropDate.getMinutes();
    const ranges = hoursRaw.split(",").map((range) => range.trim());

    for (let range of ranges) {
      const [openTimeRaw, closeTimeRaw] = range.split("–").map((s) => s.trim());
      if (!openTimeRaw || !closeTimeRaw) continue;

      const open = parseTime(openTimeRaw);
      const close = parseTime(closeTimeRaw);

      const openMinutes = open.hours * 60 + open.minutes;
      let closeMinutes = close.hours * 60 + close.minutes;
      const closesNextDay = closeMinutes <= openMinutes;
      if (closesNextDay) closeMinutes += 24 * 60;

      const adjustedDropMinutes =
        closesNextDay && dropMinutes < openMinutes
          ? dropMinutes + 24 * 60
          : dropMinutes;

      if (
        adjustedDropMinutes >= openMinutes &&
        adjustedDropMinutes <= closeMinutes
      ) {
        return true;
      }
    }
    return false;
  };

  //------------------------------------------
  // Remove duplicates and sort fEvents
  //------------------------------------------
  useEffect(() => {
    if (fEvents.length > 0) {
      const unique = fEvents.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id)
      );
      const sorted = [...unique].sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );

      const isSame = JSON.stringify(events) === JSON.stringify(sorted);
      if (!isSame) setEvents(sorted);
    }
  }, [fEvents]);

  //------------------------------------------
  // Build events from smartDailyPlans & dailyHours
  //------------------------------------------
  const buildEvents = () => {
    const result = [];

    for (let dayIndex = 0; dayIndex < smartDailyPlans.length; dayIndex++) {
      const dayPlans = smartDailyPlans[dayIndex]; // Array of plans for this day
      const dateStr = formatDate(dailyHours[dayIndex]?.day); // YYYY-MM-DD

      for (let plan of dayPlans) {
        const [startHour, startMin] = plan.arrivalTime.split(":").map(Number);
        const [endHour, endMin] = plan.endTime.split(":").map(Number);
        const start = `${dateStr}T${pad(startHour)}:${pad(startMin)}`;
        const end = `${dateStr}T${pad(endHour)}:${pad(endMin)}`;

        result.push({
          id: plan.id,
          title:
            plan.name.length > 15
              ? plan.name.substring(0, 15) + "…"
              : plan.name,
          type: plan.type,
          start,
          end,
          description: plan.description,
          photo: plan.image,
          loc: plan.loc,
          originalData: plan, // keep original plan
        });
      }
    }
    setEvents(result);
  };

  //------------------------------------------
  // Build events on first load if fEvents empty
  //------------------------------------------
  useEffect(() => {
    if (smartDailyPlans.length && dailyHours.length && fEvents.length === 0) {
      buildEvents();
    }
  }, [smartDailyPlans, dailyHours]);

  //------------------------------------------
  // Send events to DB
  //------------------------------------------
  const sendEventCalenderToDb = async () => {
    const data = new FormData();
    data.append("uid", uid);
    data.append("eventCalender", JSON.stringify(events));
    data.append("id", id);
    data.append("isShared", isShared);
    data.append("id_Shared_Trip", id_Shared_Trip);

    const url =
      "http://localhost:8080/www/tripmasterv01/public/UploadToDashboardEventCalender.php";

    try {
      const res = await axios.post(url, data);
      console.log("Server response:", res.data);
    } catch (err) {
      console.error("Failed", err);
    }
  };

  //------------------------------------------
  // Sync events with DB on change
  //------------------------------------------
  useEffect(() => {
    if (events.length > 0) {
      const original = JSON.stringify(events);
      const dbEvents = JSON.stringify(fEvents);
      if (original !== dbEvents) sendEventCalenderToDb();
    }
  }, [events]);

  //------------------------------------------
  // Notify parent component on edit
  //------------------------------------------
  useEffect(() => {
    if (editPress && onEventsUpdated) {
      const original = JSON.stringify(events);
      const incoming = JSON.stringify(fEvents);
      if (original !== incoming) onEventsUpdated(events);
    }
  }, [events]);

  //------------------------------------------
  // Initial notify parent if fEvents is empty
  //------------------------------------------
  useEffect(() => {
    if (events.length > 0 && fEvents.length === 0) {
      onEventsUpdated(events);
    }
  }, [events]);

  //------------------------------------------
  // Delete event
  //------------------------------------------
  const deleteEvent = (eventToDelete) => {
    if (eventToDelete?.isFixed) return; // Do not delete fixed events
    setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
    setSelectedEvent(null);
  };

  //------------------------------------------
  // Handle event time change (drag/drop or resize)
  //------------------------------------------
  const handleEventTimeChange = (info) => {
    const { event } = info;
    if (event.extendedProps?.isFixed) {
      info.revert(); // Revert if event is fixed
      return;
    }

    setEvents((prevEvents) =>
      prevEvents.map((e) =>
        e.id === event.id
          ? {
              ...e,
              start: event.start.toISOString(),
              end: event.end ? event.end.toISOString() : null,
            }
          : e
      )
    );
    sendEventCalenderToDb();
  };

  //------------------------------------------
  // Navigate calendar to first travel day
  //------------------------------------------
  useEffect(() => {
    if (dailyHours[0]?.day && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(dailyHours[0].day);
    }
  }, [dailyHours]);

  //------------------------------------------
  // Get travel info between two locations
  //------------------------------------------
  const getTravelInfo = async (
    origin,
    destination,
    mode = "transit",
    transitMode = "bus"
  ) => {
    const apiKey = process.env.REACT_APP_KEY_GOOGLE;
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode}&transit_mode=${transitMode}&key=${apiKey}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const leg = data.routes[0].legs[0];
        return {
          duration: leg.duration.text,
          durationValue: leg.duration.value, // in seconds
          distance: leg.distance.text,
          mode: mode,
          transitDetails: leg.steps
            .filter((step) => step.travel_mode === "TRANSIT")
            .map((step) => ({
              lineName:
                step.transit_details?.line?.short_name ||
                step.transit_details?.line?.name,
              vehicleType: step.transit_details?.line?.vehicle?.type,
              departureStop: step.transit_details?.departure_stop?.name,
              arrivalStop: step.transit_details?.arrival_stop?.name,
              numStops: step.transit_details?.num_stops,
            })),
        };
      }
    } catch (err) {
      console.error("Directions API error:", err);
    }
    return null;
  };

  //------------------------------------------
  // Add travel times to events based on locations
  //------------------------------------------
  const fetchtransportation = async () => {
    setCalcTrans(true);
    const newEvents = [...events];

    for (let dayIndex = 0; dayIndex < dailyHours.length; dayIndex++) {
      let dateStr = dailyHours[dayIndex]?.day; // Travel day
      let currentLocation = startloc;

      for (let i = 0; i < newEvents.length; i++) {
        const eventDate = newEvents[i].start.split("T")[0];
        if (eventDate === dateStr) {
          const travelInfo = await getTravelInfo(
            currentLocation,
            newEvents[i].loc
          );

          if (travelInfo) {
            const startDateTime = new Date(newEvents[i].start);
            const endDateTime = new Date(newEvents[i].end);
            const diffMS = endDateTime - startDateTime;

            const startMinutes =
              startDateTime.getHours() * 60 + startDateTime.getMinutes();
            const travelMinutes = Math.ceil(travelInfo.durationValue / 60);
            let newStartMinutes = startMinutes + travelMinutes;

            if (newStartMinutes >= 24 * 60) newStartMinutes = 24 * 60 - 1;

            const newStart = new Date(startDateTime);
            newStart.setHours(Math.floor(newStartMinutes / 60));
            newStart.setMinutes(newStartMinutes % 60);

            const newEnd = new Date(newStart.getTime() + diffMS);

            newEvents[i].start = newStart.toISOString();
            newEvents[i].end = newEnd.toISOString();

            newEvents[i].originalData = {
              ...newEvents[i].originalData,
              travelInfo,
            };

            currentLocation = newEvents[i].loc;
          }
        }
      }
    }

    setEvents(newEvents);
    setCalcTrans(false);
  };

  //------------------------------------------
  // Render JSX
  //------------------------------------------
  return (
    <div>
      {/* Editable Calendar */}
      {editPress && !calcTrans ? (
        <div>
          <span
            className="menuePart"
            onClick={async () => await fetchtransportation()}>
            Save and Add Transportation
          </span>
          <div className="page-container">
            <div className="calendar-container">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGrid"
                duration={{ days: dailyHours.length }}
                initialDate={dailyHours[0]?.day ?? new Date()}
                editable={true}
                droppable={true}
                events={events}
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                allDaySlot={false}
                height="auto"
                visibleRange={{
                  start: dailyHours[0]?.day,
                  end: new Date(
                    new Date(dailyHours.at(-1)?.day).getTime() +
                      24 * 60 * 60 * 1000
                  ),
                }}
                // Validate drag-drop
                eventAllow={(dropInfo, draggedEvent) => {
                  const dropStart = dropInfo.start;
                  const dropEnd = dropInfo.end;
                  if (draggedEvent.extendedProps?.isFixed) return false;

                  const dropDayStr = dropStart.toISOString().split("T")[0];
                  const allowedDay = dailyHours.find(
                    (d) => d.day === dropDayStr
                  );
                  if (!allowedDay) return false;

                  const newStart = dropStart.getTime();
                  const newEnd =
                    dropEnd?.getTime() ?? newStart + 2 * 60 * 60 * 1000;
                  const isConflict = events.some((e) => {
                    if (e.id === draggedEvent.id) return false;
                    const eStart = new Date(e.start).getTime();
                    const eEnd = new Date(e.end).getTime();
                    return newStart < eEnd && newEnd > eStart;
                  });
                  return !isConflict;
                }}
                // Handle event receive (dragged from side)
                eventReceive={(info) => {
                  const eventDataStr =
                    info.draggedEl.getAttribute("data-event");
                  if (!eventDataStr) return info.event.remove();

                  const eventData = JSON.parse(eventDataStr);
                  if (!eventData.originalData) return info.event.remove();

                  const dropDate = info.event.start;
                  if (!isPlaceOpen(eventData.originalData, dropDate)) {
                    alert("This place is closed at this time.");
                    return info.event.remove();
                  }

                  if (events.some((e) => e.id === eventData.id))
                    return info.event.remove();

                  const startDate = info.event.start;
                  const endDate = new Date(
                    startDate.getTime() + 2 * 60 * 60 * 1000
                  );

                  info.event.setStart(startDate);
                  info.event.setEnd(endDate);

                  info.event.setProp(
                    "title",
                    eventData.title.length > 15
                      ? eventData.title.substring(0, 15) + "…"
                      : eventData.title
                  );
                  info.event.setExtendedProp("type", eventData.type);
                  info.event.setExtendedProp(
                    "description",
                    eventData.description
                  );
                  info.event.setExtendedProp("photo", eventData.photo);
                  info.event.setExtendedProp("loc", eventData.loc);
                  info.event.setExtendedProp(
                    "originalData",
                    eventData.originalData
                  );
                  info.event.setExtendedProp(
                    "isFixed",
                    eventData.title === "Return Home"
                  );

                  setEvents((prev) => [
                    ...prev,
                    {
                      id: eventData.id,
                      title: eventData.title,
                      type: eventData.type,
                      start: startDate.toISOString(),
                      end: endDate.toISOString(),
                      description: eventData.description,
                      photo: eventData.photo,
                      loc: eventData.loc,
                      originalData: eventData.originalData,
                      isFixed: eventData.title === "Return Home",
                    },
                  ]);

                  setPlacesLst((prevPlaces) =>
                    prevPlaces.filter((p) => p.id !== eventData.id)
                  );
                }}
                eventClick={(info) => {
                  setSelectedEvent({
                    id: info.event.id,
                    isFixed: info.event.extendedProps?.isFixed,
                    ...info.event.extendedProps.originalData,
                  });
                }}
                eventDrop={handleEventTimeChange}
                eventResize={handleEventTimeChange}
              />
            </div>

            <div className="sidesidebar">
              <PlacesLst
                places={placesLst.filter(
                  (place) => !events.some((event) => event.id === place.id)
                )}
              />
            </div>
          </div>
        </div>
      ) : (
        calcTrans &&
        editPress && (
          <div>
            <div className="loader"></div>
            <h1 className="loadingContant"></h1>
          </div>
        )
      )}

      {/* Finale (Read-only) Calendar */}
      {finalePress && (
        <FullCalendar
          ref={calendarRef}
          headerToolbar={false}
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGrid"
          duration={{ days: dailyHours.length }}
          initialDate={dailyHours[0]?.day ?? new Date()}
          editable={false}
          droppable={false}
          events={events}
          slotMinTime={"05:00:00"}
          slotMaxTime={"24:00:00"}
          allDaySlot={false}
          height="auto"
          visibleRange={{
            start: dailyHours[0]?.day,
            end: new Date(
              new Date(dailyHours.at(-1)?.day).getTime() + 24 * 60 * 60 * 1000
            ),
          }}
          eventClick={(info) => {
            setSelectedEvent({
              id: info.event.id,
              isFixed: info.event.extendedProps?.isFixed,
              ...info.event.extendedProps.originalData,
            });
          }}
        />
      )}

      {/* Event Modal */}
      <Modal
        show={selectedEvent !== null}
        onHide={() => setSelectedEvent(null)}
        centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Display event details */}
          {selectedEvent?.type === "Event" ? (
            <>
              <p>
                <strong>Type:</strong> {selectedEvent?.type ?? "No INFO"}
              </p>
              <p>
                <strong>Address:</strong> {selectedEvent?.address ?? "No INFO"}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedEvent?.description ?? "No description"}
              </p>
              {selectedEvent?.image && (
                <img
                  src={selectedEvent.image}
                  alt={selectedEvent.name}
                  style={{ maxWidth: "100%" }}
                />
              )}
              <p>
                <strong>City:</strong> {selectedEvent?.city ?? "No INFO"}
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Type:</strong> {selectedEvent?.type ?? "No INFO"}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {selectedEvent?.addressPlace ?? "No INFO"}
              </p>
              <p>
                <strong>Description:</strong>{" "}
                {selectedEvent?.description ?? "No description"}
              </p>
              <p>
                <strong>Phone Number:</strong>{" "}
                {selectedEvent?.phoneNumber ?? "No Phone"}
              </p>
              <p>
                <strong>Website:</strong>{" "}
                {selectedEvent?.website ? (
                  <a
                    href={selectedEvent.website}
                    target="_blank"
                    rel="noopener noreferrer">
                    {selectedEvent.website}
                  </a>
                ) : (
                  "No Website"
                )}
              </p>
              <p>
                <strong>Price Level:</strong>{" "}
                {selectedEvent?.priceLevel ?? "No INFO"}
              </p>
              <p>
                <strong>Rating by Google:</strong>{" "}
                {selectedEvent?.rating ?? "No Rating"}
              </p>
              {selectedEvent?.photo && (
                <img
                  src={selectedEvent.photo}
                  alt={selectedEvent.name}
                  style={{ maxWidth: "100%" }}
                />
              )}
              {selectedEvent?.reviews?.length > 0 && (
                <>
                  <h5>Reviews:</h5>
                  {selectedEvent.reviews.map((review, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: "10px",
                        borderBottom: "1px solid #ccc",
                        paddingBottom: "5px",
                      }}>
                      <p>
                        <strong>{review.author_name}</strong> - Rating:{" "}
                        {review.rating ?? "No rating"}
                      </p>
                      <p>{review.text ?? "No review text"}</p>
                      {review.profile_photo_url && (
                        <img
                          src={review.profile_photo_url}
                          alt={review.author_name}
                          style={{ width: "40px", borderRadius: "50%" }}
                        />
                      )}
                      <a
                        href={review.author_url}
                        target="_blank"
                        rel="noopener noreferrer">
                        View on Google
                      </a>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
            Close
          </Button>
          {!selectedEvent?.isFixed && editPress && (
            <Button variant="danger" onClick={() => deleteEvent(selectedEvent)}>
              Delete
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PlanCalendar;
