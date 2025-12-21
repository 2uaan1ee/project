import mongoose from "mongoose";

const RegulationAttachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true },
    uploadedBy: { type: String },
    uploaderEmail: { type: String },
  },
  {
    timestamps: true,
    collection: "regulation_attachments",
  }
);

export default mongoose.models.RegulationAttachment
  || mongoose.model("RegulationAttachment", RegulationAttachmentSchema, "regulation_attachments");
