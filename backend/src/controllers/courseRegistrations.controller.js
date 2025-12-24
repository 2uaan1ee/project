// backend/src/controllers/courseRegistrations.controller.js
import CourseRegistration from "../models/CourseRegistration.js";

/**
 * GET /api/course-registrations
 * Lấy danh sách phiếu đăng ký với phân trang, tìm kiếm, sắp xếp
 * Chỉ dành cho admin
 */
export async function getAllRegistrations(req, res) {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
        const search = String(req.query.search || "").trim();
        const sortBy = req.query.sortBy || "registered_at";
        const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

        const skip = (page - 1) * limit;

        // Build search filter
        const filter = {};
        if (search) {
            filter.$or = [
                { student_id: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } },
                { registration_no: { $regex: search, $options: "i" } },
                { bms_number: { $regex: search, $options: "i" } },
            ];
        }

        // Get total count
        const total = await CourseRegistration.countDocuments(filter);

        // Get paginated results with selected fields
        const items = await CourseRegistration.find(filter)
            .select({
                _id: 1,
                registration_no: 1,
                bms_number: 1,
                student_id: 1,
                name: 1,
                academic_year: 1,
                semester: 1,
                semester_label: 1,
                total_credits: 1,
                registered_at: 1,
                registration_round: 1,
                major_id: 1,
                cohort_year: 1,
                study_year: 1,
            })
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();

        return res.json({
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("[courseRegistrations] getAllRegistrations error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * GET /api/course-registrations/:id
 * Lấy chi tiết đầy đủ một phiếu đăng ký
 * Chỉ dành cho admin
 */
export async function getRegistrationById(req, res) {
    try {
        const { id } = req.params;

        const registration = await CourseRegistration.findById(id).lean();

        if (!registration) {
            return res.status(404).json({ message: "Registration not found" });
        }

        return res.json(registration);
    } catch (error) {
        console.error("[courseRegistrations] getRegistrationById error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
