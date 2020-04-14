import validator from "express-validator";
import Post from "../models/post";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const getPost = async (req, res, next) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return next(new Error("Could not find post!"));
    }

    res.status(200).json({ message: "Post fetched!", post: post });
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }
};

export const getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  let totalItems;
  try {
    totalItems = await Post.find().countDocuments();
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  let posts;
  try {
    posts = await Post.find()
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
  } catch (err) {
    err.message = "DB connection failed! 12312312";
    return next(err);
  }

  res.status(200).json({
    message: "Fetched posts successfully!",
    totalItems: totalItems,
    posts: posts,
  });
};

export const postPost = async (req, res, next) => {
  const { title, content } = req.body;
  const errors = validator.validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    return next(err);
  }

  if (!req.file) {
    const err = new Error("No image provided!");
    err.status = 422;
    return next(err);
  }

  const imageUrl = req.file.path;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: { name: "Jarek" },
  });

  try {
    const savedPost = await post.save();
    res.status(201).json({
      message: "Post created successfully!",
      post: savedPost,
    });
  } catch (err) {
    err.message = "Saving failed!";
    return next(err);
  }
};

export const putPost = async (req, res, next) => {
  const { title, content } = req.body;
  const { postId } = req.params;
  const errors = validator.validationResult(req);

  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }

  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    return next(err);
  }

  if (!imageUrl) {
    const err = new Error("No image provided, no image fallback!");
    err.status = 422;
    return next(err);
  }

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    err = new Error("DB connection failed!");
    return next(err);
  }

  if (!post) {
    const err = new Error("No post found, updated failed!");
    return next(err);
  }

  if (imageUrl !== post.image) {
    clearImage(post.imageUrl);
  }

  post.title = title;
  post.content = content;
  post.imageUrl = imageUrl;

  try {
    const updatedPost = await post.save();
    res.status(201).json({
      message: "Post updated successfully!",
      post: updatedPost,
    });
  } catch (err) {
    err = new Error("DB connection failed!");
    return next(err);
  }
};

export const deletePost = async (req, res, next) => {
  const { postId } = req.params;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  if (!post) {
    const err = new Error("No post found, deleting failed!");
    return next(err);
  }

  if (true) {
    // check logged if belongs to logged user
    clearImage(post.imageUrl);
  }

  let postDeleted;
  try {
    postDeleted = await Post.findByIdAndRemove(postId);
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  postDeleted && res.status(200).json({ message: "Post deleted!" });
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    console.log(err);
  });
};
