**Documentation :**
1. Installation and Setup Guide
  1.1 Prerequisites
    •	Node.js v18+ (LTS recommended)
    •	MongoDB Atlas account
    •	Git
    •	npm v9+

  1.2 Clone the Repository
      git clone https://github.com/yourusername/pulse-mini-project.git
      cd pulse-mini-project

  1.3 Backend Setup
    1.	Navigate to Backend folder: cd Backend
    2.	Install dependencies: npm install
    3.	Create .env file in Backend/:
          MONGO_URI=your_mongodb_connection_string_here
          PORT=5000
          JWT_SECRET=your_secret_key_here
          FRONTEND_URL=http://localhost:5173 or whatever port you use
    4.	Start the backend server: node server.js
    5.	Expected output:
          MongoDB connected
          Server running on port 5000

  1.4 Frontend Setup
    1.	Navigate to Mini-Frontend folder: cd Mini-Frontend
    2.	Install dependencies: npm install
    3.	Create .env file in Mini-Frontend/:
          VITE_API_URL=http://localhost:5000/api or whatever port you use
          VITE_SOCKET_URL=http://localhost:5000 or whatever port you use
    4.	Start the frontend: npm run dev
    5.	Open browser at:  http://localhost:5173

  1.5 Environment Variables Reference
    Variable            Location             Description
    MONGO_URI       :  Backend/.env          MongoDB connection string
    PORT            :  Backend/.env          Backend server port
    JWT_SECRET      :  Backend/.env          Secret key for JWT signing
    FRONTEND_URL    :  Backend/.env          Allowed frontend origin for CORS
    VITE_API_URL    :  Mini-Frontend/.env    Backend 
    VITE_SOCKET_URL :  Mini-Frontend/.env    Socket.io server URL
    
2. API Documentation
    Base URL (Production):  https://pulse-backend.onrender.com/api
    Base URL (Development): http://localhost:5000/api or whatever port you use

  2.1 Authentication Endpoints
    POST /auth/register
      •	Register a new user account.
      •	Request Body: { "name": "Rushabh", "email": "r@gmail.com", "password": "Test1234" }
      •	Response (201): { "message": "User registered successfully" }

    POST /auth/login
      •	Login with existing credentials.
      •	Request Body: { "email": "r@gmail.com", "password": "Test1234" }
      •	Response (200): { "token": "eyJhbGci...", "user": { "id": "...", "name": "Rushabh", "role": "user" } }
      
  2.2 Video Endpoints
    Method	Endpoint	          Auth Required	    Description
    GET	    /videos	            No (Public)      	Get all videos with uploader info
    POST	  /videos/upload	    Yes (User/Admin)	Upload a new video file
    GET	    /videos/stream/:id	No (Public)	      Stream video with range request support
    PUT	    /videos/:id	Yes     (Owner/Admin)	    Rename a video
    DELETE	/videos/:id	Yes     (Owner/Admin)	    Delete a video

  POST /videos/upload
    •	Upload a video file. Requires Authorization header.
    •	Headers: Authorization: Bearer <token>
    •	Content-Type: multipart/form-data
    •	Body: video: <file> (MP4, MOV, AVI, MKV - max 100MB)
    •	Response (200): { "_id": "...", "filename": "1712345-video.mp4", "originalname": "video.mp4", "status": "processing", "sensitivity": "pending", "uploadedBy": "..." }

  GET /videos/stream/:id
    •	Stream video content using HTTP range requests for efficient playback.
    •	Headers (optional): Range: bytes=0-500000
    • Response (206 Partial Content):
        Content-Range: bytes 0-500000/5000000
        Content-Type: video/mp4

  2.3 Admin Endpoints: All admin endpoints require Authorization header with Admin role token.
    Method	Endpoint	              Description
    GET	    /admin/users	          Get all registered users (passwords excluded)
    PUT	    /admin/users/:id/role	  Change a user's role (user/admin)
    DELETE	/admin/users/:id	      Delete a user account

