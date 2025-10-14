import React, { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../fire";
import axios from "axios";
import "./PlanMyTrip.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import Myplan from "./Myplan";
import Events from "./Events";

const PlanMyTrip = () => {
  //----------------------------
  // State variables
  //----------------------------
  const [user] = useAuthState(auth); // Firebase user info
  const [address, setAddress] = useState(""); // Destination input
  const [types, setTypes] = useState([]); // User preferences
  const [event, setEvent] = useState(""); // Event filter
  const [load, setLoad] = useState(false); // Loading state
  const [clicked, setClicked] = useState(true); // Button clicked state
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 }); // Destination lat/lng
  const [arrive, setArrive] = useState(""); // Arrival date
  const [departure, setDeparture] = useState(""); // Departure date
  const [allPlaces, setAllPlaces] = useState([]); // List of places
  const [error, setError] = useState(null); // Error message
  const [country, SetCountry] = useState(""); // Country name
  const [spendDays, setSpendDays] = useState(); // Trip duration
  const [eventsList, setEventsList] = useState([]); // All events
  const [dailyHours, setDailyHours] = useState([]); // Day schedule
  const [titlePlan, setTitlePlan] = useState(""); // Trip title
  const [showSugestion, setShowSugestion] = useState(true); // Show suggestions
  const [surpriseMode, setSurpriseMode] = useState(false); // Surprise trip
  const [selectedCity, setSelectedCity] = useState(null); // Random city for surprise
  const [suggestedCities, setSuggestedCities] = useState([]); // Suggested cities list

  //----------------------------
  // Fetch user preferences from DB
  //----------------------------
  const checkIfTherePreferences = async (uid) => {
    const data = new FormData();
    data.append("userId", uid);
    const url = "http://localhost:8080/www/tripmasterv01/public/GetProfile.php";
    try {
      const res = await axios.post(url, data);
      if (res.data) {
        const preferences = res.data;
        if (Array.isArray(preferences)) {
          setTypes([...preferences]); // Save preferences
        } else console.log("Invalid Format");
      }
    } catch (err) {
      console.log("Error Fetching");
    }
  };

  //----------------------------
  // Load preferences on user login
  //----------------------------
  useEffect(() => {
    const fetchPreferencesStatus = async () => {
      if (user) await checkIfTherePreferences(user.uid);
    };
    fetchPreferencesStatus();
  }, [user]);

  //----------------------------
  // Fetch places & events when coordinates ready
  //----------------------------
  useEffect(() => {
    const fetchPlacesIfCoordinateReady = async () => {
      if (coordinates.lat !== 0 && coordinates.lng !== 0) {
        if (types.length > 0) await fetchGooglePlaces();
        if (eventChecker()) await fetchEvents();
      }
      setLoad(false);
    };
    fetchPlacesIfCoordinateReady();
  }, [coordinates]);

  //----------------------------
  // Utility function: shuffle array
  //----------------------------
  const shuffleArray = (arr) => {
    let newarr = [...arr];
    for (let i = arr.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [newarr[i], newarr[j]] = [newarr[j], newarr[i]];
    }
    return newarr;
  };

  //----------------------------
  // Handle departure input
  //----------------------------
  const handelDepature = (e) => {
    setDeparture(e.target.value);
  };

  //----------------------------
  // Generate daily hours array
  //----------------------------
  const generateDailyHoursInputs = () => {
    const days = [];
    let current = new Date(arrive);
    const end = new Date(departure);
    while (current <= end) {
      const dayStr = current.toISOString().split("T")[0];
      days.push({ day: dayStr, start: "08:30", end: "22:00" }); // Default daily hours
      current.setDate(current.getDate() + 1);
    }
    setDailyHours(days);
  };

  //----------------------------
  // Calculate total trip days
  //----------------------------
  const clacSpendDays = (arrivalDate, departureDate) => {
    let arr = new Date(arrivalDate);
    let dep = new Date(departureDate);
    let diff = (dep - arr) / 86400000;
    return diff + 1;
  };

  //----------------------------
  // Fetch coordinates from Google
  //----------------------------
  const fetchCoordinates = async () => {
    const apiKey = process.env.REACT_APP_KEY_GOOGLE;
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}&language=en`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request error: ${response.status}`);
      const data = await response.json();
      if (data.status !== "OK") throw new Error(`API error: ${data.status}`);

      const location = data.results[0].geometry.location;
      setCoordinates({ lat: location.lat, lng: location.lng });

      const countryComponent = data.results[0]?.address_components.find(
        (component) => component.types.includes("country")
      );
      if (countryComponent) {
        SetCountry(countryComponent.long_name);
        setTitlePlan(`My Trip to ${address} ${countryComponent.long_name}`);
      }

      setError(null);
    } catch (err) {
      setError(err.message);
      setCoordinates({ lat: 0, lng: 0 });
    }
  };

  //----------------------------
  // Fetch Google Places info
  //----------------------------
  const fetchGooglePlaces = async () => {
    const filteredTypes = types.filter((t) => t.Category !== "Events");
    const apiKey = process.env.REACT_APP_KEY_GOOGLE;
    let googlePlaces = [];

    for (let type of filteredTypes) {
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coordinates.lat},${coordinates.lng}&language=en&radius=20000&key=${apiKey}`;
      if (type.google_type)
        url += `&type=${encodeURIComponent(type.google_type)}`;
      if (type.google_keyword)
        url += `&keyword=${encodeURIComponent(type.google_keyword)}`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data?.results?.length > 0) {
          let randres = shuffleArray(data.results).filter(
            (rand) => !rand.name.toLowerCase().includes("hotel")
          );
          for (const place of randres.slice(0, 50)) {
            const detailPlaceUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=editorial_summary,name,address_components,formatted_address,geometry,current_opening_hours,photos,place_id,rating,user_ratings_total,formatted_phone_number,website,url,reviews,types,price_level&language=en&key=${apiKey}`;
            const detailPlaceRes = await fetch(detailPlaceUrl);
            const detailPlaceData = await detailPlaceRes.json();
            const dist = calculateDistance(
              coordinates.lat,
              coordinates.lng,
              detailPlaceData.result?.geometry?.location?.lat,
              detailPlaceData.result?.geometry?.location?.lng
            );

            const countryComponent =
              detailPlaceData.result?.address_components?.find((c) =>
                c.types.includes("country")
              );
            if (
              countryComponent &&
              country === countryComponent.long_name &&
              dist <= 30
            ) {
              let des =
                detailPlaceData.result.editorial_summary?.overview ?? "No Info";
              let myplace = {
                name: detailPlaceData.result.name,
                addressPlace: detailPlaceData.result.formatted_address,
                opennow:
                  detailPlaceData.result.current_opening_hours?.open_now ??
                  "No info",
                workHours:
                  detailPlaceData.result.current_opening_hours?.weekday_text ??
                  [],
                loc: detailPlaceData.result.geometry.location,
                type: type.Category,
                photo:
                  detailPlaceData.result.photos?.length > 0
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${detailPlaceData.result.photos[0].photo_reference}&key=${apiKey}`
                    : "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Noimage.svg/1200px-Noimage.svg.png",
                description: des,
                id: place.place_id,
                rating: detailPlaceData.result.rating ?? "No info",
                userRatingsTotal:
                  detailPlaceData.result.user_ratings_total ?? 0,
                phoneNumber:
                  detailPlaceData.result.formatted_phone_number ?? "No info",
                website: detailPlaceData.result.website ?? "",
                googleMapsUrl: detailPlaceData.result.url ?? "",
                reviews: detailPlaceData.result.reviews?.slice(0, 3) ?? [],
                types: detailPlaceData.result.types ?? [],
                priceLevel: detailPlaceData.result.price_level ?? null,
                dist: dist,
              };
              if (
                !allPlaces.find((p) => p.id === myplace.id) &&
                !googlePlaces.find((p) => p.id === myplace.id)
              ) {
                googlePlaces.push(myplace);
              }
            }
          }
        }
      } catch (error) {
        console.log("google err", error);
      }
    }
    setAllPlaces(shuffleArray(googlePlaces));
  };

  //----------------------------
  // Fetch events from TicketMaster
  //----------------------------
  const fetchEvents = async () => {
    let apiKey = process.env.REACT_APP_KEY_TICKETMASTER;
    let events = [];
    let startDateTime = `${arrive}T00:00:00Z`;
    let endDateTime = `${departure}T23:59:59Z`;
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&latlong=${coordinates.lat},${coordinates.lng}&radius=100&unit=km&startDateTime=${startDateTime}&endDateTime=${endDateTime}&sort=date,asc&locale=en-us,en,*`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const res = data._embedded?.events ?? [];

      for (let event of res) {
        const addEvent = {
          name: event.name ?? "no Info",
          id: event.id ?? "no Info",
          placeName: event._embedded?.venues[0]?.name ?? "no Info",
          city: event._embedded?.venues[0]?.city?.name ?? "no Info",
          country: event._embedded?.venues[0]?.country?.name ?? "no Info",
          address: event._embedded.venues[0].address?.line1,
          location: {
            lat: event._embedded?.venues[0]?.location?.latitude ?? "none",
            lon: event._embedded?.venues[0]?.location?.longitude ?? "none",
          },
          date: event.dates?.start?.localDate ?? "no Info",
          startTimelocal: event.dates?.start?.localTime ?? "no Info",
          ticket: event.url ?? "no Info",
          image: event.images[0]?.url ?? "#",
          description: event.info ?? "No description available",
          start: event.dates?.start?.dateTime ?? "no Info",
          end: event.dates?.end?.dateTime ?? "no Info",
        };
        if (
          !events.some(
            (evt) =>
              evt.name === addEvent.name &&
              evt.date === addEvent.date &&
              evt.placeName === addEvent.placeName
          )
        ) {
          events.push(addEvent);
        }
      }
    } catch (err) {}
    setEventsList(events);
  };

  //----------------------------
  // Check if Events type exists
  //----------------------------
  const eventChecker = () => types.some((t) => t.Category === "Events");

  //----------------------------
  // Validate dates
  //----------------------------
  const checkDateLogic = (arrive, departure) => {
    let res = clacSpendDays(arrive, departure);
    if (res < 0) {
      alert("You cannot depart before arriving");
      setArrive("");
      setDeparture("");
      return;
    }
    setSpendDays(res);
  };

  //----------------------------
  // Main Plan Button
  //----------------------------
  const handelMyPlanTrip = async () => {
    setShowSugestion(false);
    if (!address.trim()) return alert("Please Enter Address");
    if (arrive && departure) checkDateLogic(arrive, departure);
    else return alert("Fill The Dates");

    generateDailyHoursInputs();
    setClicked(false);
    setLoad(true);
    await fetchCoordinates();
  };

  //----------------------------
  // Calculate distance in km
  //----------------------------
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  //----------------------------
  // Fetch random city for surprise
  //----------------------------
  const fetchRandomCity = async () => {
    try {
      const arriveDate = new Date(arrive);
      const monthNumber = arriveDate.getMonth() + 1;
      const data = new FormData();
      data.append("month", monthNumber);
      const url =
        "http://localhost:8080/www/tripmasterv01/public/GetRandomCity.php";
      const response = await axios.post(url, data);

      if (response.data && response.data.city) {
        setSelectedCity(response.data);
        setAddress(response.data.city);
        return response.data;
      }
    } catch (error) {
      console.error("Error fetching random city:", error);
      alert("Error fetching random city");
    }
    return null;
  };

  //----------------------------
  // Fetch suggested cities
  //----------------------------
  const fetchSuggestedCities = async () => {
    const month = new Date().getMonth() + 1;
    try {
      const url = `http://localhost:8080/www/tripmasterv01/public/GetRandomCities.php`;
      const data = new FormData();
      data.append("month", month);
      const response = await axios.post(url, data);

      if (response.data && Array.isArray(response.data)) {
        const shuffled = [...response.data].sort(() => 0.5 - Math.random());
        setSuggestedCities(shuffled.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching suggested cities:", error);
    }
  };

  useEffect(() => {
    if (showSugestion) fetchSuggestedCities();
  }, [showSugestion]);

  //----------------------------
  // Handle surprise trip button
  //----------------------------
  const handelSurpriseTripMyPlan = async () => {
    setShowSugestion(false);
    setSurpriseMode(true);

    if (arrive && departure) checkDateLogic(arrive, departure);
    else return alert("Fill The Dates");

    const randomCity = await fetchRandomCity();
    if (!randomCity) return;

    generateDailyHoursInputs();
    setClicked(false);
    setLoad(true);
  };

  //----------------------------
  // Update coordinates on surprise city change
  //----------------------------
  useEffect(() => {
    if (address && surpriseMode) fetchCoordinates();
  }, [address, surpriseMode]);

  //----------------------------
  // Debug logs
  //----------------------------

  //----------------------------
  // JSX Render
  //----------------------------
  return (
    <div className="conPlanMyTrip">
      {/* Input section */}
      <div className="myInputs">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your Destion/hotel/Guest house/Country/Street"
        />
        <input
          type="Date"
          value={arrive}
          onChange={(e) => setArrive(e.target.value)}
        />
        <input
          type="Date"
          value={departure}
          onChange={(e) => handelDepature(e)}
          min={arrive}
        />
        {spendDays && <h1>{spendDays} Days</h1>}

        {/* Surprise city reveal */}
        {surpriseMode && selectedCity && !load && (
          <div
            className="surprise-reveal"
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "15px",
              margin: "20px 0",
              textAlign: "center",
              boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
            }}>
            <h2>Your Surprise Destination!</h2>
            <h3>{selectedCity.city}</h3>
            <p>Perfect timing for this amazing destination!</p>
          </div>
        )}

        {/* Buttons */}
        <div className="buttonContainer">
          <button
            type="button"
            className="btn btn-warning btn-lg surprise-btn"
            onClick={handelSurpriseTripMyPlan}
            style={{
              marginBottom: "10px",
              background: "linear-gradient(45deg, #ff6b35, #f7931e)",
              border: "none",
              boxShadow: "0 4px 15px rgba(255, 107, 53, 0.3)",
              transition: "all 0.3s ease",
            }}>
            MAKE SURPRISE TRIP FOR ME 🎁
          </button>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handelMyPlanTrip}>
            Master My PlanMyTrip
          </button>
        </div>

        {/* Suggested cities */}
        {showSugestion && suggestedCities.length > 0 && (
          <div>
            <h3>Best Destinations This Month</h3>
            <div className="suggestedCitiesContainer">
              {suggestedCities.map((city, index) => (
                <div
                  key={index}
                  className="suggestedCityCard"
                  onClick={() => {
                    setAddress(city.city);
                    setShowSugestion(false);
                  }}
                  style={{ cursor: "pointer" }}>
                  <h3>{city.city}</h3>
                  <p>Recommended</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading animation */}
      {load && !clicked && (
        <div className="loading-message">
          <DotLottieReact
            src="https://lottie.host/434cf64c-00ed-4c3d-9489-05e33b24565c/CdFG0JW6LS.lottie"
            loop
            autoplay
            className="waitanimation"
          />
          <h2>
            {surpriseMode
              ? " Planning Your Surprise Adventure..."
              : "build your Plan"}
          </h2>
          {surpriseMode && selectedCity && (
            <p>Destination: {selectedCity.city}</p>
          )}
        </div>
      )}

      {/* Render Plan or Events */}
      {!load &&
        (eventsList.length > 0 ? (
          <Events
            eventsLst={eventsList}
            places={allPlaces}
            setPlaces={setAllPlaces}
            spendDays={spendDays}
            arrive={arrive}
            titlePlan={titlePlan}
            dailyHours={dailyHours}
            startloc={coordinates}
            shuffleArray={shuffleArray}
            calculateDistance={calculateDistance}
          />
        ) : (
          <Myplan
            places={allPlaces}
            spendDays={spendDays}
            eventsList={eventsList}
            setPlaces={setAllPlaces}
            arrive={arrive}
            dailyHours={dailyHours}
            startloc={coordinates}
            titlePlan={titlePlan}
            shuffleArray={shuffleArray}
            calculateDistance={calculateDistance}
          />
        ))}
    </div>
  );
};

export default PlanMyTrip;
