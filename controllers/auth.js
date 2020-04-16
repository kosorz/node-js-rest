import User from "../models/user";
import validator from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const signup = async (req, res, next) => {
  const errors = validator.validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validation failed");
    err.statusCode = 422;
    next(err);
  }

  const { email, name, password } = req.body;

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    next(err);
  }

  const user = new User({ name, email, posts: [], password: hashedPassword });

  let savedUser;
  try {
    savedUser = await user.save();
  } catch (err) {
    err.message = "Saving user in DB failed!";
    return next(err);
  }

  res.status(201).json({ message: "User created!", userId: savedUser._id });
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  let user;
  try {
    user = await User.findOne({ email: email });

    if (!user) {
      const err = new Error("User not found in db!");
      err.statusCode = 401;
      next(err);
    }
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  let match;
  try {
    match = await bcrypt.compare(password, user.password);

    if (!match) {
      const err = new Error("Wrong password!");
      err.statusCode = 401;
      next(err);
    }
  } catch (err) {
    return next(err);
  }

  const token = jwt.sign(
    { email: user.email, userId: user._id.toString() },
    "secret_to_sign",
    { expiresIn: "1h" }
  );

  match && res.status(200).json({ userId: user._id.toString(), token });
};
