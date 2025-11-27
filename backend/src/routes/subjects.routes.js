import express from "express";
import Subject from "../models/subject.model.js";

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

export default router;
