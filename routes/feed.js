import express from "express";
import validator from "express-validator";
import {
  getPosts,
  postPost,
  getPost,
  deletePost,
  putPost,
} from "../controllers/feed";

const router = express.Router();

// GET /feed/post/:postId
router.get("/post/:postId", getPost);
// GET /feed/posts
router.get("/posts", getPosts);
// DELETE /feed/post/:postId
router.delete("/post/:postId", deletePost);
// PUT /feed/post/:postId
router.put(
  "/post/:postId",
  [
    validator.body("title").trim().isLength({ min: 5 }),
    validator.body("content").trim().isLength({ min: 5 }),
  ],
  putPost
);
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
