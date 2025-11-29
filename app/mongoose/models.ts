import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: String,
  isProfileCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});




// models/Profile.ts


const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, default: "Technical" }
});

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, required: true },
  position: { type: String, required: true },
  description: String,
  startDate: String,
  endDate: String,
  current: { type: Boolean, default: false }
});

const EducationSchema = new mongoose.Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  field: String,
  startDate: String,
  endDate: String
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  technologies: String,
  link: String
});

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Clerk User ID
  resumePath: String,
  skills: [SkillSchema],
  experience: [ExperienceSchema],
  education: [EducationSchema],
  projects: [ProjectSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});



export const UserModel = mongoose.models.User|| mongoose.model("User", UserSchema);

export const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);