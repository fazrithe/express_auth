const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

async function hashPassword (password) {
    return await bcrypt.hash(password, 10);
}

async function validatePassword (plainPassword, hashPassword) {
    return await bcrypt.compare(plainPassword, hashPassword);
}

exports.signup = async (req, res, next) => {
    try{
        const { email, password, role} = req.body
        const hashPassword = await hashPassword(password);
        const newUser = new User({ email, password: hashPassword, role: role || "basic" });
        const accessToken = jwt.sign({ userId: newUser._id}, process.env.JWT_SECRET, {
            expireIn: "id"
        });
        newUser.accessToken = accessToken;
        await newUser.save();
        res.json({
            data: newUser,
            accessToken
        })
    } catch (error) {
        next(error)
    }
}

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return next(new Error('Email does not exist'));
        const validPassword = await validatePassword(password, user.password);
        if (!validPassword) return next(new Error('Password is not correct'))
        const accessToken = jwt.sign({  userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "id"
        });
        await User.findByAndUpdate(user._id, { accessToken })
        res.status(200).json({
            data: { email: user.email, role: user.role },
            accessToken
        })
    } catch (error) {
        next(error);
    }
}