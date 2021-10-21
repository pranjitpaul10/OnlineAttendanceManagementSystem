const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const validator = require("validator");

const registerschema = new mongoose.Schema({
    firstname : {
        type : String,
        required : true,
        trim : true,
        minlength : [3, "Enter atleast 2 characters"]
    },
    lastname : {
        type : String,
        required : true,
        trim : true,
        minlength : [3, "Enter atleast 2 characters"]
    },
    email : {
        type : String,
        required : true,
        unique : true,
        trim : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Please enter valid email");
            }
        }
    },
    gender : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true,
        minlength : [5, "Password must be atleast 5 characters"]
    },
    date : {
        type : Date,
        default : Date.now()
    },
    myclasses:[{
        myclass:{
            type : String,
            trim : true
        }
    }],
    tokens:[{
        token:{
            type : String,
            required : true
        }
    }]
});
registerschema.methods.createToken = async function(){
    try {
        const token = jwt.sign({_id:this._id},process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token:token});
        // await this.save();
        return token;
    }
    catch (err) {
        res.send(err);
    }
}

registerschema.pre("save", async function(next){
        if(this.isModified("password")){
            this.password = await bcrypt.hash(this.password,10);
        }
        next();
})

const registermodel = new mongoose.model("Registeration", registerschema);
module.exports = registermodel;