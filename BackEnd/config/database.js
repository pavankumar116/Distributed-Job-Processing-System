const mongoose = require('mongoose');

async function connectDB(){
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/job_platform"); 
        console.log("MongoDB Connected");

    }catch(err){
        console.log("Error occured while connecting to database...."+err);
    }
} 

module.exports = connectDB;