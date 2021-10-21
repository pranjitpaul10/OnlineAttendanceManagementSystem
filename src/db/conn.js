const mongoose = require("mongoose");
const DB = "mongodb://127.0.0.1:27017/attendanceManagement";

mongoose.connect(DB,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(()=>{
    console.log("Database Connected");
}).catch((err)=>{
    console.log(err);
})