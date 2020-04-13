import express from "express";
import validator from "express-validator";
import { getPosts, postPost, getPost } from "../controllers/feed";

const router = express.Router();

router.get("/post/:postId", getPost);
// GET /feed/posts
router.get("/posts", getPosts);

// POST /feed/post
router.post(
  "/post",
  [
    validator.body("title").trim().isLength({ min: 5 }),
    validator.body("content").trim().isLength({ min: 5 }),
  ],
  postPost
);

export default router;
