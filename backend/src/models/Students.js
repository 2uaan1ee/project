// backend/src/models/Students.js
import mongoose from "mongoose";

/* ========== SUB-SCHEMA ========== */

const ContactSchema = new mongoose.Schema(
  {
    school_email: String,
    alias_email: String,
    personal_email: String,
    phone: String,
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    permanent_address: String,
    temporary_address: String,

    // cũ
    hometown: String,
    is_remote_area: Boolean,

    // mới – tách quê quán
    hometown_full: String,      // "Xã ..., Huyện ..., Tỉnh ..."
    hometown_district: String,  // Huyện/Quận
    hometown_province: String,  // Tỉnh/Thành phố
  },
  { _id: false }
);

const IdentitySchema = new mongoose.Schema(
  {
    identity_number: String,
    identity_issue_date: String,
    identity_issue_place: String,
    ethnicity: String,
    religion: String,
    origin: String,
    union_join_date: String,
    party_join_date: String,

    // mới – cờ dân tộc thiểu số
    is_ethnic_minority: Boolean,
  },
  { _id: false }
);

const PersonSchema = new mongoose.Schema(
  {
    name: String,
    job: String,
    phone: String,
    address: String,
  },
  { _id: false }
);

const FamilySchema = new mongoose.Schema(
  {
    father: PersonSchema,
    mother: PersonSchema,
    guardian: PersonSchema,
  },
  { _id: false }
);

// ưu tiên / giảm học phí
const PrioritySchema = new mongoose.Schema(
  {
    code: String,          // vd: "PRIORITY_80_REMOTE_ETHNIC"
    label: String,         // vd: "Vùng sâu vùng xa + dân tộc thiểu số"
    discount_rate: Number, // 0.8, 0.5, 0.3 ...
    reason: String,        // mô tả (optional)
  },
  { _id: false }
);

const PriorityFlagsSchema = new mongoose.Schema(
  {
    is_child_of_martyr: Boolean,   // con liệt sĩ
    is_child_of_invalid: Boolean,  // con thương binh
    is_remote_area: Boolean,       // vùng sâu vùng xa
    is_ethnic_minority: Boolean,   // dân tộc thiểu số
  },
  { _id: false }
);

/* ========== MAIN SCHEMA ========== */

const StudentSchema = new mongoose.Schema(
  {
    student_id: { type: String, unique: true, required: true, index: true },
    name: String,
    gender: { type: String, enum: ["Male", "Female"] },
    birth_date: String,
    birthplace: String,

    class_id: String,
    major_id: String,
    program_id: String,
    program_type: { type: String, enum: ["CQUI", "CNTN"] },
    has_english_certificate: Boolean,

    contact: ContactSchema,
    address: AddressSchema,
    identity: IdentitySchema,
    family: FamilySchema,

    // mới
    priority: PrioritySchema,
    priority_flags: PriorityFlagsSchema,
  },
  {
    timestamps: true,
    // 🔥 quan trọng: trỏ đúng collection students_v2.0
    collection: "students_v2.0",
  }
);
StudentSchema.index({ class_id: 1 });
export default mongoose.model("Student", StudentSchema);
