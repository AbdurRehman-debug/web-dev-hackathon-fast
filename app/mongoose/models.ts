import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: String,
  isProfileCompleted: Boolean,
});



export default mongoose.models.User || mongoose.model("User", UserSchema);