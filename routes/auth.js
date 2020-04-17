import express from "express";
import validator from "express-validator";
import {
  getStatus,
  putSignup,
  putStatus,
  postLogin,
} from "../controllers/auth";
import User from "../models/user";
import isAuth from "../middleware/is-auth";

const router = express.Router();

router.get("/status", isAuth, getStatus);

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
  putSignup
);

router.put("/status", isAuth, putStatus);

router.post("/login", postLogin);

export default router;
