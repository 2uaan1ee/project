import mongoose from "mongoose";

const HistoryChangeSchema = new mongoose.Schema({}, { strict: false, collection: "history_change" });

export default mongoose.models.HistoryChange
  || mongoose.model("HistoryChange", HistoryChangeSchema, "history_change");
