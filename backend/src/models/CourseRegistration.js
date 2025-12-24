import mongoose from "mongoose";

// ✅ collection: course_registrations
const CourseRegistrationSchema = new mongoose.Schema({}, { strict: false, collection: "course_registration_v3.0" });

export default mongoose.model("CourseRegistration", CourseRegistrationSchema);
