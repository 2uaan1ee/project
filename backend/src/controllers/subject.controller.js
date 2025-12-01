import asyncHandler from "express-async-handler";
import Subject from "../models/subject.model.js";

export const listSubjects = asyncHandler(async (req, res) => {
  const { search, type, limit = 200 } = req.query;
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ code: regex }, { name: regex }];
  }

  if (type && ["LT", "TH"].includes(type)) {
    filter.type = type;
  }

  const parsedLimit = Number(limit);
  const cappedLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 500) : 200;

  const subjects = await Subject.find(filter)
    .sort({ code: 1 })
    .limit(cappedLimit);

  res.json(subjects);
});
