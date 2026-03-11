const mongoose = require("mongoose");

/*  Availability Schema  */
const AvailabilitySchema = new mongoose.Schema(
  {
    available: [{ type: String }], // list of available time slots
    blocked: [{ type: String }]    // list of blocked time slots
  },
  { _id: false } // prevent automatic _id for subdocuments
);

/*  Doctor Schema  */
const doctorSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true, // Matches doc1, doc2, etc.
    },
    name: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
    type: String,
    default: 'DOCTOR' // Adding this to match your patient schema style
  },
    availability: {
  type: Object,
  default: {}
}

  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
