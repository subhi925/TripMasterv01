# 🌍 TripMaster v0.1

**TripMaster** is a modern web application for planning and organizing adventure trips around the world.  
It combines a **React.js frontend** with a **PHP backend** and database support, allowing travelers to build, manage, and share trip plans in one place.

---

## 🧠 Overview

TripMaster helps users:
- Explore and plan trips to different destinations  
- Add trip details such as activities, locations, and dates  
- View and edit saved trips  
- Connect frontend and backend via RESTful APIs  

Future versions will include advanced features such as friend matching, surprise trip suggestions, and personalized recommendations based on user preferences.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js, JavaScript, HTML, CSS |
| **Backend / API** | PHP |
| **Database** | MySQL (via `config.php`) |
| **Hosting / Tools** | npm, GitHub |

---

## 🚀 Features

- 🗺️ Create and manage trips  
- 🎨 User-friendly interface with new styling  
- 🔗 React–PHP integration  
- 📦 Organized project structure for scalability  
- ⚙️ Easy setup and configuration  

---

## 🔧 Getting Started

### Prerequisites

Make sure you have the following installed:
- Node.js and npm  
- PHP 8+  
- MySQL or MariaDB  
- A local server environment such as XAMPP, Laragon, or WAMP  

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/subhi925/TripMasterv01.git
   cd TripMasterv01

   Set up the backend

Open config.php and update your database credentials:
$host = "localhost";
$user = "root";
$password = "";
$database = "tripmaster";


Run your local PHP server (for example):
php -S localhost:8000
Set up the frontend
cd src
npm install
npm start
Open http://localhost:3000
 in your browser.

Build for production
npm run build

Project Structure
TripMasterv01/
│
├── public/                # Static frontend files
├── src/                   # React app source code
├── config.php             # Backend database config
├── init.php               # Backend bootstrap
├── package.json           # Frontend dependencies
├── .gitignore
└── README.md

🔗 API Routes (Examples)
Method	Endpoint	Description
GET	/api/trips	Get all trips
GET	/api/trips/:id	Get trip by ID
POST	/api/trips	Create new trip
PUT	/api/trips/:id	Update trip
DELETE	/api/trips/:id	Delete trip

(Update these routes based on your actual PHP API files.)
🧩 Roadmap

 Add authentication (login & register)

 Responsive mobile design

 Integrate Google Maps API

 Trip filtering & sorting

 Group trip creation

 “Surprise me” random destination feature

 Trip sharing between users

 📬 Contact

Developed by Subhi Mouhammed Hamed
GitHub: https://github.com/subhi925

📄 License

This project is licensed under the MIT License — you are free to use, modify, and distribute it with proper credit.



