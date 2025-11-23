import mongoose from "mongoose";

const ContactSchema = new mongoose.Schema({
  school_email: String,
  alias_email: String,
  personal_email: String,
  phone: String,
}, { _id: false });

const AddressSchema = new mongoose.Schema({
  permanent_address: String,
  temporary_address: String,
  hometown: String,
  is_remote_area: Boolean
}, { _id: false });

const IdentitySchema = new mongoose.Schema({
  identity_number: String,
  identity_issue_date: String,
  identity_issue_place: String,
  ethnicity: String,
  religion: String,
  origin: String,
  union_join_date: String,
  party_join_date: String,
}, { _id: false });

const PersonSchema = new mongoose.Schema({
  name: String,
  job: String,
  phone: String,
  address: String,
}, { _id: false });

const FamilySchema = new mongoose.Schema({
  father: PersonSchema,
  mother: PersonSchema,
  guardian: PersonSchema
}, { _id: false });

const StudentSchema = new mongoose.Schema({
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
  family: FamilySchema
}, { timestamps: true });

export default mongoose.model("Student", StudentSchema);
