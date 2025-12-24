import mongoose from "mongoose";

// ✅ collection: course_registrations
const CourseRegistrationSchema = new mongoose.Schema({}, { strict: false, collection: "course_registrations" });

export default mongoose.model("CourseRegistration", CourseRegistrationSchema);
