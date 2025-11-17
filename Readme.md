# Video Platform Backend API

A production-grade RESTful API backend for a video streaming platform, built with Node.js and Express. This application provides comprehensive functionality for video management, user authentication, comments, likes, subscriptions, playlists, and more.

## 🚀 Features

- **User Management**: Complete user registration, authentication, and profile management
- **Video Management**: Upload, update, delete, and manage video content with thumbnails
- **Authentication & Authorization**: JWT-based authentication with access and refresh tokens
- **Comments System**: Add, update, and delete comments on videos
- **Like System**: Like/unlike videos, comments, and tweets
- **Subscription System**: Subscribe/unsubscribe to channels and manage subscriptions
- **Playlist Management**: Create, update, and manage video playlists
- **File Upload**: Cloudinary integration for video and image storage
- **Error Handling**: Comprehensive error handling with custom error classes
- **Security**: Password hashing, JWT tokens, and secure cookie management

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Security**: bcrypt for password hashing, cookie-parser
- **Utilities**: 
  - mongoose-aggregate-paginate-v2 (for pagination)
  - dotenv (environment variables)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud instance like MongoDB Atlas)
- Cloudinary account (for file storage)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/salisai/youtube-backend-api.git
   cd VideoPlatform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=8000
   
   # MongoDB Configuration
   MONGODB_URL=mongodb://localhost:27017
   # Or for MongoDB Atlas:
   # MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net
   
   # JWT Configuration
   ACCESS_TOKEN_SECRET=your_access_token_secret_here
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_EXPIRY=10d
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

4. **Create necessary directories**
   ```bash
   mkdir -p public/temp
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:8000` (or the port specified in your `.env` file).

## 📁 Project Structure

```
VideoPlatform/
├── index.js                 # Application entry point
├── package.json            # Dependencies and scripts
├── .env                    # Environment variables (not in git)
├── public/                 # Public assets
│   └── temp/              # Temporary file uploads
├── src/
│   ├── app.js             # Express app configuration
│   ├── constants.js       # Application constants
│   ├── db/
│   │   └── index.js       # MongoDB connection
│   ├── models/            # Mongoose models
│   │   ├── user.model.js
│   │   ├── video.model.js
│   │   ├── comment.model.js
│   │   ├── like.model.js
│   │   ├── subscription.model.js
│   │   └── playlist.model.js
│   ├── controllers/       # Route controllers
│   │   ├── user.controller.js
│   │   ├── video.controller.js
│   │   ├── comment.controller.js
│   │   ├── like.controller.js
│   │   ├── subscription.controller.js
│   │   ├── playlist.controller.js
│   │   ├── dashboard.controller.js
│   │   └── healthcheck.controller.js
│   ├── routes/            # Express routes
│   │   ├── user.routes.js
│   │   ├── video.routes.js
│   │   ├── comment.routes.js
│   │   ├── like.routes.js
│   │   ├── subscription.routes.js
│   │   ├── playlist.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── healthcheck.routes.js
│   │   └── tweet.routes.js
│   ├── middlewares/       # Custom middlewares
│   │   ├── auth.middleware.js
│   │   └── multer.middleware.js
│   └── utils/             # Utility functions
│       ├── ApiError.js
│       ├── ApiResponse.js
│       ├── asynchandlers.js
│       └── cloudinary.js
└── README.md
```

## 🔌 API Endpoints

### Health Check
- `GET /api/v1/healthcheck` - Check API health status

### User Routes (`/api/v1/users`)
- `POST /register` - Register a new user (with avatar and cover image)
- `POST /login` - User login
- `POST /logout` - User logout (protected)
- `POST /refresh-token` - Refresh access token
- `POST /change-password` - Change password (protected)
- `GET /current-user` - Get current user profile (protected)
- `PATCH /update-account` - Update account details (protected)
- `PATCH /avatar` - Update user avatar (protected)
- `PATCH /cover-image` - Update cover image (protected)
- `GET /c/:username` - Get user channel profile (protected)
- `GET /history` - Get watch history (protected)

### Video Routes (`/api/v1/videos`)
- `GET /` - Get all videos (protected)
- `POST /` - Upload a new video (protected, requires videoFile and thumbnail)
- `GET /:videoId` - Get video by ID (protected)
- `PATCH /:videoId` - Update video details (protected)
- `DELETE /:videoId` - Delete a video (protected)
- `PATCH /toggle/publish/:videoId` - Toggle video publish status (protected)

### Comment Routes (`/api/v1/comments`)
- `GET /:videoId` - Get all comments for a video (protected)
- `POST /:videoId` - Add a comment to a video (protected)
- `PATCH /c/:commentId` - Update a comment (protected)
- `DELETE /c/:commentId` - Delete a comment (protected)

