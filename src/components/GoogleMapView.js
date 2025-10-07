import React from "react";
import { useState, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  useLoadScript,
  Polyline,
} from "@react-google-maps/api"; //npm install @react-google-maps/api
import "./GoogleMapView.css";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

const containerStyle = {
  width: "1000px",
  height: "550px",
  borderRadius: "12px",
};

const GoogleMapView = ({ center, eventCalender, dayPlanShow }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const categoryIcons = {
    "Events": "https://maps.google.com/mapfiles/kml/shapes/arts.png",
    "Families": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Zoo": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Aquarium": "https://maps.google.com/mapfiles/kml/shapes/fishing.png",
    "Amusement Park":
      "https://maps.google.com/mapfiles/kml/shapes/themepark.png",
    "Water Park": "https://maps.google.com/mapfiles/kml/shapes/swimming.png",
    "Children's Museum":
      "https://maps.google.com/mapfiles/kml/shapes/museum_maps.png",
    "Petting Zoo":
      "https://maps.google.com/mapfiles/kml/shapes/horsebackriding.png",
    "Trampoline Park":
      "https://maps.google.com/mapfiles/kml/shapes/schools_maps.png",
    "Mini Golf": "https://maps.google.com/mapfiles/kml/shapes/golf.png",
    "Playground": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Bowling Alley": "https://maps.google.com/mapfiles/kml/shapes/sports.png",
    "Ice Skating Rink":
      "https://maps.google.com/mapfiles/kml/shapes/snowflake_simple.png",
    "Couples": "https://maps.google.com/mapfiles/kml/shapes/heliport.png", // סמלי רומנטיקה אפשר לשנות
    "Winery": "https://maps.google.com/mapfiles/kml/shapes/wineries.png",
    "Hot Air Balloon Ride":
      "https://maps.google.com/mapfiles/kml/shapes/heliport.png",
    "Spa": "https://maps.google.com/mapfiles/kml/shapes/shopping.png",
    "Romantic Tour": "https://maps.google.com/mapfiles/kml/shapes/movies.png",
    "Boat Tour": "https://maps.google.com/mapfiles/kml/shapes/marina.png",
    "Cafe": "https://maps.google.com/mapfiles/kml/shapes/coffee.png",
    "Fine Dining": "https://maps.google.com/mapfiles/kml/shapes/dining.png",
    "Youth": "https://maps.google.com/mapfiles/kml/shapes/arts.png",
    "Escape Room":
      "https://maps.google.com/mapfiles/kml/shapes/library_maps.png",
    "VR Gaming Center": "https://maps.google.com/mapfiles/kml/shapes/arts.png",
    "Go-Kart Track":
      "https://maps.google.com/mapfiles/kml/shapes/motorcycling.png",
    "Rock Climbing Gym":
      "https://maps.google.com/mapfiles/kml/shapes/hiker.png",
    "Laser Tag": "https://maps.google.com/mapfiles/kml/shapes/target.png",
    "Arcade": "https://maps.google.com/mapfiles/kml/shapes/arts.png",
    "Skating Park": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Extreme": "https://maps.google.com/mapfiles/kml/shapes/motorcycling.png",
    "Scuba Diving Center":
      "https://maps.google.com/mapfiles/kml/shapes/swimming.png",
    "Skydiving Center":
      "https://maps.google.com/mapfiles/kml/shapes/heliport.png",
    "Rafting": "https://maps.google.com/mapfiles/kml/shapes/marina.png",
    "Snorkeling Tour":
      "https://maps.google.com/mapfiles/kml/shapes/swimming.png",
    "Bungee Jumping":
      "https://maps.google.com/mapfiles/kml/shapes/motorcycling.png",
    "ATV Tours": "https://maps.google.com/mapfiles/kml/shapes/truck.png",
    "Adventure Sports":
      "https://maps.google.com/mapfiles/kml/shapes/motorcycling.png",
    "Paragliding": "https://maps.google.com/mapfiles/kml/shapes/heliport.png",
    "Kite Surfing": "https://maps.google.com/mapfiles/kml/shapes/fishing.png",
    "Nature": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Nature Reserve": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Botanical Garden": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Hiking Area": "https://maps.google.com/mapfiles/kml/shapes/hiker.png",
    "Camping Area":
      "https://maps.google.com/mapfiles/kml/shapes/campground.png",
    "Beach": "https://maps.google.com/mapfiles/kml/shapes/beach.png",
    "Lake": "https://maps.google.com/mapfiles/kml/shapes/fishing.png",
    "Mountain": "https://maps.google.com/mapfiles/kml/shapes/mountains.png",
    "Park": "https://maps.google.com/mapfiles/kml/shapes/parks.png",
    "Culture": "https://maps.google.com/mapfiles/kml/shapes/movies.png",
    "Museum": "https://maps.google.com/mapfiles/kml/shapes/museum_maps.png",
    "Art Gallery": "https://maps.google.com/mapfiles/kml/shapes/arts.png",
    "Cultural Center": "https://maps.google.com/mapfiles/kml/shapes/movies.png",
    "Historical Site":
      "https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png",
    "Religious Site": "https://maps.google.com/mapfiles/kml/shapes/chapel.png",
    "Food & Shopping":
      "https://maps.google.com/mapfiles/kml/shapes/shopping.png",
    "Restaurant": "https://maps.google.com/mapfiles/kml/shapes/dining.png",
    "Kosher Restaurant":
      "https://maps.google.com/mapfiles/kml/shapes/dining.png",
    "Halal Restaurant":
      "https://maps.google.com/mapfiles/kml/shapes/dining.png",
    "Vegetarian Restaurant":
      "https://maps.google.com/mapfiles/kml/shapes/dining.png",
    "Vegan Restaurant":
      "https://maps.google.com/mapfiles/kml/shapes/dining.png",
    "Shopping Mall": "https://maps.google.com/mapfiles/kml/shapes/shopping.png",
    "Street Food": "https://maps.google.com/mapfiles/kml/shapes/food.png",
    "Local Market": "https://maps.google.com/mapfiles/kml/shapes/shopping.png",
    Default: "https://maps.google.com/mapfiles/kml/shapes/info-i_maps.png",
  };

  const [filterdEvent, setFilterdEvent] = useState([]);
  //----------------------------------------------------
  useEffect(() => {
    if (dayPlanShow && eventCalender.length > 0) {
      const home = { title: "My Stay Place", loc: center, type: "Home" };

      setFilterdEvent([
        home,
        ...eventCalender.filter(
          (e) =>
            e.start.split("T")[0]?.trim() === dayPlanShow.trim()
            //console.log("event start:", e.start.split("T")[0]?.trim(), "==?", dayPlanShow.trim());
        ),
      ]);
    }
  }, [dayPlanShow, eventCalender]);
  //-------------------------------------------------
  //------Debugs and checks--------
  useEffect(() => {
    console.log("the new array", filterdEvent);
    console.log("the Split res", eventCalender[0]?.start?.split("T")[0]);
    console.log("the old array", eventCalender);
    console.log("the dayPlanShow dayPlanShow", dayPlanShow);
  }, [eventCalender, filterdEvent]);

  //----------------------------------

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_KEY_GOOGLE,
  });

  if (loadError)
    return <div>Map cannot be loaded now, please try again later</div>;
  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div className="mapcontain">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        options={{
          gestureHandling: "greedy",
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {filterdEvent.map((place, idx) => (
          <Marker
            key={idx}
            position={place.loc}
            title={place.title}
            icon={{
              url:
                categoryIcons[place.type] ||
                "http://maps.google.com/mapfiles/kml/paddle/wht-blank.png",
              scaledSize: new window.google.maps.Size(45, 45),
              origin: new window.google.maps.Point(0, 0),
              anchor: new window.google.maps.Point(22, 45),
            }}
            label={{
              text: `${idx + 1}`,
              color: "red",
              fontSize: "30px",
              fontWeight: "bold",
            }}
            onClick={() => setSelectedEvent(place)}
          />
        ))}
      </GoogleMap>
      <div className="travelInfodiv">
        <h1>hello</h1>
      </div>
      {/* Modal that shows info about map place */}
      <Modal
        show={selectedEvent !== null}
        onHide={() => setSelectedEvent(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedEvent?.title}</Modal.Title>
          <img
            src={categoryIcons[selectedEvent?.type]}
            alt={categoryIcons[selectedEvent?.type]}
          />
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Type:</strong> {selectedEvent?.type ?? "No INFO"}
          </p>
          <p>
            <strong>Address:</strong>{" "}
            {selectedEvent?.originalData?.addressPlace ?? "No INFO"}
          </p>
          <p>
            <strong>Time to be:</strong>{" "}
            {selectedEvent?.start?.split("T")[1] ?? "No description"}
          </p>
          <p>
            <strong>Time To Leave:</strong>{" "}
            {selectedEvent?.end?.split("T")[1] ?? "No description"}
          </p>
          <p>
            <strong>Work Hours:</strong>
          </p>
          {selectedEvent?.originalData?.workHours?.map((workH, idx) => (
            <h6 key={idx}>{workH}</h6>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GoogleMapView;
