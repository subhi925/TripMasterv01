# 🌍 TripMaster v0.1

**TripMaster** is a modern and user-friendly web application designed for planning and organizing **adventure trips** around the world.  
It combines a **React.js frontend**, a **PHP backend**, and a **MySQL database** to give travelers a seamless platform to **build, manage, and share** their trip plans — all in one place.

---

## 🧠 Overview

TripMaster helps users:
- 🌎 Explore and plan trips to destinations worldwide  
- 📝 Add trip details such as activities, locations, and dates  
- 🗂️ View and edit saved trips  
- 🔗 Connect the React frontend with the PHP backend via RESTful APIs  
- 💌 Match with other travelers via email (currently functional)  
- 🎁 Get “Surprise Trip” suggestions for spontaneous adventures  

🚀 **Future versions** will include:  
- 🤖 AI-based personalized recommendations  
- 💬 Real-time chat between matched travelers  
- 👥 Group trip management and event scheduling  
- 🌐 Social features like shared itineraries and feedback

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React.js, JavaScript (ES6+), HTML, CSS |
| **Backend / API** | PHP |
| **Database** | MySQL (via `config.php`) |
| **Development Tools** | npm, GitHub, Local PHP Server |

---

## 🚀 Features

- 🗂️ Create, edit, and manage trips  
- 🎨 Clean and modern interface with custom styling  
- 🔗 Smooth integration between React and PHP  
- 💌 Traveler matching system via email  
- 🎁 “Surprise Me” feature that generates random trip ideas  
- ⚙️ Easy setup and configuration for developers  
- 🗂️ Organized folder structure for scalability  

---

## 🔧 Getting Started

### 🧑‍💻 Prerequisites

Make sure you have installed:
- **Node.js** and **npm**  
- **PHP 8+**  
- **MySQL** or **MariaDB**  
- A local server environment such as **XAMPP**, **Laragon**, or **WAMP**

---

### ⚙️ Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/subhi925/TripMasterv01.git

2. **Set up the backend**
   - Open `config.php` and update your database credentials:
     ```php
     $host = "localhost";
     $user = "root";
     $password = "";
     $database = "tripmaster";
     ```
   - Then start your PHP local server:
     ```bash
     php -S localhost:8000
     ```

3. **Set up the frontend**
   ```bash
   cd src
   npm install
   npm start
   ```
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production**
   ```bash
   npm run build
   ```

---

## 🗂️ Project Structure

```
TripMasterv01/
│
├── public/                # Static frontend files
├── src/                   # React source code
├── config.php             # Backend database configuration
├── init.php               # Backend bootstrap setup
├── package.json           # Frontend dependencies
├── .gitignore
└── README.md
```

---

## 🔗 Example API Routes

| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/api/trips` | Fetch all trips |
| GET | `/api/trips/:id` | Get trip by ID |
| POST | `/api/trips` | Create a new trip |
| PUT | `/api/trips/:id` | Update trip details |
| DELETE | `/api/trips/:id` | Delete trip |

*(Update these routes based on your actual PHP files.)*

---

## 🧩 Roadmap

- 🔐 Add authentication (login & register)  
- 📱 Make the design fully responsive  
- 🗺️ Integrate Google Maps API  
- 🧮 Add trip filtering & sorting  
- 👫 Enable group trip creation  
- 🎁 Improve “Surprise Me” destination feature (✅ basic version working)  
- 💌 Enhance traveler matching system (✅ currently via email)  
- 💬 Add real-time chat between matched users  
- ☁️ Cloud-based trip sharing between users  

---

## 👨‍💻 Developer

**Developed by:** [Subhi Mouhammed Hamed](https://github.com/subhi925)  
🌍 Passionate about travel, adventure, and web development.  
📧 *Connect with me on GitHub for collaboration or feedback.*

---

## 📄 License

This project is licensed under the **MIT License** —  
you are free to use, modify, and distribute it with proper credit to the author.

---

⭐ **If you like this project, give it a star on GitHub!**
