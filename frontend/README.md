# DriversKlub Frontend

This is the frontend application for the **DriversKlub** project, built using **React** with **Vite**. The application communicates with the backend via an **API Gateway**.

---

## Project Structure

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

---

## Setup Instructions

1. **Clone the repository**:
```bash
git clone https://github.com/AnuJ221011/driversklub-frontend.git
cd driversklub-frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development server**:
```bash
npm run dev
```

4. **Build the production version**:
```bash
npm run build
```

## Notes

- The src/api folder contains Axios wrappers for interacting with the backend API via the API Gateway.

- The src/components folder has reusable UI components like Button, Loader, Navbar, and Sidebar.

- The src/features folder groups feature-specific logic, such as trips, drivers, vehicles, notifications, and assignments.

- Pages under src/pages are top-level route components.

- Global helpers and constants are in src/utils.

## License

MIT License

Copyright (c) 2025 TriboreFin LLC