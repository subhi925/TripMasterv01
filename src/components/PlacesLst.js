import { Draggable } from "@fullcalendar/interaction";
import { useEffect, useRef, useState } from "react";
import "./PlacesLst.css";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../fire";
import axios from "axios";

//----------------------------
// COMPONENT: PlacesLst
//----------------------------
const PlacesLst = ({ places }) => {
  //----------------------------
  // STATE VARIABLES
  //----------------------------
  const [user] = useAuthState(auth); // Logged in user
  const ref = useRef(null); // DOM reference for draggable container
  const [userPreferences, setUserPreferences] = useState([]); // Saved preferences of user
  const [type, setType] = useState(""); // Selected type to filter places

  //----------------------------
  // IMAGES MAPPING: type => image URL
  //----------------------------
  const [images, setImages] = useState({
    Events:
      "https://www.eventsindustryforum.co.uk/images/articles/about_the_eif.jpg",
    Zoo: "https://m.media-amazon.com/images/M/MV5BNWU5Zjk4NDUtMjEzNy00MmEzLThhNGUtOTJiNzRjN2RmNmU5XkEyXkFqcGc@._V1_.jpg",
    Aquarium:
      "https://www.visitdubai.com/-/media/gathercontent/poi/d/dubai-aquarium-and-underwater-zoo/fallback-image/dubai-aquarium-and-underwater-zoo.jpg",
    "Amusement Park":
      "https://images.coasterpedia.net/thumb/1/1a/AmusementPark.jpg/800px-AmusementPark.jpg.webp",
    "Water Park":
      "https://www.fortlauderdalefamilyfun.com/images/water-park-paradise-cove1.gif",
    "Children's Museum":
      "https://www.priority-press.com/wp-content/uploads/2020/08/ExhibitsIconsPlaces_Exterior_Medium_035.jpg",
    "Petting Zoo":
      "https://www.newjoyfarm.com/images/petting-zoo-goat-family.jpg",
    "Trampoline Park":
      "https://www.urbanair.com/wp-content/uploads/2024/01/MG_2527.jpg.webp",
    "Mini Golf":
      "https://wildisland.com/wp-content/uploads/2024/10/3-Mini-Golf-Pricing-Attractions-1024x1024.jpg",
    Playground:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsByUFFR6UAmSiZc9XqCNh6DQcD-w0U3PvgA&s",
    "Bowling Alley":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNuUGj8fGUkrvwVbv6N1UqGVyauwl0y8Eh4Q&s",
    "Ice Skating Rink":
      "https://kwikrinksyntheticice.com/wp-content/uploads/2020/11/AdobeStock_235916829-scaled-1.jpeg",
    Winery:
      "https://cdn2.hubspot.net/hubfs/462842/Content%20-%20Inbound/Blogs/BLOG%20-%205%20Things%20Winning%20Wineries%20Get%20Right.jpg",
    "Hot Air Balloon Ride":
      "https://balloonrides.com/wp-content/uploads/2018/05/napa-hot-air-balloon-rides-napa-1.jpg",
    Spa: "https://0e9d299e890b0f46f43d-3dd2c92c26268727c0280f27b5b17857.ssl.cf1.rackcdn.com/responsive/4:3/Native/u/spa/s_spa_towels_and_stones.jpg",
    "Romantic Tour":
      "https://www.walkerstours.com/wp-content/uploads/2016/02/Sri-Lanka-Honeymoon-1.jpg",
    "Boat Tour":
      "https://www.dellsboats.com/wp-content/uploads/2023/05/homepage-hero-1.png",
    Cafe: "https://fruitbasket.limepack.com/blog/wp-content/uploads/2024/03/pexels-jason-toevs-2068296.jpg",
    "Escape Room":
      "https://media.tacdn.com/media/attractions-splice-spp-674x446/12/5c/31/6d.jpg",
    "VR Gaming Center": "https://www.losvirtuality.com/assets/img/nor.webp",
    "Go-Kart Track":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsOBfHAhtlSb7vp6Q9wmxOih0hkbFpXihQ8g&s",
    "Rock Climbing Gym":
      "https://gripped.com/wp-content/uploads/2018/02/Climbing-Gym.jpg",
    "Laser Tag":
      "https://edisonsfun.com/wp-content/uploads/2023/06/Laser-Tag-683x1024.jpg",
    Arcade:
      "https://www.duinrell.com/media/112/EN/Tekst%20+%20carrousel/37441/media/original/800x600-arcade-intro-06.png?d=1749116066",
    "Skating Park":
      "https://i.pinimg.com/originals/84/cc/07/84cc07e1d367294f7456e06bfe4de398.png",
    "Scuba Diving Center":
      "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/d3/33/e2/caption.jpg?w=500&h=400&s=1",
    "Skydiving Center":
      "https://wisconsinskydivingcenter.com/wp-content/uploads/2023/03/wisconsin-skydiving-center-hero-s.jpg",
    Rafting:
      "https://www.visitscotland.com/binaries/content/gallery/visitscotland/cms-images/2022/08/29/river-findhorn-rafting-ace-1.jpg",
    "Snorkeling Tour":
      "https://www.nomadnaturetravel.com/wp-content/uploads/2023/02/26-1024x512.webp",
    "Bungee Jumping":
      "https://cdnp.flypgs.com/files/Ekstrem_Sporlar/bungee-jumping-nedir.jpg",
    "ATV Tours":
      "https://www.theparisvillas.com/wp-content/uploads/2025/02/ATV-pic.jpeg",
    "Adventure Sports":
      "https://oigoa.com/wp-content/uploads/Adventure-Sports.jpg",
    Paragliding:
      "https://skywings.ch/wp-content/uploads/2023/07/skywings-paragliding-3-to-4-077.jpg",
    "Kite Surfing":
      "https://res.cloudinary.com/manawa/image/upload/v1682515561/articles/62409/Kite_auto_x2_2_s9qqhm.jpg",
    "Nature Reserve":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRg1IjIt2aotuX2BQCM-qyAkxoaR9hG6V9j5w&s",
    "Botanical Garden":
      "https://www.marthastewart.com/thmb/4OT1VHzcUUO9a5kgkPoi7UKzeIk=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/ms-botanical-garden-133179981cc14130b336457b71712103.jpeg",
    "Hiking Area":
      "https://aipsafety.com/wp-content/uploads/2023/04/Hiking-in-Alberta-AIP-Safety-e1681996212911.jpg",
    "Camping Area":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_hIj4WY1eD5f5cJTHmLhUqimzDlVgK_XaIQ&s",
    Beach:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Beach_at_Fort_Lauderdale.jpg/1200px-Beach_at_Fort_Lauderdale.jpg",
    Lake: "https://cdn.britannica.com/97/158797-050-ABECB32F/North-Cascades-National-Park-Lake-Ann-park.jpg?w=400&h=300&c=crop",
    Mountain:
      "https://cdn.pixabay.com/photo/2015/12/01/20/28/mountain-1072828_960_720.jpg",
    Park: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Green_Park%2C_London_-_April_2007.jpg/1200px-Green_Park%2C_London_-_April_2007.jpg",
    Museum:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Metropolitan_Museum_of_Art_%28The_Met%29_-_Central_Park%2C_NYC.jpg/960px-Metropolitan_Museum_of_Art_%28The_Met%29_-_Central_Park%2C_NYC.jpg",
    "Art Gallery":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3Ri9x49CdiHRf7QFvhEO0-ShFXZdMSIx_Wg&s",
    "Cultural Center":
      "https://assets.newatlas.com/dims4/default/fe607d9/2147483647/strip/true/crop/4000x2000+0+0/resize/2880x1440!/format/webp/quality/90/?url=https%3A%2F%2Fnewatlas-brightspot.s3.amazonaws.com%2Fa3%2Fc2%2F6f2efc154d7fb9f3e23c525ac6a7%2F03-sanya-cultural-district-render-by-negativ.jpg",
    "Historical Site":
      "https://miro.medium.com/v2/resize:fit:1400/0*j_qo-lsqVtRWjB7Y.jpg",
    Restaurant:
      "https://assets.hrewards.com/assets/jpg.xxlarge_SHR_Hamburg_restaurant_Stadthaus_8_0d111ed2f6.jpg?optimize",
    "Kosher Restaurant":
      "https://chabad.ae/wp-content/uploads/2021/04/WhatsApp-Image-2023-01-18-at-13.04.57-1.jpeg",
    "Halal Restaurant":
      "https://restaurantbasmati.com/wp-content/uploads/2023/12/halal.jpeg",
    "Vegetarian Restaurant":
      "https://ychef.files.bbci.co.uk/1280x720/p078rppm.jpg",
    "Vegan Restaurant":
      "https://images.squarespace-cdn.com/content/v1/571898482b8dde43af06c296/a5fe6891-4d1b-47be-851d-e3267acea677/vegan+restaurant+La+Jolla+San+Diego.jpg",
    "Shopping Mall":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTXSsWMyXpT3jg64Om7Q3SkTOg5QYzRJXH_pg&s",
    "Street Food":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSune3z6Y2lhtAy8b16vNrm6vy9eCX6I8H-dQ&s",
    "Religious Site":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPH5Ky0qwuoGzduP0GKhXEDur3Xb1N-4b4ew&s",
    "Skate Park":
      "https://www.funinjerusalem.com/wp-content/uploads/2020/01/Will.jpg",
    "Fine Dining":
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR__WQDCuN_ELc5v4AS7IbMo1pcsM--oAL_bQ&s",
    "Local Market":
      "https://cdn.prod.website-files.com/610bede8715eba650a9f7a4d/615327829b5e400e08d8c1a9_Angle%20View%20Local%20Market%20Bryson%20City.jpeg",
  });

  //----------------------------
  // EFFECT: Enable FullCalendar Draggable
  //----------------------------
  useEffect(() => {
    new Draggable(ref.current, {
      itemSelector: ".fc-event", // Only draggable items
      eventData: function (eventEl) {
        // Convert data-event attribute to JSON
        const data = JSON.parse(eventEl.getAttribute("data-event"));
        return data;
      },
    });
  }, []);

  //----------------------------
  // FUNCTION: checkIfTherePreferences
  // Fetch saved user preferences from server
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
          setUserPreferences([...preferences]); // Set preferences array
        } else {
          console.log("Invalid Format");
        }
      }
    } catch (err) {
      console.log("Error Fetching");
    }
  };

  //----------------------------
  // EFFECT: Load preferences when user logs in
  //----------------------------
  useEffect(() => {
    const fetchPreferencesStatus = async () => {
      if (user) {
        await checkIfTherePreferences(user.uid);
      }
    };
    fetchPreferencesStatus();
  }, [user]);

  //----------------------------
  // EFFECT: Reset type when places change
  //----------------------------
  useEffect(() => {
    setType(""); // Reset selected type when new places list is loaded
  }, [places]);

  //----------------------------
  // FUNCTION: singleType
  // Filter unique types from places array
  //----------------------------
  const singleType = (places) => {
    let filtered = [];
    places.map((p) => {
      if (!filtered.includes(p.type)) filtered.push(p.type);
    });
    console.log("filtered", filtered);
    return filtered; // Return array of unique types
  };

  //----------------------------
  // FUNCTION: singleType2 (alternative)
  // Another way to get unique types
  //----------------------------
  const singleType2 = (places) => {
    const types = places.map((p) => p.type);
    const filtered = [...new Set(types)]; // Unique types
    console.log("filtered", filtered);
    return filtered;
  };

  //----------------------------
  // JSX RETURN
  //----------------------------
  return (
    <div className="sidebar" ref={ref}>
      {/* Dropdown to filter places by type */}
      <select
        className="typeofplace"
        value={type}
        onChange={(e) => setType(e.target.value)}>
        <option value="">All Places</option>
        {singleType2(places).map((p, idx) => (
          <option key={idx} value={p}>
            {p}
          </option>
        ))}
      </select>

      {/* Display places */}
      {(type === ""
        ? places
        : places.filter((place) => place.type === type)
      ).map((place, idx) => (
        <div
          key={idx}
          className="fc-event" // Makes draggable
          data-event={JSON.stringify({
            id: place.id,
            title: place.name,
            type: place.type,
            arrivalTime: place.arrivalTime || "",
            description: place.description || "",
            photo: place.image || "",
            loc: place.loc,
            originalData: place,
          })}
          style={{
            background: "white",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "9px",
            cursor: "grab",
          }}>
          {/* Place image */}
          <img
            src={images[place.type]}
            alt={place.type}
            style={{ width: "100%", borderRadius: "6px", marginBottom: "8px" }}
          />
          <h6>{place.name}</h6> {/* Place name */}
          <p>{place.type}</p> {/* Place type */}
        </div>
      ))}
    </div>
  );
};

export default PlacesLst;
