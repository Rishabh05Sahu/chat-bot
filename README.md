# Gemini Voice Todo App

## Overview

The **Gemini Voice Todo App** is a voice-controlled task manager that allows users to create, read, update, and delete (CRUD) todo items using multimodal live voice input. The app leverages Google's Gemini AI for voice interactions and integrates with a MongoDB backend to store todo items.

## Features

* **Voice-Powered Todo Management** – Users can manage tasks using voice commands.
* **Real-Time Connection Status** – Displays live connection and mute status.
* **Interactive UI** – Smooth animations using Framer Motion and GSAP.
* **REST API Backend** – CRUD operations powered by Express.js and MongoDB.
* **Responsive Design** – Built with TailwindCSS for a modern look.

## Tech Stack

### Frontend

* **React 19** – Modern UI framework
* **Vite** – Fast development server
* **TailwindCSS** – Utility-first styling
* **Framer Motion** – Animation library
* **Axios** – HTTP requests to backend
* **Gemini Multimodal Live Voice Only** – Voice AI integration

### Backend

* **Node.js & Express.js** – API server
* **MongoDB & Mongoose** – Database & ODM
* **dotenv** – Environment variable management
* **CORS** – Cross-origin request handling

---

## Project Setup

### Prerequisites

Ensure you have the following installed:

* **Node.js** (v16 or later)
* **MongoDB** (running locally or cloud-based)

### Environment Variables

Create a `.env` file in the root of the **backend** directory and add:

```env
PORT=5000  
MONGODB_URI=your_mongodb_connection_string  
```

For the  **frontend** , create a `.env` file in the root of the frontend directory and add:

```env
VITE_SERVER_URL=http://localhost:5000  
VITE_GEMINI_API_KEY=your_google_gemini_api_key  
```

---

## Installation & Running

### Backend

```sh
cd server  
npm install  
node server.js
```

### Frontend

```sh
npm install  
npm run dev  
```

Then open the app in your browser at **[http://localhost:5173](http://localhost:5173/)** (default Vite port).

---

## API Endpoints

### 1. Create a Todo

**POST** `/todos`

```json
{
  "text": "Buy groceries"
}
```

### 2. Get All Todos

**GET** `/todos`

### 3. Update a Todo

**PUT** `/todos/:id`

```json
{
  "text": "Buy groceries and cook dinner",
  "completed": true
}
```

### 4. Delete a Todo

**DELETE** `/todos/:id`

---

## Project Structure

```
📂 gemini-voice-todo-app  
 ├── 📂 server  
 │   ├── 📂 models  
 │   │   └── todo.js  
 │   ├── server.js  
 │   ├── .env  
 │   ├── package.json  
 │   └── ...  
 ├── 📂 src  
 │   ├── 📂 components  
 │   │   ├── TodoList.jsx  
 │   │   ├── api.js  
 │   │   └── RoboAvatar.jsx  
 │   ├── App.jsx  
 │   ├── main.jsx  
 │   └── ...  
 ├── .env  
 ├── vite.config.js  
 ├── package.json  
 └── ...  
```

---

## Contributions

Contributions are welcome! Feel free to fork this repository and submit a pull request.