### Like Routes (`/api/v1/likes`)
- `POST /toggle/v/:videoId` - Toggle like on a video (protected)
- `POST /toggle/c/:commentId` - Toggle like on a comment (protected)
- `POST /toggle/t/:tweetId` - Toggle like on a tweet (protected)
- `GET /videos` - Get all liked videos (protected)

### Subscription Routes (`/api/v1/subscriptions`)
- `POST /c/:channelId` - Toggle subscription to a channel (protected)
- `GET /c/:channelId` - Get subscribed channels (protected)
- `GET /u/:subscriberId` - Get channel subscribers (protected)

### Playlist Routes (`/api/v1/playlists`)
- `POST /` - Create a new playlist (protected)
- `GET /:playlistId` - Get playlist by ID (protected)
- `PATCH /:playlistId` - Update playlist (protected)
- `DELETE /:playlistId` - Delete playlist (protected)
- `PATCH /add/:videoId/:playlistId` - Add video to playlist (protected)
- `PATCH /remove/:videoId/:playlistId` - Remove video from playlist (protected)
- `GET /user/:userId` - Get user playlists (protected)

### Dashboard Routes (`/api/v1/dashboard`)
- `GET /stats` - Get channel statistics (protected)
- `GET /videos` - Get all channel videos (protected)

### Tweet Routes (`/api/v1/tweets`)
- `POST /` - Create a new tweet (protected)
- `GET /user/:userId` - Get user tweets (protected)
- `PATCH /:tweetId` - Update a tweet (protected)
- `DELETE /:tweetId` - Delete a tweet (protected)

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Access Token**: Short-lived token (default: 1 day) stored in cookies or Authorization header
2. **Refresh Token**: Long-lived token (default: 10 days) stored in database and cookies

### How to Authenticate

1. **Register/Login** to get access and refresh tokens
2. **Include token** in requests:
   - Via Cookie: `accessToken` cookie (automatically sent)
   - Via Header: `Authorization: Bearer <token>`
3. **Refresh token** when access token expires using `/api/v1/users/refresh-token`

### Protected Routes

Most routes require authentication. The `verifyJWT` middleware checks for valid tokens and attaches user information to `req.user`.

## 📤 File Upload

The API supports file uploads using Multer and Cloudinary:

- **User Registration**: Avatar and cover image
- **Video Upload**: Video file and thumbnail
- **Profile Updates**: Avatar and cover image updates

Files are temporarily stored in `public/temp` before being uploaded to Cloudinary.

## 🎯 Error Handling

The API uses a custom error handling system:

- **ApiError Class**: Custom error class for structured error responses
- **Error Middleware**: Centralized error handling middleware
- **Standardized Responses**: All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [],
  "data": null
}
```

## 📝 Response Format

### Success Response
```json
{
  "statusCode": 200,
  "data": {...},
  "message": "Success message",
  "success": true
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [],
  "data": null
}
```

## 🧪 Testing

Test the API using tools like:
- Postman
- Thunder Client (VS Code extension)
- curl
- Any HTTP client

### Example: Register a User
```bash
curl -X POST http://localhost:8000/api/v1/users/register \
  -F "username=testuser" \
  -F "email=test@example.com" \
  -F "fullname=Test User" \
  -F "password=password123" \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "coverImage=@/path/to/cover.jpg"
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Secure cookie management
- CORS configuration
- Input validation
- File upload validation
- Error message sanitization

## 🚨 Common Issues & Solutions

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URL` in `.env` file
- Verify network connectivity for cloud instances

### Cloudinary Upload Fails
- Verify Cloudinary credentials in `.env`
- Check file size limits
- Ensure `public/temp` directory exists

### JWT Token Errors
- Verify `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET` are set
- Check token expiry settings
- Ensure cookies are enabled in client

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using the port

## 📚 Development

### Scripts
- `npm run dev` - Start development server with nodemon

### Code Style
- The project uses Prettier for code formatting
- Follow ES6+ JavaScript conventions
- Use async/await for asynchronous operations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Built as a practice project for learning backend development and production-grade application architecture.

## 🔮 Future Enhancements

- [ ] Rate limiting
- [ ] Input validation middleware (e.g., Joi, express-validator)
- [ ] API documentation with Swagger/OpenAPI
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] WebSocket support for real-time features
- [ ] Video transcoding and streaming
- [ ] Advanced search and filtering
- [ ] Notification system

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Note**: This is a backend API. You'll need a frontend application to interact with it fully. Make sure to configure CORS settings in `src/app.js` to allow requests from your frontend domain.
