import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
//body parser => included in express

const app = express();//app name is common 
//app k pass super power hai
//middleware => .use() method


app.use(cors())//koi setting in cors
//mai frontend mai kis kis jaga sai request recieve karsakta ho
//origin => konsa origin allow karna hai


//best practices, security practices
app.use(express.json({limit: "16kb"}));//to accept json, kitne limit aap accept karsaktay ho
app.use(express.urlencoded({extended: true, limit: "16kb"}))//url sai jab data aaye space=%20,@=%40
//extended true means u can give objects nestted objects
app.use(express.static("public"))//public assets
app.use(cookieParser());






//routes import karna idhar
//cuz we do this in case of routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import healthcheckRouter from "./routes/healthcheck.routes.js";
import tweetRouter from "./routes/tweet.routes.js";

// Import error handling utilities
import { ApiError } from "./utils/ApiError.js";

//usage?
//routes declarations:
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/tweets", tweetRouter);

// Test route
app.get('/test', (req, res) => {
    res.send('Test route working!');
});

// Error handling middleware (must be after all routes)
app.use((err, req, res, next) => {
    // If error is an instance of ApiError, use its properties
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            errors: err.errors,
            data: err.data
        });
    }

    // For other errors, return a generic error response
    return res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        errors: [],
        data: null
    });
});

// 404 handler for undefined routes
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
        errors: [],
        data: null
    });
});

export { app }

// /api/v1/users => good practice


/*
CORS=> cross origin resource sharing
    =>mechanism allows restricted resources on web page to be requested from another domain outside
      the domain from which the resources originated.
      To control the access to resources
      It enable a server to specify who can access its resources by defining a set 
      of origins that are allowed to access them 

      Helps in preventing cross-site request forgery (CSRF) that allow only those domains
      that are allowed to access the resources

      Cross-domain communication

cookie-parser=>
    middleware that parses that cookies attache to the client request object. it makes
    the cookie parser easier and efficient.

    for cookie-managment
    access cookie data
    session-handling
    Storing tokens in cookies









*/