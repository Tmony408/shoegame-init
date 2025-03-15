const express = require('express')
const dotenv = require('dotenv');
const connectDB = require("./DB/connect");
const cors = require("cors");
const { notFound, errorHandler } = require("./Middlewares/errorUtils");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const http = require("http")
//Routes
const personRoutes = require("./Routes/personRoutes");


// app
const app = express();
// const server = http.createServer(app);

//DB connection
connectDB(mongoose);

//middlewares
dotenv.config();
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// **Import WebSocket Logic**
// const initSocket = require('./socket');
// const io = initSocket(server);


// Routes
app.get("/", (req, res) => {
    res.send("Welcome to MNA webserver");
  });

app.use("/api/person", personRoutes)






// Middleware for handling 404 (Not Found) errors
app.use(notFound);

// Middleware for handling errors
app.use(errorHandler);



module.exports = app;