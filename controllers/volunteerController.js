const Volunteer = require('../models/Volunteer');
// const { handleError } = require('../utils/errorHandler');

// Get all volunteers
exports.getVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: volunteers });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error fetching volunteers' 
    });
  }
};

// Create new volunteer
exports.createVolunteer = async (req, res) => {
  try {
    const volunteer = new Volunteer(req.body);
    await volunteer.save();
    res.status(201).json({ success: true, data: volunteer });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email already exists' 
      });
    }
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error creating volunteer' 
    });
  }
};

// Update volunteer status
exports.updateVolunteerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const volunteer = await Volunteer.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }
    
    res.json({ success: true, data: volunteer });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error updating volunteer status' 
    });
  }
};

// Update volunteer details
exports.updateVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const volunteer = await Volunteer.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }
    
    res.json({ success: true, data: volunteer });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error updating volunteer' 
    });
  }
};

// Delete volunteer
exports.deleteVolunteer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const volunteer = await Volunteer.findByIdAndDelete(id);
    
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }
    
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error deleting volunteer' 
    });
  }
};

// Add volunteer event
exports.addVolunteerEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = req.body;
    
    const volunteer = await Volunteer.findById(id);
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }
    
    volunteer.events.push(event);
    if (event.status === 'Completed') {
      volunteer.hours += event.hours;
    }
    
    await volunteer.save();
    res.json({ success: true, data: volunteer });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error adding volunteer event' 
    });
  }
};

// Update volunteer notes
exports.updateVolunteerNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const volunteer = await Volunteer.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    );
    
    if (!volunteer) {
      return res.status(404).json({ success: false, error: 'Volunteer not found' });
    }
    
    res.json({ success: true, data: volunteer });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error updating volunteer notes' 
    });
  }
}; 