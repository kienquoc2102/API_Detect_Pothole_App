const bcryptjs = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer")
const {OAuth2Client} = require("google-auth-library");
const Pothole = require("../models/Pothole");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const authController = {
    //Google
    googleLogin: async (req, res) => {
        try {
            const { token } = req.body; // Token từ phía Android gửi lên
            const ticket = await client.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
    
            const payload = ticket.getPayload();
            const { email, name, picture } = payload;
    
            // Tìm user trong database
            let user = await User.findOne({ email });
            if (!user) {
                // Nếu user chưa tồn tại, tạo mới
                user = await User.create({
                    username: name,
                    email: email,
                    avatar: picture,
                    password: null, // User Google không cần password
                });
            }
    
            // Tạo JWT token
            const accessToken = authController.generateAccessToken(user);
            const refreshToken = authController.generateRefreshToken(user);
    
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                path: "/",
                sameSite: "strict",
            });
    
            const { password, ...others } = user._doc;
            res.status(200).json({ ...others, accessToken });
        } catch (err) {
            console.error(err);
            res.status(500).json("Failed to authenticate Google user");
        }
    },

    //Register
    registerUser: async(req,res) => {
        try {
            const salt = await bcryptjs.genSalt(10);
            const hashed = await bcryptjs.hash(req.body.password, salt);

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

    //ForgotPassword
    sendResetPin: async (req,res) => {
        try {
            const user = await User.findOne({email: req.body.email});
            if (!user) {
                return res.status(404).json("Email does not exist");
            }

            //Create PIN
            const pin = Math.floor(100000 + Math.random() * 900000).toString();

            //Save
            user.resetPasswordPin = pin;
            user.resetPasswordExpire = Date.now() + 5 * 60 * 1000; // 10 phút
            await user.save();

            //Send PIN to email
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Mã PIN đặt lại mật khẩu",
                text: `Mã PIN của bạn là: ${pin}. Mã có hiệu lực trong 10 phút.`,
            };

            await transporter.sendMail(mailOptions);

            res.status(200).json("Mã PIN đã được gửi về email của bạn");
        } catch (err) {
            res.status(500).json(err);
        }
    },
    verifyPinAndResetPassword: async (req, res) => {
        try {
            const user = await User.findOne({
                email: req.body.email,
                resetPasswordPin: req.body.pin,
                resetPasswordExpire: { $gt: Date.now() },
            });

            if (!user) {
                return res.status(400).json("PIN is not valid");
            }

            const salt = await bcryptjs.genSalt(10);
            user.password = await bcryptjs.hash(req.body.newPassword, salt);
            user.resetPasswordPin = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();

            res.status(200).json("Updated password successfully");
        } catch (err) {
            res.status(500).json(err);
        }
    },

    //Update Info User
    updateUser: async (req, res) => {
        try {
            const userId = req.params.id;
            const updatedData = req.body;
    
            console.log("Updating user with ID:", userId);
            console.log("Updated data:", updatedData);
    
            // Tìm người dùng hiện tại để lấy username cũ
            const oldUser = await User.findById(userId);
            if (!oldUser) {
                console.log("User not found");
                res.status(404).json("User not found");
            }
    
            const oldUsername = oldUser.username; // Tên cũ của user trước khi cập nhật
    
            // Cập nhật thông tin user
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updatedData },
                { new: true, runValidators: true }
            );
    
            if (updatedUser) {
                console.log("User updated:", updatedUser);
    
                // Kiểm tra nếu username được cập nhật
                if (updatedData.username && updatedData.username !== oldUsername) {
                    // Tìm và cập nhật các pothole có contributor là username cũ
                    const updatedPotholes = await Pothole.updateMany(
                        { contributor: oldUsername }, // Điều kiện tìm kiếm
                        { $set: { contributor: updatedData.username } } // Cập nhật contributor
                    );
    
                    console.log(`Updated ${updatedPotholes.modifiedCount} potholes`);
                }
    
                res.status(200).json(updatedUser);
            } else {
                console.log("User not found after update");
                res.status(404).json("User not found");
            }
        } catch (err) {
            console.error("Error updating user:", err);
            res.status(500).json(err);
        }
    },    

    //Login
    loginUser: async (req,res) => {
        try {
            const user = await User.findOne({username: req.body.username});
            if (!user) {
                return res.status(400).json("Wrong username");
            }
            const validPassword = await bcryptjs.compare(
                req.body.password,
                user.password
            );
            if (!validPassword) {
                return res.status(400).json("Wrong password!");
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