3. User Manual
  3.1 Guest User (Not Logged In)
    1.	Open the application in your browser.
    2.	Browse the All Feed — all uploaded videos are visible.
    3.	Click the Play button on any Safe video to watch it.
    4.	Flagged videos are not playable for guest users.
    5.	Use the Search bar at the top to filter videos by name.

  3.2 Registering an Account
    1.	Click the Login / Sign up button in the top right corner.
    2.	Switch to the Register tab in the dialog.
    3.	Enter your Name, Email, and Password.
    4.	Click Register.
    5.	Switch back to the Login tab and sign in with your credentials.

  3.3 Logged In User
    1.	An Upload Video button appears at the top center of the page to select a video file from your device.
    2.	After upload, the video appears in the feed with Processing status.
    3.	Switch to My Feed tab to see only your uploaded videos.
    4.	On My Feed, each video card shows Edit and Delete options: Click Edit to rename a video. Click Delete to remove it permanently.
    
  3.4 Admin User
    1.	Login with admin credentials: Email: Admin@google.com, Password: Admin1234
    2.	Admin can see Edit and Delete buttons on ALL videos in All Feed.
    3.	Admin can watch Flagged videos (regular users cannot).
    4.	Click the settings icon in the navbar to open User Management panel.
    5.	In the User Management panel: view all registered users.
    6.	Click the role icon to promote a user to Admin or demote Admin to User.
    7.	Click the delete icon to permanently remove a user account.
    Note: Admin cannot change their own role or delete their own account.
 
4. Architecture Overview
  4.1 Technology Stack
    Layer	        Technology	Purpose
    Runtime  	    Node.js v18 LTS	      Server-side JavaScript runtime
    Framework	    Express.js	          REST API routing and middleware
    Database    	MongoDB Atlas	        Cloud-hosted NoSQL document store
    ODM	          Mongoose	            Schema definition and MongoDB interaction
    Auth	        JWT + bcryptjs	      Stateless authentication and password hashing
    Real-Time	    Socket.io	            WebSocket-based live progress updates
    File Upload	  Multer	              Multipart form data parsing and file storage
    Frontend	    React + Vite	        Component-based UI with fast build tool
    UI Library	  Material UI (MUI)	    Pre-built React component library
    Streaming	    Node.js fs streams	  HTTP range request video streaming

  4.2 Project Folder Structure
    Pulse-mini-project/
    ├── Backend/
    │   ├── Models/
    │   │   ├── User.js          # User schema with bcrypt
    │   │   └── Video.js         # Video schema with status/sensitivity
    │   ├── Routes/
    │   │   ├── authRoutes.js    # Register and Login endpoints
    │   │   ├── videoRoutes.js   # Upload, stream, edit, delete
    │   │   └── adminRoutes.js   # User management endpoints
    │   ├── Middleware/
    │   │   └── auth.js          # JWT authenticate + isAdmin
    │   ├── uploads/             # Stored video files
    │   ├── .env                 # Environment variables
    │   └── server.js            # Entry point
    │
    └── Mini-Frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── AuthModal.jsx
    │   │   ├── UploadSection.jsx
    │   │   ├── VideoFeed.jsx
    │   │   └── AdminPanel.jsx
    │   ├── config.js        # API URL configuration
    │   ├── App.jsx          # Root component + state
    │   └── main.jsx         # MUI theme + entry point
    └── .env                 # Vite environment variables

  4.3 Request Flow
    Video Upload Flow:
      1.	User selects a video file in the browser.
      2.	XHR sends multipart/form-data POST to /api/videos/upload with JWT in header.
      3.	authenticate middleware verifies the JWT token.
      4.	Multer saves the file to the uploads/ folder.
      5.	Video document created in MongoDB with status: processing.
      6.	Socket.io emits videoStatus events every second with progress 0-100.
      7.	After few seconds, status updates to completed, sensitivity set to safe/flagged.
      8.	Frontend receives Socket.io events and updates UI in real-time.

  Video Streaming Flow:
      1.	User clicks Play on a Safe video.
      2.	Browser renders HTML <video> tag with src pointing to /api/videos/stream/:id.
      3.	Browser automatically sends HTTP Range request header (e.g. bytes=0-).
      4.	Backend reads the range, creates a readable stream for that byte range.
      5.	Backend responds with 206 Partial Content and streams the chunk.
      6.	Browser plays the chunk and requests the next range as needed.

  4.4 Authentication Flow
      1.	User submits login form with email and password.
      2.	Backend finds user by email in MongoDB.
      3.	bcrypt.compare() verifies entered password against stored hash.
      4.	On success, jwt.sign() creates a token containing userId and role.
      5. Token returned to frontend and stored in localStorage.
      6.	Every subsequent request includes Authorization: Bearer <token> header.
      7.	authenticate middleware calls jwt.verify() to decode and validate.
      8.	Decoded payload (userId, role) attached to req.user for route handlers.

  4.5 Role-Based Access Control
    Feature	               Guest    User  	  Admin
    Watch safe videos	       ✓	     ✓	       ✓
    Upload videos	           ✘	     ✓	       ✓
    Edit own videos	         ✘	     ✓	       ✓
    Delete own videos	       ✘	     ✓	       ✓
    Watch flagged videos	   ✘	     ✘	       ✓
    Edit others videos	     ✘	     ✘	       ✓
    Delete others videos	   ✘	     ✘	       ✓
    User management	         ✘	     ✘	       ✓
