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

//usage?
//routes declarations:
app.use("/api/v1/users",userRouter);//we give control to user router ,when some enter this url
//userRouter , user.router file mai jayega 
//kahe ga k mai control aap ko paas kar raha ho mujhe bataye k kia karna hai
//here /users become prefix

//http://localhost:8000/api/v1/users/register
//jese aap /users pay gaye controll jaeyga direct user.routes par 
//yaha pa kuch change nahi aaeyga 
//user ka bad jitnay bhi methods likhay jaeyngay wo user.route mai   
app.get('/test', (req, res) => {
    res.send('Test route working!');
});
export {app}

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