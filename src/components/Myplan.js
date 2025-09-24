import React, { useState, useEffect } from "react";
import "./Myplan.css";
import { useAuthState } from "react-firebase-hooks/auth";
import { Link } from "react-router";
import { auth } from "../fire";
import axios from "axios";

const Myplan = ({
  places,
  spendDays,
  dailyHours,
  arrive,
  startloc,
  eventsList,
  shuffleArray,
  titlePlan,
}) => {
  const [user] = useAuthState(auth);
  const [isActive, setIsActive] = useState(true);
  const [hasSend, setHasSend] = useState(false);
  const [smartDailyPlans, setSmartDailyPlans] = useState([]);
  const [sharedPlan, setSharedPlan] = useState("NO");
  const [idSharedTrip, setIdSharedTrip] = useState(0);

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

  const getDuration = (type) => durationTime[type] || 90;

  // Google Directions API - תחבורה ציבורית
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
          durationValue: leg.duration.value, // שניות
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

  // אירועים ליום
  const dayEvent = [];
  if (eventsList.length > 0) {
    for (let i = 0; i < dailyHours.length; i++) {
      for (let j = 0; j < eventsList.length; j++) {
        if (eventsList[j].date === dailyHours[i].day) {
          dayEvent.push({
            day: i,
            eventDetail: eventsList[j],
          });
        }
      }
    }
  }

  // בדיקת שעות פתיחה
  const isPlaceOpen = (place, currentHour, selectedDay) => {
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
    const lowerHours = hoursRaw.toLowerCase();
    if (lowerHours.includes("open 24 hours")) return true;
    if (lowerHours.includes("closed")) return false;
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

  // --------- Helper to format minutes into HH:MM ---------
  const formatTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  // --------- פונקציה אסינכרונית להוספת מקום ---------
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
    const availablePlaces = shuffleArray(
      placesArray.filter(
        (p) => !usedId.includes(p.id) && !usedIdGlobal.includes(p.id)
      )
    );
    if (availablePlaces.length === 0)
      return { added: false, currentLocation, currentMinutes };

    for (let place of availablePlaces) {
      // זמן נסיעה
      const travelInfo = await getTravelInfo(currentLocation, place.loc);
      const travelMinutes = travelInfo
        ? Math.ceil(travelInfo.durationValue / 60)
        : 0;
      const placeStartMinutes = currentMinutes + travelMinutes;
      const placeDuration = getDuration(place.type);
      const placeEndMinutes = placeStartMinutes + placeDuration;
      if (maxEndMinutes && placeEndMinutes > maxEndMinutes) continue;
      if (isPlaceOpen(place, formatTime(placeStartMinutes), dayIndex)) {
        usedId.push(place.id);
        usedIdGlobal.push(place.id);
        dayPlan.push({
          ...place,
          arrivalTime: formatTime(placeStartMinutes),
          endTime: formatTime(placeEndMinutes),
          travelInfo, // פרטי הנסיעה מהמקום הקודם
        });
        return {
          added: true,
          currentLocation: place.loc,
          currentMinutes: placeEndMinutes,
        };
      }
    }
    return { added: false, currentLocation, currentMinutes };
  };

  // --------- פונקציה אסינכרונית לבניית יום ---------
  const BuildDailyPlan = async (
    dayIndex,
    places,
    startLocation,
    startTime,
    endTime,
    usedIdGlobal
  ) => {
    let dayPlan = [];
    let usedId = [];
    let [startHour, startMin] = (startTime || "08:30").split(":").map(Number);
    let [endHour, endMin] = (endTime || "22:00").split(":").map(Number);
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    let currentLocation = startLocation;

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

    let cntCoffee = 0;
    let cntRestaurant = 0;

    // פונקציה אסינכרונית להוספת מקומות מיוחדים
    const specilAdd = async (maxEndMinutes) => {
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

    // --- בניית התוכנית ---
    if (eventForToday.length > 0) {
      for (let event of eventForToday) {
        const todayEvent = event.eventDetail;
        const [eveHour, eveMin] = todayEvent.startTimelocal
          .split(":")
          .map(Number);
        const eventTime = eveHour * 60 + eveMin;

        // לפני האירוע
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

        // האירוע עצמו
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

      // אחרי האירוע
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
      // יום בלי אירועים
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

    return dayPlan;
  };

  // בניית התוכנית לכל הימים
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

  // עדכון סטטוס תוכנית
  useEffect(() => {
    if (!dailyHours || dailyHours.length === 0) return;
    const datestr = dailyHours[0]?.day;
    const dateEndstr = dailyHours.at(-1)?.day;
    if (!datestr || !dateEndstr) return;
    const startdate = new Date(datestr);
    const endDate = new Date(dateEndstr);
    const todayDate = new Date();
    if (todayDate < startdate || todayDate < endDate) {
      setIsActive(true);
    } else {
      setIsActive(false);
    }
  }, [dailyHours]);

  // שליחה לדשבורד
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
      console.log("succes send to database");
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

  return (
    <div className="resualtPlan">
      {smartDailyPlans.length > 0 && <Link to="/DashBoard">Dashboard</Link>}
      {places.length > 0 && smartDailyPlans.length === 0 && <h1>Loading</h1>}
    </div>
  );
};

export default Myplan;
