# Premium NotesApp - Full Stack Note-Taking Solution

A clean, modern, and highly responsive note-taking application built with the **MERN Stack** (MongoDB, Express, React, Node.js). This project features a robust state management system using Redux Toolkit, comprehensive Internationalization (i18n), and a professional UI that fluidly adapts to all screen sizes.

## ✨ Key Features

- **Full CRUD Functionality:** Create, Read, Update, and Delete notes seamlessly.
- **Multi-language Support (i18n):** Fully localized interface supporting English, Burmese (မြန်မာ), and Thai (ไทย) with a sleek custom language dropdown menu.
- **Bulk Selection & Actions:** Use the "Select All" feature or selectively check notes to effortlessly perform bulk operations (Archive, Trash, Restore).
- **Advanced Responsive Design:** Intelligent layouts specifically optimized for Mobile, Tablet, and Desktop breakpoints, ensuring perfect grid spacing and preventing sidebar overlaps on smaller screens.
- **Note Management:** Organized system with dedicated views for **All Notes**, **Archive**, and **Trash**.
- **Advanced State Management:** Utilizes **Redux Toolkit** for consistent data flow and real-time UI updates.
- **Search & Sort:** Easily find notes with the search bar and sort them by date (Latest), alphabetically (A-Z), or by completion status (Done/Not Done).
- **Modern UI/UX:** Premium dark-themed interface with glassmorphism effects, smooth CSS transitions, and intuitive micro-animations.

## 🛠️ Tech Stack

- **Frontend:** React.js, Redux Toolkit, `react-i18next`, Vanilla CSS (Custom Modules), Bootstrap Icons.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB Atlas (Cloud Database).

## 📂 Project Structure

```text
premium-note-taking-app/
├── backend/            # Express server and REST API logic
├── frontend/           # React application and Redux store
├── .gitignore          # Git ignore file (node_modules, .env, etc.)
└── README.md           # Project documentation
```

## 🚀 Installation & How to Run

Follow these steps to set up the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/) instance running locally or a MongoDB Atlas URI.

### 1. Clone the Repository
```bash
git clone https://github.com/myotunaungdev-pro/premium-note-taking-app.git
cd premium-note-taking-app
```

### 2. Setup the Backend
Navigate to the `backend` directory, install dependencies, and run the server.
```bash
cd backend
npm install
```
*Note: Ensure you create a `.env` file inside the `backend` folder with your `PORT` (default 8000) and `MONGO_URI`.*

```bash
# Start the backend development server
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window, navigate to the `frontend` directory, install dependencies, and start the React app.
```bash
cd frontend
npm install --legacy-peer-deps
```

```bash
# Start the frontend development server
npm start
```

### 4. Open the App
The React app will automatically open in your browser at `http://localhost:3000`. It will smoothly communicate with your backend running on `http://localhost:8000`.

## 💡 Usage

- **Creating a Note:** Click the "New Note" button in the header. Add a title, content, and select a tag.
- **Bulk Actions:** Hover over any note card and click the checkbox in the top right corner. A bulk-action toolbar will appear in the header, allowing you to archive, trash, or restore multiple notes simultaneously.
- **Changing Languages:** Click the globe icon in the top right corner of the header to open the language dropdown and select your preferred native language.