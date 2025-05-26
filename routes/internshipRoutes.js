const express = require('express');
const router = express.Router();
const { 
    createInternship,
    createInternshipApplication,
    getAllInternshipApplications, 
    getSingleInternshipApplication, 
    updateInternshipApplication, 
    deleteInternshipApplication,
    getApplicantsForInternship,
    updateApplicationStatus,
    getMyApplications
} = require('../controllers/internshipController');
const { authenticate, requireModulePermission } = require('../middlewares/authMiddleware');

// Protected routes
router.use(authenticate);

// Organization routes
router.post('/post', requireModulePermission('internships', 'create'), createInternship);
router.get('/applicants/:internshipId', requireModulePermission('internships', 'read'), getApplicantsForInternship);
router.patch('/application-status', requireModulePermission('internships', 'update'), updateApplicationStatus);

// Individual routes
router.get('/my-applications', getMyApplications);

// Public
router.get('/', requireModulePermission('internships', 'read'), getAllInternshipApplications);
router.get('/:id', getSingleInternshipApplication);

// Admin/Organizer routes
router.post('/', requireModulePermission('internships', 'create'), createInternshipApplication);
router.put('/:id', requireModulePermission('internships', 'update'), updateInternshipApplication);
router.delete('/:id', requireModulePermission('internships', 'delete'), deleteInternshipApplication);

module.exports = router;