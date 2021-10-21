const mongoose = require("mongoose");
// const uniqueArrayPlugin = require("mongoose-unique-array");

const classschema = new mongoose.Schema({
    students:[{
        name:{
            type : String,
            required : true
        },
        rollno:{
            type : String,
            required : true
        },
        attendance:{
            type: Number
        },
        percent:{
            type : Number,
            default : 0
        }
    }],
    totalclass:{
        type : Number,
        default : 0
    },
    passPercent : {
        type : Number,
        default : 75
    }
})

// classschema.plugin(uniqueArrayPlugin);
const classmodel = new mongoose.model("classCollection", classschema);
module.exports = classmodel;
