import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

const dbHost = process.env.DB_HOST

mongoose.connect(dbHost)
.then(() => {
  console.log('connected to MongoDB')
}).catch(error => {
  console.log(error.message)
})