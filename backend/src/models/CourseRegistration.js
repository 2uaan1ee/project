const mongoose = require("mongoose");

// ✅ collection: course_registrations
const CourseRegistrationSchema = new mongoose.Schema({}, { strict: false, collection: "course_registration_v3.0" });

module.exports = mongoose.model("CourseRegistration", CourseRegistrationSchema);
