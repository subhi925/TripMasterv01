import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // Plugin for drag & drop support
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import "./PlanCalendar.css";
import PlacesLst from "./PlacesLst";
import axios from "axios";

const PlanCalendar = ({
  places = [],
  smartDailyPlans = [],
  dailyHours = [],
  editPress,
  finalePress,
  id,
  uid,
  fEvents = [],
  onEventsUpdated,
}) => {
  const [events, setEvents] = useState([]); // Holds all events in the calendar
  const [selectedEvent, setSelectedEvent] = useState(null); // Holds the selected event for modal display
  const [placesLst, setPlacesLst] = useState(places);
  const calendarRef = useRef(null);
  //--------------------------------------------------
  useEffect(() => {
    setPlacesLst(places);
  }, [places]);
  //---------------------------------------
  // Formats a date string to keep only the date part (YYYY-MM-DD)
  const formatDate = (str) => new Date(str).toISOString().split("T")[0];

  // Pads numbers to ensure two-digit format for hours and minutes
  const pad = (num) => num.toString().padStart(2, "0");
  //--------------------------------------------------------------------
  // place: OBJ Place
  // dropDate: Date (date & time of drop)
  const isPlaceOpen = (place, dropDate) => {
    if (place.type === "Camping Area") {
      return true;
    }
    //  אם אין שעות פעילות כלל
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

    const cleanedLine = dayLine.replace(/[\u202F\u2009]/g, " "); // הסרת תווים בלתי נראים
    const [_, hoursRaw] = cleanedLine.split(": ");
    if (!hoursRaw) return false;

    const lowerHours = hoursRaw.toLowerCase();
    if (lowerHours.includes("open 24 hours")) return true;
    if (lowerHours.includes("closed")) return false;

    // פונקציה להמרת "9:00 AM" ל- { hours, minutes }
    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const dropMinutes = dropDate.getHours() * 60 + dropDate.getMinutes();

    // תמיכה בטווחים מרובים ביום
    const ranges = hoursRaw.split(",").map((range) => range.trim());
    for (let range of ranges) {
      const [openTimeRaw, closeTimeRaw] = range.split("–").map((s) => s.trim());
      if (!openTimeRaw || !closeTimeRaw) continue; // דלג אם הטווח לא תקין

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

    return false; // לא נמצא טווח מתאים
  };

  //---------------------------------------------------------------------
  //-------------------sort and remov Duplicated---------------------------------------
  useEffect(() => {
    if (fEvents.length > 0) {
      const unique = fEvents.filter(
        (event, index, self) =>
          index === self.findIndex((e) => e.id === event.id)
      );
      const sorted = [...unique].sort(
        (a, b) => new Date(a.start) - new Date(b.start)
      );

      // if just there is change channge the Event
      const isSame = JSON.stringify(events) === JSON.stringify(sorted);
      if (!isSame) {
        setEvents(sorted);
      }
    }
  }, [fEvents]);
  //--------------------------------------------------------------------

  // Builds event objects from smartDailyPlans and dailyHours
  const buildEvents = () => {
    const result = [];

    for (let dayIndex = 0; dayIndex < smartDailyPlans.length; dayIndex++) {
      const dayPlans = smartDailyPlans[dayIndex];
      const dateStr = formatDate(dailyHours[dayIndex]?.day); // Format: YYYY-MM-DD

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
              : plan.name, // Event title
          type: plan.type, // Type of activity
          start, // Event start time
          end, // Event end time
          description: plan.description, // Optional description
          photo: plan.image, // Optional image URL
          loc: plan.loc,
          // isFixed: plan.name === "Return Home", //  Mark as fixed event if it's "Return Home"
          originalData: plan, // Store original plan data
        });
      }
    }

    setEvents(result); // Update events state
  };

  useEffect(() => {
    if (smartDailyPlans.length && dailyHours.length && fEvents.length === 0) {
      buildEvents();
    }
  }, [smartDailyPlans, dailyHours]);
  //--------------------------------------------------
  const sendEventCalenderToDb = async () => {
    const data = new FormData();
    data.append("uid", uid);
    data.append("eventCalender", JSON.stringify(events));
    data.append("id", id);
    const url =
      "http://localhost:8080/www/tripmasterv01/public/UploadToDashboardEventCalender.php";
    try {
      const res = await axios.post(url, data);
      console.log("Server response:", res.data);
    } catch (err) {
      console.error("Failed", err);
    }
  };
  //
  useEffect(() => {
    if (events.length > 0) {
      const original = JSON.stringify(events);
      const dbEvents = JSON.stringify(fEvents);
      if (original !== dbEvents) {
        const callsendEventDB = async () => {
          await sendEventCalenderToDb();
        };
        callsendEventDB();
      }
    }
  }, [events]);
  //-----------if threr no change on event no need to call/just on change call------------------
  useEffect(() => {
    if (editPress && onEventsUpdated) {
      const original = JSON.stringify(events);
      const incoming = JSON.stringify(fEvents);
      if (original !== incoming) {
        onEventsUpdated(events);
      }
    }
  }, [events]);
  //-----------------------------------------
  // this effect checks if there are any events in the calendar
  // If there are events and the fEvents array is empty, it calls onEventsUpdated with the current events
  // This ensures that the parent component is notified of any changes to the events and updates accordingly
  // This is useful for synchronizing the calendar with the parent component's state
  useEffect(() => {
    if (events.length > 0 && fEvents.length === 0) {
      onEventsUpdated(events);
    }
  }, [events]);

  //----------------------------------------------

  // Delete event only if it's not fixed
  // Fixed events are those that should not be deleted, like "events"
  const deleteEvent = (eventToDelete) => {
    if (eventToDelete?.isFixed) return; // Block deletion for fixed events
    setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
    setSelectedEvent(null);
  };

  //-----------------------------------------

  const handleEventTimeChange = (info) => {
    const { event } = info;
    // not allow to change time if the event is fixed
    if (event.extendedProps?.isFixed) {
      info.revert(); // revert if dragged/changed
      return;
    }

    // Update the events array in state
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

    // update on the DB
    sendEventCalenderToDb();
  };
  //------use Effect when changre plan to go to it in the calender----
  useEffect(() => {
    if (dailyHours[0]?.day && calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(dailyHours[0].day);
    }
  }, [dailyHours]);

  //------------------------------------
  return (
    <div>
      {editPress && (
        <div className="page-container">
          <div className="calendar-container">
            {" "}
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, interactionPlugin]} // Enable calendar with interaction
              initialView="timeGrid"
              duration={{ days: dailyHours.length }}
              initialDate={dailyHours[0]?.day ?? new Date()} // Start from first travel day
              editable={true} // Enable dragging/resizing
              droppable={true} // Enable external drops
              events={events} // Set calendar events
              // שעות התוכנית — אם dailyHours מוגדר משתמשים בו, אחרת ברירת מחדל
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              allDaySlot={false} // Remove all-day slot
              height="auto" // Auto height
              // Limit the visible date range to the travel period
              visibleRange={{
                start: dailyHours[0]?.day,
                end: new Date(
                  new Date(dailyHours.at(-1)?.day).getTime() +
                    24 * 60 * 60 * 1000
                ),
              }}
              // dragging if event is fixed, or if time slot is invalid, or if overlapping
              eventAllow={(dropInfo, draggedEvent) => {
                const dropStart = dropInfo.start;
                const dropEnd = dropInfo.end;

                // Disallow dragging fixed events
                if (draggedEvent.extendedProps?.isFixed) return false;

                // Check if date is within trip
                const dropDayStr = dropStart.toISOString().split("T")[0];
                const allowedDay = dailyHours.find((d) => d.day === dropDayStr);
                if (!allowedDay) return false;

                // Prevent overlapping with other events
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
              // Prevent moving fixed events
              eventReceive={(info) => {
                const eventDataStr = info.draggedEl.getAttribute("data-event");
                if (!eventDataStr) {
                  info.event.remove();
                  return;
                }
                const eventData = JSON.parse(eventDataStr);
                if (!eventData.originalData) {
                  info.event.remove();
                  return;
                }

                const dropDate = info.event.start;
                // check if dropped place is open in this time
                if (!isPlaceOpen(eventData.originalData, dropDate)) {
                  alert(
                    "This place is closed at this time. Please choose a different time."
                  );
                  info.event.remove();
                  return;
                }

                const isDuplicate = events.some((e) => e.id === eventData.id);
                if (isDuplicate) {
                  info.event.remove();
                  return;
                }

                const startDate = info.event.start;
                const endDate = new Date(
                  startDate.getTime() + 2 * 60 * 60 * 1000
                ); // ساعتين بعد البداية

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
              // When clicking an event, open its modal with details
              eventClick={(info) => {
                setSelectedEvent({
                  id: info.event.id,
                  isFixed: info.event.extendedProps?.isFixed,
                  ...info.event.extendedProps.originalData,
                });
              }}
              eventDrop={(info) => handleEventTimeChange(info)}
              eventResize={(info) => handleEventTimeChange(info)}
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
      )}

      {/* The Finale Plan No Edit */}
      {finalePress && (
        <FullCalendar
          ref={calendarRef}
          headerToolbar={false}
          plugins={[timeGridPlugin, interactionPlugin]} // Enable calendar with interaction
          // שינוי כאן: תצוגה מותאמת לכל ימי הטיול בלבד
          initialView="timeGrid"
          duration={{ days: dailyHours.length }}
          initialDate={dailyHours[0]?.day ?? new Date()} // Start from first travel day
          editable={false} // No dragging/resizing
          droppable={false} // No external drops
          events={events} // Set calendar events
          // שעות התוכנית — אם dailyHours מוגדר משתמשים בו, אחרת ברירת מחדל
          slotMinTime={
            dailyHours[0]?.start ? `${dailyHours[0].start}:00` : "07:00:00"
          }
          slotMaxTime={
            dailyHours[0]?.end ? `${dailyHours[0].end}:00` : "24:00:00"
          }
          allDaySlot={false} // Remove all-day slot
          height="auto" // Auto height
          // Limit the visible date range to the travel period
          visibleRange={{
            start: dailyHours[0]?.day,
            end: new Date(
              new Date(dailyHours.at(-1)?.day).getTime() + 24 * 60 * 60 * 1000
            ),
          }}
          // When clicking an event, open its modal with details
          eventClick={(info) => {
            setSelectedEvent({
              id: info.event.id,
              isFixed: info.event.extendedProps?.isFixed,
              ...info.event.extendedProps.originalData,
            });
          }}
        />
      )}
      {/* Modal that shows when user clicks on an event */}
      <Modal
        show={selectedEvent !== null}
        onHide={() => setSelectedEvent(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                    rel="noopener noreferrer"
                  >
                    {selectedEvent.website}
                  </a>
                ) : (
                  "No Website"
                )}
              </p>
              <p>
                <strong>Price Level:</strong>{" "}
                {selectedEvent?.priceLevel !== null &&
                selectedEvent?.priceLevel !== undefined
                  ? selectedEvent.priceLevel
                  : "No INFO"}
              </p>
              <p>
                <strong>Rating by Google:</strong>{" "}
                {selectedEvent?.rating !== null &&
                selectedEvent?.rating !== undefined
                  ? selectedEvent.rating
                  : "No Rating"}
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
                      }}
                    >
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
                        rel="noopener noreferrer"
                      >
                        {" "}
                        View on Google{" "}
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
