const { Internship, InternshipApplication } = require('../models/Internship');
const { z } = require('zod');
const User = require('../models/User');

// Internship posting schema (for organizations)
const createInternshipSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
});

// Internship application schema (for individuals)
const createInternshipApplicationSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  fatherOrHusbandName: z.string().min(1, 'Father/Husband Name is required'),
  associationType: z.string().min(1, 'Association Type is required'),
  educationQualification: z.string().min(1, 'Educational Qualification is required'),
  totalWorkExperience: z.number().min(0, 'Total Work Experience is required'),
  mobileNumbers: z.array(z.string().min(10)).min(1, 'At least one mobile number is required'),
  email: z.string().email('Valid Email is required'),
  references: z.array(z.object({
    name: z.string().min(1, 'Reference Name is required'),
    mobile: z.string().min(10, 'Reference Mobile is required')
  })).min(1, 'At least one reference is required'),
  address: z.string().min(1, 'Address is required'),
  pin: z.string().min(1, 'PIN is required'),
  aadhaarNumber: z.string().min(1, 'AADHAAR Number is required'),
  pan: z.string().optional(),
  dlNo: z.string().optional(),
  interestedAreas: z.array(z.string()).optional(),
  signature: z.string().optional(),
  attachedFiles: z.array(z.string()).optional(),
  internshipId: z.string().optional(),
});

const updateInternshipApplicationSchema = createInternshipApplicationSchema.partial();

// Organization: Create Internship Posting
exports.createInternship = async (req, res) => {
    try {
    if (!req.user || (req.user.accountType !== 'organization' && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only organizations or admins can post internships.' });
    }
    // Admins have no limit
    if (req.user.role !== 'admin') {
      if (!req.user.isPaidMember && req.user.internshipPostsThisYear >= 2) {
        return res.status(403).json({ success: false, message: 'Free internship post limit reached. Upgrade to paid membership to post more internships.' });
      }
    }
        const result = createInternshipSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ success: false, errors: result.error.errors });
        }
    const internship = await Internship.create({ ...result.data, postedBy: req.user._id });
    // Increment internshipPostsThisYear for non-admins
    if (req.user.role !== 'admin') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { internshipPostsThisYear: 1 } });
    }
    res.status(201).json({ success: true, internship });
    } catch (error) {
        console.error('Error creating internship:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Individual: Apply to Internship
exports.createInternshipApplication = async (req, res) => {
  try {
    if (!req.user || req.user.accountType !== 'individual') {
      return res.status(403).json({ success: false, message: 'Only individuals can apply to internships.' });
    }
    // Check free application limit
    if (!req.user.isUpgraded && req.user.internshipApplicationsThisYear >= 2) {
      return res.status(403).json({ success: false, message: 'Free application limit reached. Upgrade to apply to more internships.' });
    }
    const result = createInternshipApplicationSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ success: false, errors: result.error.errors });
    }
    const internshipAppData = result.data;
    internshipAppData.applicantId = req.user._id;
    if (internshipAppData.internshipId) {
      internshipAppData.internshipId = internshipAppData.internshipId;
    }
    const newInternshipApp = await InternshipApplication.create(internshipAppData);
    // Add application to Internship's applicants array
    if (internshipAppData.internshipId) {
      await Internship.findByIdAndUpdate(internshipAppData.internshipId, { $push: { applicants: newInternshipApp._id } });
    }
    // Increment internshipApplicationsThisYear
    await User.findByIdAndUpdate(req.user._id, { $inc: { internshipApplicationsThisYear: 1 } });
    res.status(201).json({ success: true, internshipApplication: newInternshipApp });
  } catch (error) {
    console.error('Error creating internship application:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Organization: View applicants for a internship
exports.getApplicantsForInternship = async (req, res) => {
  try {
    if (!req.user || (req.user.accountType !== 'organization' && req.user.role !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Only organizations or admins can view applicants.' });
    }
    const internship = await Internship.findById(req.params.internshipId).populate('applicants');
    // Admins can view any internship's applicants
    if (req.user.role !== 'admin') {
      if (!internship || String(internship.postedBy) !== String(req.user._id)) {
        return res.status(404).json({ success: false, message: 'Internship not found or not authorized.' });
      }
    }
    res.status(200).json({ success: true, applicants: internship.applicants });
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Organization: Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    if (!req.user || req.user.accountType !== 'organization') {
      return res.status(403).json({ success: false, message: 'Only organizations can update application status.' });
    }
    const { applicationId, status } = req.body;
    if (!['pending', 'shortlisted', 'rejected', 'selected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const application = await InternshipApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    // Check if the organization owns the internship
    const internship = await Internship.findById(application.internshipId);
    if (!internship || String(internship.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    application.applicationStatus = status;
    await application.save();
    res.status(200).json({ success: true, application });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Individual: View my internship applications and their status
exports.getMyApplications = async (req, res) => {
  try {
    if (!req.user || req.user.accountType !== 'individual') {
      return res.status(403).json({ success: false, message: 'Only individuals can view their applications.' });
    }
    const applications = await InternshipApplication.find({ applicantId: req.user._id });
    res.status(200).json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching my applications:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get All Internship Applications (for admin: all internships, for org: only their internships)
exports.getAllInternshipApplications = async (req, res) => {
  try {
    let internships;
    if (req.user && req.user.role === 'admin') {
      internships = await Internship.find().populate('applicants');
    } else if (req.user && req.user.accountType === 'organization') {
      internships = await Internship.find({ postedBy: req.user._id }).populate('applicants');
    } else {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
        res.status(200).json({ success: true, internships });
    } catch (error) {
        console.error('Error fetching internships:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Single Internship Application
exports.getSingleInternshipApplication = async (req, res) => {
    try {
        const internshipApplication = await InternshipApplication.findById(req.params.id);
        if (!internshipApplication) {
            return res.status(404).json({ success: false, message: 'Internship Application not found' });
        }
        res.status(200).json({ success: true, internshipApplication });
    } catch (error) {
        console.error('Error fetching internship application:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update Internship Application
exports.updateInternshipApplication = async (req, res) => {
    try {
        const result = updateInternshipApplicationSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ success: false, errors: result.error.errors });
        }
        const updatedInternshipApp = await InternshipApplication.findByIdAndUpdate(req.params.id, result.data, { new: true });
        if (!updatedInternshipApp) {
            return res.status(404).json({ success: false, message: 'Internship Application not found' });
        }
        res.status(200).json({ success: true, internshipApplication: updatedInternshipApp });
    } catch (error) {
        console.error('Error updating internship application:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Delete Internship Application
exports.deleteInternshipApplication = async (req, res) => {
    try {
        const deletedInternshipApp = await InternshipApplication.findByIdAndDelete(req.params.id);
        if (!deletedInternshipApp) {
            return res.status(404).json({ success: false, message: 'Internship Application not found' });
        }
        res.status(200).json({ success: true, message: 'Internship Application deleted' });
    } catch (error) {
        console.error('Error deleting internship application:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
