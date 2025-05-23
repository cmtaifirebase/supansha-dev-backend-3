// individual routes with middleware
const express = require("express");
const router = express.Router();
const {createIndividualUser, loginIndividualUser, logoutIndividualUser, getIndividualUserDetails, updateIndividualUserDetails, deleteIndividualUser, getAllIndividualUsers} = require("../controllers/individualController");
const {authenticate, authenticateIndividual, requireRole} = require("../middlewares/authMiddleware");


// create individual user
// api/individual/create
router.post("/create", createIndividualUser);

// login individual user
// api/individual/login
router.post("/login", loginIndividualUser);


// logout individual user
// api/individual/logout
router.post("/logout", logoutIndividualUser);

// get individual user details
// api/individual/details
router.post("/details", authenticateIndividual, getIndividualUserDetails);


// update individual user details
// api/individual/update
router.post("/update", authenticateIndividual, updateIndividualUserDetails);

// delete individual user
// api/individual/delete
router.post("/delete", authenticateIndividual, deleteIndividualUser);


// get all individual users (admin only)
// api/individual/all
router.get("/all",authenticate,requireRole("admin"),getAllIndividualUsers);


module.exports = router;







