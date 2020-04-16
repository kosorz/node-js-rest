import express from "express";
import validator from "express-validator";
import {
  getPosts,
  postPost,
  getPost,
  deletePost,
  putPost,
} from "../controllers/feed";

import isAuth from "../middleware/is-auth";

const router = express.Router();

// GET /feed/post/:postId
router.get("/post/:postId", isAuth, getPost);
// GET /feed/posts
router.get("/posts", isAuth, getPosts);
// DELETE /feed/post/:postId
router.delete("/post/:postId", isAuth, deletePost);
// PUT /feed/post/:postId
router.put(
  "/post/:postId",
  isAuth,
  [
    validator.body("title").trim().isLength({ min: 5 }),
    validator.body("content").trim().isLength({ min: 5 }),
  ],
  putPost
);
// POST /feed/post
router.post(
  "/post",
  isAuth,
  [
    validator.body("title").trim().isLength({ min: 5 }),
    validator.body("content").trim().isLength({ min: 5 }),
  ],
  postPost
);

export default router;
