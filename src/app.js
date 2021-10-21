require("dotenv").config();
const express = require("express");
const app = express();
require("./db/conn");
const Users = require("./models/model");
const Students = require("./models/class");
const path = require("path");
const hbs = require("hbs");
const bcrypt = require("bcryptjs");
var cookieParser = require('cookie-parser');
const auth = require("./middleware/auth");
const Excel = require('exceljs');

const port = process.env.PORT || 8000;

const staticpath = path.join(__dirname,"../public");
const temppath = path.join(__dirname,"../templates/views");
const partialpath = path.join(__dirname,"../templates/partials");

app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(express.static(staticpath));
app.set("view engine","hbs");
app.set("views",temppath);
hbs.registerPartials(partialpath);
app.use(cookieParser());

hbs.registerHelper("check",function(value,passPercent){
    // console.log(value);
    // console.log(passPercent);
    if(value.percent>=passPercent) return "pass";
    else return "fail";
})

app.get("/",(req,res)=>{
    if(req.cookies.jwt){
        res.redirect("/dashboard");
    }
    else{
        res.render("index");
    }
})
app.get("/clik",(req,res)=>{
    res.send("ressend");
})
app.get("/register",(req,res)=>{
    res.render("register");
})
app.post("/register", async (req, res)=>{
    try {
        const password = req.body.password;
        const confirmpassword = req.body.confirmpassword;
        if(password==confirmpassword){
            const member = new Users({
                firstname : req.body.firstname,
                lastname : req.body.lastname,
                email : req.body.email,
                gender : req.body.gender,
                password : password
            });
            console.log("Starting token generation.........");
            const token = await member.createToken();
            console.log(token);
            console.log("Ending token generation.........");

            const registered = await member.save();
            // console.log(registered);
            res.cookie("jwt",token,{
                expires : new Date(Date.now()+2629800000),
                httpOnly: true
            });
            res.status(201).render("register",{
                message:"Registered.....!!!!!!!!"
            });
        }
        else{
            res.render("register",{
                message:"Password didn't matched"
            });
        }
    } 
    catch(err){
        console.log(err);
        if(err.code=11000){
            res.status(400).render("register",{
                message:"Email already used"
            });
        }
        else{
            res.send(err);
        }
        // console.log(err);
        // errorobj ={};
        // for(const key of Object.keys(err.errors)){
        //     console.log(key);
        //     errorobj[key] = err.errors[key].message;
        // }
        // console.log(errorobj);
        // res.send(errorobj);
        // res.send(err);
        // console.log(err.response)
        // res.send(err.response);
        // if(err.data.code==11000){
        //     console.log("email used");
        // }
        // res.send(err);
    }
})
app.get("/login",(req,res)=>{
    res.render("login");
})
app.post("/login",async (req,res)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;
        const result = await Users.findOne({email});

        const isMatch = await bcrypt.compare(password,result.password);
        // console.log(isMatch);
        if(isMatch){
            const token = await result.createToken();
            console.log(token);
            await result.save();
            res.cookie("jwt",token,{
                expires : new Date(Date.now()+2629800000),
                httpOnly: true
            });
            res.status(201).redirect("/dashboard");
        }
        else{
            res.render("login",{
                message:"invalid credentials"
            });
        }
    } catch (error) {
        res.render("login",{
            message:"invalid credentials"
        });
    }
})
app.get("/dashboard",auth,(req,res)=>{
    res.render("dashboard",{
        firstname : req.user.firstname
    });
})
app.get("/myclasses",auth,(req,res)=>{
    try {
        let klas = req.user.myclasses.map((val)=>{
            return val.myclass;
        })
        // console.log(klas);
        res.render("myclasses",{
            firstname : req.user.firstname,
            classname : klas
        });
    } catch (error) {
        res.send(error)
    }
})
app.get("/myclasses/class",auth,async(req,res)=>{
   try {
    let classid = req.query.id;
    const students = req.user.myclasses[classid];
    const students_list = await Students.findOne({_id:students._id});
    let all_stud = students_list.students;
    res.render("students",{
        firstname : req.user.firstname,
        classname : students.myclass,
        studentdetails : all_stud
    });
    } catch (error) {
        res.status(200).send(error);
    }
})
// app.post("/mystudents",auth,async(req,res)=>{
//     try {
//         let classname = req.body.name;
//         const students = req.user.myclasses.filter((val)=>{
//             return classname == val.myclass;
//         })
//         const students_list = await Students.findOne({_id:students[0]._id});
//         console.log(students_list);
//         let all_stud = students_list.students;
//         console.log(all_stud);
//         res.render("students",{
//             classname,
//             studentdetails : all_stud
//         });
//     } catch (error) {
//         res.send(error);
//     }
// })
app.post("/addstudent",auth,async(req,res)=>{
    try {
        const classid = req.body.id;
        const name = req.body.name;
        const rollno = req.body.roll;

        const students = req.user.myclasses[classid];
        const students_list = await Students.findOne({_id:students._id});
        // console.log(students_list);
        let exists = false;
        await students_list.students.map(val=>{
            if(val.rollno == rollno){
                exists = true;
            }
        })
        if(!exists){
            students_list.students = students_list.students.concat({name,rollno,attendance:0});
            // console.log(students_list);
            await students_list.save();
            res.status(201).send({name,rollno});
        }
        else{
            res.status(400).send("Exists");
        }
        
    } catch (error) {
        // console.log(error);
        res.status(400).send(error);
    }
})

