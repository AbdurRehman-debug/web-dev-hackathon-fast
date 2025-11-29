import mongoose from 'mongoose'

const MONGODB_URI = process.env.DATABASE_URL!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

export default async function connectDB() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected");
}