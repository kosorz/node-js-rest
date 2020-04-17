import validator from "express-validator";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

import Post from "../models/post";
import User from "../models/user";
import io from "../socket";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const getPost = async (req, res, next) => {
  const { postId } = req.params;

  let post;
  try {
    post = await Post.findById(postId);

    if (!post) {
      return next(new Error("Could not find post!"));
    }
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  let populatedPost;
  try {
    populatedPost = await post.populate("creator").execPopulate();
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  res.status(200).json({ message: "Post fetched!", post: populatedPost });
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
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  res.status(200).json({
    message: "Fetched posts successfully!",
    totalItems: totalItems,
    posts: posts,
  });
};

export const postPost = async (req, res, next) => {
  const errors = validator.validationResult(req);

  if (!errors.isEmpty()) {
    const err = new Error("Validation failed, entered data is incorrect!");
    err.statusCode = 422;
    return next(err);
  }

  if (!req.file) {
    const err = new Error("No image provided!");
    err.statusCode = 422;
    return next(err);
  }

  const imageUrl = req.file.path;
  const { title, content } = req.body;

  const post = new Post({
    title,
    content,
    imageUrl,
    creator: req.userId,
  });

  let savedPost;
  try {
    savedPost = await post.save();

    if (!savedPost) {
      const err = new Error("Saving failed!");
      return next(err);
    }
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  let user;
  try {
    user = await User.findById(req.userId);
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  user.posts.push(post);

  let savedUser;
  try {
    savedUser = await user.save();
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  const sendResponse = () => {
    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
    });
    res.status(201).json({
      message: "Post created successfully!",
      post: savedPost,
      creator: { _id: savedUser._id, name: savedUser.name },
    });
  };

  user && savedUser && sendResponse();
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
    err.statusCode = 422;
    return next(err);
  }

  let post;
  try {
    post = await Post.findById(postId).populate("creator");
  } catch (err) {
    err = new Error("DB connection failed!");
    return next(err);
  }

  if (!post) {
    const err = new Error("No post found, updated failed!");
    return next(err);
  }

  if (post.creator._id.toString() !== req.userId.toString()) {
    const err = new Error("Not authorized!");
    err.statusCode = 403;
    return next(err);
  }

  if (imageUrl !== post.imageUrl) {
    clearImage(post.imageUrl);
  }

  post.title = title;
  post.content = content;
  post.imageUrl = imageUrl;

  let updatedPost;
  try {
    updatedPost = await post.save();
  } catch (err) {
    err = new Error("DB connection failed!");
    return next(err);
  }

  const sendResponse = () => {
    io.getIO().emit("posts", {
      action: "update",
      post: updatedPost,
    });
    res.status(200).json({ message: "Post edited!" });
  };

  updatedPost && sendResponse();
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

  if (post.creator.toString() !== req.userId.toString()) {
    const err = new Error("Not authorized!");
    err.statusCode = 403;
    return next(err);
  }

  clearImage(post.imageUrl);

  let postDeleted;
  try {
    postDeleted = await Post.findByIdAndRemove(postId);
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  let user;
  try {
    user = await User.findById(req.userId);
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  user.posts.pull(postId);

  let savedUser;
  try {
    savedUser = await user.save();
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }

  const sendResponse = () => {
    io.getIO().emit("posts", {
      action: "delete",
      postId: postId,
    });
    res.status(200).json({ message: "Post deleted!" });
  };

  postDeleted && savedUser && sendResponse();
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => {
    console.log(err);
  });
};
