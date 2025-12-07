import express from "express";
import Subject from "../models/subject.model.js";
import { verifyJwt } from "../middleware/auth.js";

const router = express.Router();

router.get("/open", async (req, res) => {
    try {
        const data = await Subject.find({ status: "open" }).lean();
        res.json(data);
    } catch (err) {
        console.error("Error loading subjects:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Search subjects by ID or name (for validation)
router.get("/", verifyJwt, async (req, res) => {
    try {
        const { search } = req.query;
        
        if (!search) {
            const subjects = await Subject.find({}).limit(100).lean();
            return res.json({ subjects });
        }
        
        const subjects = await Subject.find({
            $or: [
                { subject_id: { $regex: search, $options: "i" } },
                { subject_name: { $regex: search, $options: "i" } }
            ]
        }).limit(50).lean();
        
        res.json({ subjects });
    } catch (err) {
        console.error("Error searching subjects:", err);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
