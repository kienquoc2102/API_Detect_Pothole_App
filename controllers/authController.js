const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const authController = {
    //Register
    registerUser: async(req,res) => {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(req.body.password, salt);

            //Create new User
            const newUser = await new User({
                username: req.body.username,
                email: req.body.email,
                password: hashed,
            })

            //Save to DB
            const user = await newUser.save();
            res.status(200).json(user)
        }
        catch (err) {
            res.status(500).json(err)
        }
    },

    //Google
    
    //

    //Login
    loginUser: async (req,res) => {
        try {
            const user = await User.findOne({username: req.body.username});
            if (!user) {
                res.status(400).json("Wrong username");
            }
            const validPassword = await bcrypt.compare(
                req.body.password,
                user.password
            );
            if (!validPassword) {
                res.status(400).json("Wrong password!");
            }
            if (user && validPassword) {
                const accessToken = authController.generateAccessToken(user);
                const refreshToken = authController.generateRefreshToken(user);
                res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    secure: true,
                    path: "/",
                    sameSite: "strict",
                })

                const {password, ...others} = user._doc;
                res.status(200).json({...others, accessToken});
            }
        }
        catch (err) {
            res.status(500).json(err);
        }
    },

    //Generate Access Token
    generateAccessToken: (user) => {
        return jwt.sign({
            id: user.id,
            admin: user.admin
        },
        process.env.JWT_ACCESS_KEY,
        {expiresIn: "1d"}
        )
    },

    //Generate Refresh Token
    generateRefreshToken: (user) => {
        return jwt.sign({
            id: user.id,
            admin: user.admin
        },
        process.env.JWT_REFRESH_KEY,
        {expiresIn: "365d"}
        );
    }
}

module.exports = authController;