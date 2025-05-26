const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Organization
  applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InternshipApplication' }],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
}, { timestamps: true });

const Internship = mongoose.model('Internship', internshipSchema);

const internshipApplicationSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  fatherOrHusbandName: { type: String, required: true },
  associationType: { type: String, required: true }, // Volunteer, Employee, etc.
  educationQualification: { type: String, required: true },
  totalWorkExperience: { type: Number, required: true },
  mobileNumbers: [{ type: String, required: true }], // Array for (i) and (ii)
  email: { type: String, required: true },
  references: [{
    name: { type: String, required: true },
    mobile: { type: String, required: true }
  }],
  address: { type: String, required: true },
  pin: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },
  pan: { type: String },
  dlNo: { type: String },
  interestedAreas: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  signature: { type: String },
  attachedFiles: [{ type: String }], // URLs or file references
  applicationStatus: { type: String, enum: ['pending', 'shortlisted', 'rejected', 'selected'], default: 'pending' },
  internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship' },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const InternshipApplication = mongoose.model('InternshipApplication', internshipApplicationSchema);

module.exports = { Internship, InternshipApplication };