app.post("/addclass",auth, async (req,res)=>{
    try{
        const classname = req.body.classname;
        req.user.myclasses = req.user.myclasses.concat({myclass:classname});
        await req.user.save();
        const students = req.user.myclasses.filter((val)=>{
            return classname == val.myclass;
        })
        const studs = new Students({
            _id : students[0]._id
        })
        await studs.save();
        let ind = req.user.myclasses.length-1;
        res.status(201).send({classname,ind});
    }
    catch(error){
        res.status(400).send(error);
    }
})

app.get("/take-attendance",auth,(req,res)=>{
    let klas = req.user.myclasses.map((val)=>{
        return val.myclass;
    })
    res.render("take-attendance",{
        firstname : req.user.firstname,
        classname : klas
    });
})

app.get("/take-attendance/class",auth,async(req,res)=>{
    try {
     let classid = req.query.id;
     const students = req.user.myclasses[classid];
     const students_list = await Students.findOne({_id:students._id});
     let all_stud = students_list.students;
     res.render("stud-list",{
         firstname : req.user.firstname,
         classname : students.myclass,
         studentdetails : all_stud
     });
     } catch (error) {
         res.status(400).send(error);
     }
 })

app.post("/take-attendance",auth,async(req,res)=>{
    console.log(req.body.present);
    console.log(req.body.id);
    try {
        let present = req.body.present;
        let classid = req.body.id;
        console.log(present);
        console.log(typeof present);
        const students = req.user.myclasses[classid];
        const students_list = await Students.findOne({_id:students._id});
        students_list.totalclass+=1;
        let all_stud = students_list.students;

        if(typeof present=="object"){
            present.map((val)=>{
                all_stud[val].attendance+=1;
            });
        }
        else if(typeof present=="string"){
            all_stud[present].attendance+=1;
        }
        all_stud.map((val)=>{
            val.percent=((val.attendance/students_list.totalclass)*100).toFixed(2);
        })
        await students_list.save();
        res.status(201).send("Attendance taken");
        
        } catch (error) {
            console.log(error);
            res.status(400).send(error);
        }
})

app.get("/view-attendance",auth,(req,res)=>{
    let klas = req.user.myclasses.map((val)=>{
        return val.myclass;
    })
    res.render("view-attendance",{
        firstname : req.user.firstname,
        classname : klas
    });
})

app.get("/view-attendance/class",auth,async(req,res)=>{
    try {
     let classid = req.query.id;
     const students = req.user.myclasses[classid];
     const students_list = await Students.findOne({_id:students._id});
     let all_stud = students_list.students;
    //  console.log(students_list.passPercent);
     res.render("view-list",{
         classname : students.myclass,
         totalclass : students_list.totalclass,
         studentdetails : all_stud,
         passPercent : students_list.passPercent,
         classid,
         firstname : req.user.firstname
     });
     } catch (error) {
         res.status(400).send(error);
     }
 })

// app.get("/excel",(req,res)=>{
//         var workbook = new Excel.Workbook();
//         var worksheet = workbook.addWorksheet('My Sheet');
//         worksheet.columns = [
//             { header: 'Id', key: 'id', width: 10 },
//             { header: 'Name', key: 'name', width: 32 },
//             { header: 'D.O.B.', key: 'dob', width: 10 }
//         ];
//         worksheet.addRow({id: 1, name: 'John Doe', dob: 1});
//         worksheet.addRow({id: 2, name: 'Jane Doe', dob: 2});
//         // workbook.commit();
//         sendWorkbook(workbook,res);
//         async function sendWorkbook(workbook, response) { 
//             var fileName = 'FileName.xlsx';
        
//             response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
//             response.setHeader("Content-Disposition", "attachment; filename=" + fileName);
        
//             await workbook.xlsx.write(response);
        
//             response.end();
//         }
// })

app.get('/download/class',auth,async(req,res)=>{
    try {
        let classid = req.query.id;
        const students = req.user.myclasses[classid];
        const students_list = await Students.findOne({_id:students._id});
        let all_stud = students_list.students;

        var workbook = new Excel.Workbook();
        var worksheet = workbook.addWorksheet('My Sheet');
        worksheet.columns = [
            { header: 'Roll Number', key: 'roll', width: 32 },
            { header: 'Name', key: 'name', width: 40 },
            { header: 'Percentage', key: 'percent', width: 15 }
        ];

        all_stud.map((val)=>{
            worksheet.addRow({roll: val.rollno, name: val.name, percent:val.percent+"%"});
        });

        sendWorkbook(workbook,res);
        async function sendWorkbook(workbook, response) { 
            var fileName = 'Attendance_List.xlsx';
        
            response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            response.setHeader("Content-Disposition", "attachment; filename=" + fileName);
        
            await workbook.xlsx.write(response);
        
            response.end();
        }
    } catch (error) {
        res.send(error)
    }
})

app.listen(port,()=>{
    console.log("Listening");
});