const mongoose = require("mongoose");

// ✅ collection: course_registrations
const CourseRegistrationSchema = new mongoose.Schema({}, { strict: false, collection: "course_registrations" });

module.exports = mongoose.model("CourseRegistration", CourseRegistrationSchema);
