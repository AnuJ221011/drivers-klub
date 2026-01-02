# DriversKlub Frontend

This is the frontend application for the **DriversKlub** project, built using **React** with **Vite**.  
The application communicates with the backend via an **API Gateway**.

---

## 📁 Project Structure

.
├── package.json
├── vite.config.js
├── index.html
├── public/ # Static assets (images, fonts, icons, etc.)
├── src/
│ ├── main.jsx # App entry point
│ ├── index.css # Global CSS
│ ├── App.jsx # Main App component
│ ├── App.css # App-level CSS
│ ├── api/ # API request modules (axios wrappers)
│ │ ├── axios.js
│ │ ├── auth.api.js
│ │ ├── driver.api.js
│ │ ├── trip.api.js
│ │ ├── vehicle.api.js
│ │ ├── notification.api.js
│ │ └── assignment.api.js
│ ├── assets/ # Images, fonts, icons
│ ├── components/ # Reusable UI components
│ │ ├── Button.jsx
│ │ ├── Input.jsx
│ │ ├── Loader.jsx
│ │ ├── Navbar.jsx
│ │ └── Sidebar.jsx
│ ├── features/ # Feature-specific modules
│ │ ├── assignments/
│ │ ├── notifications/
│ │ ├── trips/
│ │ └── vehicles/
│ ├── pages/ # Top-level pages/routes
│ │ ├── Dashboard.jsx
│ │ ├── DriversPage.jsx
│ │ ├── LoginPage.jsx
│ │ ├── TripsPage.jsx
│ │ └── VehiclesPage.jsx
│ └── utils/ # Helper functions
│ ├── auth.js # Authentication helpers
│ └── constants.js # Constant values
└── README.md

yaml
Copy code

---

## 🧠 Notes

- The `src/api` folder contains **Axios wrappers** for interacting with the backend through the **API Gateway**.
- The `src/components` folder contains **reusable UI components** such as buttons, loaders, navigation bars, and sidebars.
- The `src/features` folder groups **feature-specific logic** like trips, drivers, vehicles, notifications, and assignments.
- The `src/pages` folder contains **route-level components** (full pages).
- Shared utilities and constants are maintained inside `src/utils`.

---

## 📄 Feature Docs

- **Admin Dashboard (`AdminHome`)**: see `ADMIN_HOME.md`

---

## 📜 License

MIT License

---

© 2025 **TriboreFin LLC**