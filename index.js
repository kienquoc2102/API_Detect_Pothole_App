const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const potholeRoute = require("./routes/pothole");

dotenv.config();

const app = express();

//Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

//Routes
app.use("/v1/auth", authRoute);
app.use("/v1/pothole", potholeRoute);

//MongoDB Connection
const mongoDBURL = process.env.MONGODB_URL;
mongoose.connect(mongoDBURL)
    .then(()=>console.log("Connected to MongoDB"))
    .catch((error) => console.error("Could not connect to MongoDB", error));

//Start Server
// const PORT = 8000;
// app.listen(PORT,()=> {
//     console.log(`Server is running on port ${PORT}`);
// });
module.exports = app;
