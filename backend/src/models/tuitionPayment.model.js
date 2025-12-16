import mongoose from "mongoose";

const tuitionPaymentSchema = new mongoose.Schema(
  {
    student_id: { type: String, required: true, index: true },
    registration_no: { type: String },
    academic_year: { type: String, required: true, index: true },
    semester: { type: Number, required: true, index: true },
    semester_label: { type: String },
    tuition_total: { type: Number, required: true },
    payment_sequence: { type: Number },
    receipt_number: { type: String },
    paid_at: { type: Date },
    amount_paid: { type: Number, required: true },
    remaining_balance: { type: Number },
  },
  { timestamps: true }
);

const TuitionPayment = mongoose.model(
  "TuitionPayment",
  tuitionPaymentSchema,
  "tuition_payments"
);

export default TuitionPayment;
