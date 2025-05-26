// crud and auth operations for individual user

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Individual = require("../models/Individual");
const z = require("zod");

const cookieOptions = {
  httpOnly: true,
  secure: true,
  maxAge: 3600000, // 1 hour
};

const createIndividualUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  accountType: z.string().min(1),
  subCategory: z.string().min(1),
});

const loginIndividualUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const updateIndividualUserDetailsSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  accountType: z.string().min(1).optional(),
  subCategory: z.string().min(1).optional(),
});

const deleteIndividualUserSchema = z.object({
  email: z.string().email(),
});

// create individual user
exports.createIndividualUser = async (req, res) => {
  try {
    // validate request body
    const result = createIndividualUserSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ message: "Invalid request body", error: result.error.message });
    }
    // check if user already exists
    const existingUser = await Individual.findOne({ email: result.data.email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // create new user
    const { name, email, password, accountType, subCategory } = result.data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Individual({
      name,
      email,
      password: hashedPassword,
      accountType,
      subCategory,
    });
    await newUser.save();

    // generate individualToken
    const individualToken = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // set cookie
    res.cookie("individualToken", individualToken, cookieOptions);

    // send response
    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

// login individual user
exports.loginIndividualUser = async (req, res) => {

  try {

      // validate request body
  const result = loginIndividualUserSchema.safeParse(req.body);
  if (!result.success) {
    return res
      .status(400)
      .json({ message: "Invalid request body", error: result.error.message });
  }

  const { email, password } = result.data;


    // check if user exists
    const user = await Individual.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // check if password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // generate individualToken
    const individualToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // set cookie
    res.cookie("individualToken", individualToken, cookieOptions);

    // send response
    res.status(200).json({ message: "Logged in successfully", user: user });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// logout individual user
exports.logoutIndividualUser = async (req, res) => {
  res.clearCookie("individualToken");
  res.status(200).json({ message: "Logged out successfully" });
};

// get individual user details
exports.getIndividualUserDetails = async (req, res) => {
  try {
    // validate request <body>
    const result = getIndividualUserDetailsSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid request body", error: result.error.message });
    }
    const { email } = result.data;
    const user = await Individual.findOne({ email }).select("-password");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User details fetched successfully", user: user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user details", error: error.message });
  }
};

// update individual user details
exports.updateIndividualUserDetails = async (req, res) => {
    // try with zod
    try {
    const result = updateIndividualUserDetailsSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ message: "Invalid request body", error: result.error.message });
    }
    // anyone field can be optional
    const { email, name, accountType, subCategory } = result.data;  
    const user = await Individual.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }
    user.name = name || user.name;
    user.accountType = accountType || user.accountType;
    user.subCategory = subCategory || user.subCategory;
    await user.save();
    res.status(200).json({ message: "User details updated successfully", user: user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user details", error: error.message });
  }
};


// delete individual user
exports.deleteIndividualUser = async (req, res) => {
  try {
    const result = deleteIndividualUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid request body", error: result.error.message });
    }
    const { email } = result.data;
    const user = await Individual.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error: error.message });
  }
};

// get all individual users
exports.getAllIndividualUsers = async (req, res) => {
  const users = await Individual.find().select("-password");
  res.status(200).json({ message: "All users fetched successfully", users: users });
};


