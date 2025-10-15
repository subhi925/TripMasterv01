import React, { useState, useEffect } from "react"; // React hooks
import "./Myplan.css";
import { useAuthState } from "react-firebase-hooks/auth"; // Firebase auth hook
import { Link } from "react-router"; // Link for navigation
import { auth } from "../fire"; // Firebase auth instance
import axios from "axios"; // HTTP requests

//----------------------------
// COMPONENT: Myplan
//----------------------------
const Myplan = ({
  places, // Array of places to visit
  spendDays, // Number of days for the trip
  dailyHours, // Array with start and end hours per day
  arrive, // Arrival date
  startloc, // Starting location
  eventsList, // Array of events
  shuffleArray, // Function to shuffle arrays
  titlePlan, // Plan title
}) => {
  //----------------------------
  // HOOKS
  //----------------------------
  const [user] = useAuthState(auth); // Logged-in user
  const [isActive, setIsActive] = useState(true); // Plan active status
  const [hasSend, setHasSend] = useState(false); // Prevent multiple sends
  const [smartDailyPlans, setSmartDailyPlans] = useState([]); // Array of daily plans
  const [sharedPlan, setSharedPlan] = useState("NO"); // Shared plan flag
  const [idSharedTrip, setIdSharedTrip] = useState(0); // Shared trip ID

  //----------------------------
  // DURATION TIMES
  //----------------------------
  const [durationTime] = useState({
    Zoo: 150,
    Aquarium: 90,
    "Amusement Park": 240,
    "Water Park": 210,
    "Children's Museum": 90,
    "Petting Zoo": 60,
    "Trampoline Park": 90,
    "Mini Golf": 90,
    Playground: 60,
    "Bowling Alley": 90,
    "Ice Skating Rink": 90,
    Winery: 90,
    "Hot Air Balloon Ride": 120,
    Spa: 180,
    "Romantic Tour": 150,
    "Boat Tour": 120,
    Cafe: 45,
    "Fine Dining": 150,
    "Escape Room": 60,
    "VR Gaming Center": 90,
    "Go-Kart Track": 60,
    "Rock Climbing Gym": 120,
    "Laser Tag": 90,
    Arcade: 90,
    "Skate Park": 90,
    "Scuba Diving Center": 180,
    "Skydiving Center": 180,
    Rafting: 180,
    "Snorkeling Tour": 120,
    "Bungee Jumping": 90,
    "ATV Tours": 150,
    "Adventure Sports": 150,
    Paragliding: 120,
    "Kite Surfing": 150,
    "Nature Reserve": 180,
    "Botanical Garden": 90,
    "Hiking Area": 240,
    "Camping Area": 720,
    Beach: 180,
    Lake: 150,
    Mountain: 240,
    Park: 120,
    Museum: 120,
    "Art Gallery": 90,
    "Cultural Center": 90,
    "Historical Site": 90,
    "Religious Site": 60,
    Restaurant: 90,
    "Kosher Restaurant": 90,
    "Halal Restaurant": 90,
    "Vegetarian Restaurant": 90,
    "Vegan Restaurant": 90,
    "Shopping Mall": 180,
    "Street Food": 45,
    "Local Market": 90,
  });

  //----------------------------
  // FUNCTION: GET DURATION
  //----------------------------
  const getDuration = (type) => durationTime[type] || 90; // Default 90 min

  //----------------------------
  // FUNCTION: GOOGLE DIRECTIONS API
  //----------------------------
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
          durationValue: leg.duration.value, // seconds
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

  //----------------------------
  // PREPARE EVENTS PER DAY
  //----------------------------
  const dayEvent = [];
  if (eventsList.length > 0) {
    for (let i = 0; i < dailyHours.length; i++) {
      for (let j = 0; j < eventsList.length; j++) {
        if (eventsList[j].date === dailyHours[i].day) {
          dayEvent.push({ day: i, eventDetail: eventsList[j] });
        }
      }
    }
  }

  //----------------------------
  // FUNCTION: CHECK IF PLACE IS OPEN
  //----------------------------
  const isPlaceOpen = (place, currentHour, selectedDay) => {
    // Returns true if the place is open at the selected day/hour
    if (!place.workHours || place.workHours.length === 0) return false;
    const startDay = new Date(arrive);
    startDay.setDate(startDay.getDate() + selectedDay);
    const dayIndex = startDay.getDay();
    const weekMap = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayLabel = weekMap[dayIndex];
    const dayLine = place.workHours.find((line) => line.includes(dayLabel));
    if (!dayLine) return false;
    const cleanedLine = dayLine.replace(/[\u202F\u2009]/g, " ");
    const [_, hoursRaw] = cleanedLine.split(": ");
    if (!hoursRaw) return false;
    if (hoursRaw.toLowerCase().includes("open 24 hours")) return true;
    if (hoursRaw.toLowerCase().includes("closed")) return false;

    const parseTime = (timeStr) => {
      const [time, modifier] = timeStr.trim().split(" ");
      let [hours, minutes] = time.split(":").map(Number);
      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return { hours, minutes };
    };

    const [selHour, selMin] = currentHour.split(":").map(Number);
    const dropMinutes = selHour * 60 + selMin;
    const ranges = hoursRaw.split(",").map((range) => range.trim());

    for (let range of ranges) {
      const [openTimeRaw, closeTimeRaw] = range.split("–").map((s) => s.trim());
      if (!openTimeRaw || !closeTimeRaw) continue;
      const open = parseTime(openTimeRaw);
      const close = parseTime(closeTimeRaw);
      let openMinutes = open.hours * 60 + open.minutes;
      let closeMinutes = close.hours * 60 + close.minutes;
      if (closeMinutes <= openMinutes) closeMinutes += 24 * 60; // Overnight
      const adjustedDropMinutes =
        dropMinutes < openMinutes ? dropMinutes + 24 * 60 : dropMinutes;
      if (
        adjustedDropMinutes >= openMinutes &&
        adjustedDropMinutes <= closeMinutes
      )
        return true;
    }
    return false;
  };

  //----------------------------
  // FUNCTION: FORMAT MINUTES -> HH:MM
  //----------------------------
  const formatTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  //----------------------------
  // FUNCTION: ADD PLACE TO DAY PLAN
  //----------------------------
  // PURPOSE: Adds a place (e.g., restaurant, cafe, attraction) to the day's itinerary
  // PARAMETERS:
  //   placesArray    - array of place objects to choose from
  //   maxEndMinutes  - maximum allowed end time in minutes (to not exceed day end or event start)
  //   currentLocation- current location coordinates {lat, lng}
  //   currentMinutes - current time in minutes since 00:00
  //   usedId         - array of place IDs already used today
  //   usedIdGlobal   - array of place IDs used across all days
  //   dayPlan        - array containing the day's itinerary
  //   dayIndex       - index of the current day (0, 1, 2, ...)
  // RETURNS:
  //   Object { added: boolean, currentLocation, currentMinutes }
  const addPlaceToPlan = async (
    placesArray,
    maxEndMinutes,
    currentLocation,
    currentMinutes,
    usedId,
    usedIdGlobal,
    dayPlan,
    dayIndex
  ) => {
    //----------------------------
    // STEP 1: FILTER AVAILABLE PLACES
    //----------------------------
    const availablePlaces = shuffleArray(
      placesArray.filter(
        (p) => !usedId.includes(p.id) && !usedIdGlobal.includes(p.id)
      )
    );
    if (availablePlaces.length === 0)
      return { added: false, currentLocation, currentMinutes };

    //----------------------------
    // STEP 2: LOOP THROUGH AVAILABLE PLACES
    //----------------------------
    for (let place of availablePlaces) {
      //----------------------------
      // STEP 2A: CALCULATE TRAVEL TIME TO PLACE
      //----------------------------
      const travelInfo = await getTravelInfo(currentLocation, place.loc);
      const travelMinutes = travelInfo
        ? Math.ceil(travelInfo.durationValue / 60)
        : 0;

      //----------------------------
      // STEP 2B: CALCULATE START AND END TIME FOR PLACE
      //----------------------------
      const placeStartMinutes = currentMinutes + travelMinutes;
      const placeDuration = getDuration(place.type);
      const placeEndMinutes = placeStartMinutes + placeDuration;

      //----------------------------
      // STEP 2C: CHECK IF PLACE FITS TIME WINDOW
      //----------------------------
      if (maxEndMinutes && placeEndMinutes > maxEndMinutes) continue;

      //----------------------------
      // STEP 2D: CHECK IF PLACE IS OPEN AT ARRIVAL
      //----------------------------
      if (isPlaceOpen(place, formatTime(placeStartMinutes), dayIndex)) {
        //----------------------------
        // STEP 2E: ADD PLACE TO PLAN
        //----------------------------
        usedId.push(place.id);
        usedIdGlobal.push(place.id);
        dayPlan.push({
          ...place,
          arrivalTime: formatTime(placeStartMinutes),
          endTime: formatTime(placeEndMinutes),
          travelInfo,
        });
        return {
          added: true,
          currentLocation: place.loc,
          currentMinutes: placeEndMinutes,
        };
      }
    }

    //----------------------------
    // STEP 3: NO PLACE WAS ADDED
    //----------------------------
    return { added: false, currentLocation, currentMinutes };
  };

  //----------------------------
  // FUNCTION: BUILD DAILY PLAN
  //----------------------------
  // PURPOSE: Build a full itinerary for a single day, including events, restaurants, cafes, and attractions
  // PARAMETERS:
  //   dayIndex       - index of the current day
  //   places         - array of all places to consider
  //   startLocation  - starting location coordinates {lat, lng}
  //   startTime      - day start time as string "HH:MM"
  //   endTime        - day end time as string "HH:MM"
  //   usedIdGlobal   - array of place IDs already used across all days
  // RETURNS:
  //   dayPlan array containing all scheduled places/events for the day
  const BuildDailyPlan = async (
    dayIndex,
    places,
    startLocation,
    startTime,
    endTime,
    usedIdGlobal
  ) => {
    //----------------------------
    // STEP 1: INITIALIZE VARIABLES
    //----------------------------
    let dayPlan = [];
    let usedId = [];
    let [startHour, startMin] = (startTime || "08:30").split(":").map(Number);
    let [endHour, endMin] = (endTime || "22:00").split(":").map(Number);
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    let currentLocation = startLocation;

    //----------------------------
    // STEP 2: FILTER SPECIAL PLACE TYPES
    //----------------------------
    const eventForToday = dayEvent.filter((event) => event.day === dayIndex);
    const bakeryCoffee = places
      .filter((p) => p.type === "Cafe")
      .sort((a, b) => a.dist - b.dist);
    const resturants = places
      .filter((p) =>
        [
          "Restaurant",
          "Kosher Restaurant",
          "Halal Restaurant",
          "Vegetarian Restaurant",
          "Vegan Restaurant",
        ].includes(p.type)
      )
      .sort((a, b) => a.dist - b.dist);
    const fineDining = places
      .filter((p) => p.type === "Fine Dining")
      .sort((a, b) => a.dist - b.dist);
    const filteredPlaces = places
      .filter(
        (p) =>
          ![
            "Bakery",
            "Cafe",
            "Restaurant",
            "Kosher Restaurant",
            "Halal Restaurant",
            "Vegetarian Restaurant",
            "Vegan Restaurant",
            "Fine Dining",
          ].includes(p.type)
      )
      .sort((a, b) => a.dist - b.dist);

    let cntCoffee = 0,
      cntRestaurant = 0;

    //----------------------------
    // STEP 3: FUNCTION TO ADD SPECIAL PLACES (CAFE/RESTAURANT) BASED ON TIME
    //----------------------------
    const specilAdd = async (maxEndMinutes) => {
      // Breakfast / morning coffee
      if (
        bakeryCoffee.length > 0 &&
        currentMinutes >= 510 &&
        currentMinutes <= 600 &&
        cntCoffee < 1
      ) {
        const res = await addPlaceToPlan(
          bakeryCoffee,
          maxEndMinutes,
          currentLocation,
          currentMinutes,
          usedId,
          usedIdGlobal,
          dayPlan,
          dayIndex
        );
        if (res.added) {
          cntCoffee++;
          currentLocation = res.currentLocation;
          currentMinutes = res.currentMinutes;
          return true;
        }
      }

      // Lunch
      if (
        resturants.length > 0 &&
        currentMinutes >= 720 &&
        currentMinutes <= 900 &&
        cntRestaurant < 1
      ) {
        const res = await addPlaceToPlan(
          resturants,
          maxEndMinutes,
          currentLocation,
          currentMinutes,
          usedId,
          usedIdGlobal,
          dayPlan,
          dayIndex
        );
        if (res.added) {
          cntRestaurant++;
          currentLocation = res.currentLocation;
          currentMinutes = res.currentMinutes;
          return true;
        }
      }

      // Afternoon coffee
      if (
        bakeryCoffee.length > 0 &&
        currentMinutes >= 1020 &&
        currentMinutes <= 1080 &&
        cntCoffee < 2
      ) {
        const res = await addPlaceToPlan(
          bakeryCoffee,
          maxEndMinutes,
          currentLocation,
          currentMinutes,
          usedId,
          usedIdGlobal,
          dayPlan,
          dayIndex
        );
        if (res.added) {
          cntCoffee++;
          currentLocation = res.currentLocation;
          currentMinutes = res.currentMinutes;
          return true;
        }
      }

      // Dinner / fine dining
      if (
        (resturants.length > 0 || fineDining.length > 0) &&
        currentMinutes >= 1170 &&
        currentMinutes <= 1260 &&
        cntRestaurant < 2
      ) {
        if (fineDining.length > 0) {
          const res = await addPlaceToPlan(
            fineDining,
            maxEndMinutes,
            currentLocation,
            currentMinutes,
            usedId,
            usedIdGlobal,
            dayPlan,
            dayIndex
          );
          if (res.added) {
            cntRestaurant++;
            currentLocation = res.currentLocation;
            currentMinutes = res.currentMinutes;
            return true;
          }
        } else {
          const res = await addPlaceToPlan(
            resturants,
            maxEndMinutes,
            currentLocation,
            currentMinutes,
            usedId,
            usedIdGlobal,
            dayPlan,
            dayIndex
          );
          if (res.added) {
            cntRestaurant++;
            currentLocation = res.currentLocation;
            currentMinutes = res.currentMinutes;
            return true;
          }
        }
      }

      return false;
    };

    //----------------------------
    // STEP 4: BUILD DAY WITH EVENTS
    //----------------------------
    if (eventForToday.length > 0) {
      for (let event of eventForToday) {
        const todayEvent = event.eventDetail;
        const [eveHour, eveMin] = todayEvent.startTimelocal
          .split(":")
          .map(Number);
        const eventTime = eveHour * 60 + eveMin;

        //----------------------------
        // STEP 4A: FILL TIME BEFORE EVENT WITH PLACES
        //----------------------------
        while (currentMinutes < eventTime) {
          if (await specilAdd(eventTime)) continue;
          const res = await addPlaceToPlan(
            filteredPlaces,
            eventTime,
            currentLocation,
            currentMinutes,
            usedId,
            usedIdGlobal,
            dayPlan,
            dayIndex
          );
          if (!res.added) break;
          currentLocation = res.currentLocation;
          currentMinutes = res.currentMinutes;
        }

        //----------------------------
        // STEP 4B: ADD EVENT TO PLAN
        //----------------------------
        const eventDuration = 120;
        dayPlan.push({
          name: todayEvent.name,
          type: "Event",
          loc: { lat: todayEvent.location.lat, lng: todayEvent.location.lon },
          arrivalTime: formatTime(eventTime),
          endTime: formatTime(eventTime + eventDuration),
          description: todayEvent.description,
          image: todayEvent.image,
          placeName: todayEvent.placeName,
          id: todayEvent.id,
          address: todayEvent.address,
          city: todayEvent.city,
        });
        currentMinutes = eventTime + eventDuration;
        currentLocation = {
          lat: todayEvent.location.lat,
          lng: todayEvent.location.lon,
        };
      }

      //----------------------------
      // STEP 4C: FILL TIME AFTER EVENTS
      //----------------------------
      while (currentMinutes < endMinutes) {
        if (await specilAdd(endMinutes)) continue;
        const res = await addPlaceToPlan(
          filteredPlaces,
          endMinutes,
          currentLocation,
          currentMinutes,
          usedId,
          usedIdGlobal,
          dayPlan,
          dayIndex
        );
        if (!res.added) break;
        currentLocation = res.currentLocation;
        currentMinutes = res.currentMinutes;
      }
    } else {
      //----------------------------
      // STEP 4D: IF NO EVENTS, FILL WHOLE DAY
      //----------------------------
      while (currentMinutes < endMinutes) {
        if (await specilAdd(endMinutes)) continue;
        const res = await addPlaceToPlan(
          filteredPlaces,
          endMinutes,
          currentLocation,
          currentMinutes,
          usedId,
          usedIdGlobal,
          dayPlan,
          dayIndex
        );
        if (!res.added) break;
        currentLocation = res.currentLocation;
        currentMinutes = res.currentMinutes;
      }
    }

    //----------------------------
    // STEP 5: RETURN FINAL DAY PLAN
    //----------------------------
    return dayPlan;
  };

  //----------------------------
  // BUILD ALL DAYS PLANS
  //----------------------------
  useEffect(() => {
    const buildPlansAsync = async () => {
      const buildPlans = [];
      const usedIdGlobal = [];
      for (let i = 0; i < spendDays; i++) {
        const dayPlan = await BuildDailyPlan(
          i,
          places,
          startloc,
          dailyHours[i]?.start,
          dailyHours[i]?.end,
          usedIdGlobal
        );
        buildPlans.push(dayPlan);
      }
      setSmartDailyPlans(buildPlans);
    };
    buildPlansAsync();
  }, [places, spendDays, dailyHours, arrive, startloc, eventsList]);

  //----------------------------
  // UPDATE PLAN STATUS
  //----------------------------
  useEffect(() => {
    if (!dailyHours || dailyHours.length === 0) return;
    const startdate = new Date(dailyHours[0]?.day);
    const endDate = new Date(dailyHours.at(-1)?.day);
    const todayDate = new Date();
    setIsActive(todayDate <= startdate || todayDate <= endDate);
  }, [dailyHours]);

  //----------------------------
  // SEND PLAN TO DASHBOARD
  //----------------------------
  const handelSendToDashBoard = async (uid) => {
    if (!user) return;
    const data = new FormData();
    data.append("userId", uid);
    data.append("smartDailyPlans", JSON.stringify(smartDailyPlans));
    data.append("places", JSON.stringify(places));
    data.append("dailyHours", JSON.stringify(dailyHours));
    data.append("startDate", dailyHours[0]?.day);
    data.append("endDate", dailyHours.at(-1)?.day);
    data.append("isActive", isActive ? 1 : 0);
    data.append("startloc", JSON.stringify(startloc));
    data.append("titlePlan", titlePlan);
    data.append("eventCalender", JSON.stringify([]));
    const url =
      "http://localhost:8080/www/tripmasterv01/public/SendToDashDatBase.php";
    try {
      const res = await axios.post(url, data);
      console.log("Server response:", res.data);
    } catch (err) {
      console.error("Failed", err);
    }
  };

  useEffect(() => {
    if (smartDailyPlans.length > 0 && user && !hasSend) {
      handelSendToDashBoard(user.uid);
      setHasSend(true);
    }
  }, [smartDailyPlans, user]);

  //----------------------------
  // JSX
  //----------------------------
  return (
    <div className="resualtPlan">
      {/* Show link to dashboard if plan ready */}
      {smartDailyPlans.length > 0 && (
        <Link to="/DashBoard">
          <h1 className="dashReady">Your Plan Is Ready</h1>
        </Link>
      )}

      {/* Show loader if places exist but plan not ready */}
      {places.length > 0 && smartDailyPlans.length === 0 && (
        <div className="loadingPlan">
          <div className="loader"></div>
          <h1 className="loadingContant"></h1>
        </div>
      )}
    </div>
  );
};

export default Myplan;
