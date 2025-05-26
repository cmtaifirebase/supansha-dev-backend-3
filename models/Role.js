const mongoose = require('mongoose');

const permissionsTypeSchema = new mongoose.Schema({
  read: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
    permissions: {
      dashboard: permissionsTypeSchema,
      certificates: permissionsTypeSchema,
      users: permissionsTypeSchema,
      volunteers: permissionsTypeSchema,
      reports: permissionsTypeSchema,
      formats: permissionsTypeSchema,
      events: permissionsTypeSchema,
      jobs: permissionsTypeSchema,
      internships: permissionsTypeSchema,
      blogs: permissionsTypeSchema,
      causes: permissionsTypeSchema,
      crowdFunding: permissionsTypeSchema,
      forum: permissionsTypeSchema,
      shop: permissionsTypeSchema,
      donations: permissionsTypeSchema,
      contacts: permissionsTypeSchema,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
