const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const authRoute = require("./routes/auth");
const potholeRoute = require("./routes/pothole");
const {Server} = require('socket.io');
const http = require('http')

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

//Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());

//Gắn Socket.IO vào req để sử dụng trong các controller
app.use((req, res, next) => {
    req.io = io;
    next();
})

//Routes
app.use("/v1/auth", authRoute);
app.use("/v1/pothole", potholeRoute);

//MongoDB Connection
const mongoDBURL = process.env.MONGODB_URL;
mongoose.connect(mongoDBURL)
    .then(()=>console.log("Connected to MongoDB"))
    .catch((error) => console.error("Could not connect to MongoDB", error));

//Socket.IO connection
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", ()=>{
        console.log("A user disconnected")
    });
});

const PORT = 8000;
server.listen(PORT,()=> {
    console.log(`Server is running on port ${PORT}`);
});
// module.exports = app;
