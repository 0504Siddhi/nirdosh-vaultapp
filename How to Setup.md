# How to Setup Nirdosh Vault Locally

Welcome to the Nirdosh Vault project! Follow this guide to clone the repository and get the application running on your local machine.

## Prerequisites

Before you start, make sure you have the following installed on your computer:
1. **[Git](https://git-scm.com/downloads)** - For cloning the repository.
2. **[Node.js](https://nodejs.org/en/download/) (v18 or higher)** - Required to run the frontend and backend servers.
3. **[Python 3.8+](https://www.python.org/downloads/)** *(Optional but recommended)* - Required if you want the PaddleOCR extraction fallback to work. The system will fall back to Gemini if this is not present.

## Step 1: Clone the Repository

Open your terminal or command prompt and run the following command to clone the project:

```bash
git clone https://github.com/0504Siddhi/nirdosh-vault.git
cd nirdosh-vault
```

## Step 2: Configure Environment Variables

1. **Backend Configuration (`api/.env`)**:
   - Create a file named `.env` in the `api` folder (you can copy `api/.env.example`).
   - Add your Gemini API key and optional Google Maps API Key:

```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

2. **Frontend Configuration (`ui/.env`)**:
   - Create a file named `.env` in the `ui` folder (you can copy `ui/.env.example`).
   - Add your Google Maps API key for the interactive Nearby Assistance map:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

*(Note: If no Google Maps API key is provided, the application will automatically fall back to an interactive embed map mode.)*


## Step 3: Run the Setup Script (Windows Only)

We have provided an automated setup script that will install all dependencies and start both the frontend and backend servers for you.

Simply **double-click** the `setup.bat` file in the root of the project folder, or run it from the command prompt:

```bash
setup.bat
```

The script will:
1. Install backend dependencies (`npm install` inside the `api` folder).
2. Install frontend dependencies (`npm install` inside the `ui` folder).
3. Open two new terminal windows—one for the backend API and one for the frontend UI.

## Step 4: Access the Application

Once the setup script finishes and the servers are running, you can access the application in your browser:

- **Frontend UI:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3000](http://localhost:3000)

---

### Running Manually (Mac/Linux or without `setup.bat`)

If you prefer to start the servers manually or are not using Windows, follow these steps:

**1. Start the Backend:**
```bash
cd api
npm install
npm run dev
```

**2. Start the Frontend (in a new terminal):**
```bash
cd ui
npm install
npm run dev
```

### Stopping the Servers
If you used `setup.bat`, simply close the two command prompt windows that opened. If running manually, press `Ctrl + C` in the terminals where the servers are running.
