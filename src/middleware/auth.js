const Users = require("../models/model");
const jwt = require("jsonwebtoken");
const url = require("url");

const auth = async (req,res,next)=>{
    try {
        const token = req.cookies.jwt;
        // console.log("i got token");
        // console.log(token);
        const verifyuser = jwt.verify(token, process.env.SECRET_KEY);
        // console.log(verifyuser);
    
        const user = await Users.findOne({_id:verifyuser._id});
        // console.log(user);
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        res.status(401).redirect("/login");
    }
}

module.exports=auth;