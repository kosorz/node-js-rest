import express from "express";
import validator from "express-validator";
import { signup, login } from "../controllers/auth";
import User from "../models/user";

const router = express.Router();

// PUT /auth/signup
router.put(
  "/signup",
  [
    validator
      .body("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value, { req }) => {
        let user;
        try {
          user = await User.findOne({ email: value });
        } catch (err) {
          err = new Error("DB connection failed!");
          return next(err);
        }

        if (user) {
          return Promise.reject("Email address already exists!");
        }
      })
      .normalizeEmail(),
    validator.body("password").trim().isLength({ min: 5 }),
    validator.body("name").trim().not().isEmpty(),
  ],
  signup
);

router.post("/login", login);

export default router;
