import validator from "express-validator";
import Post from "../models/post";

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
  try {
    const posts = await Post.find();
    res.status(200).json({
      posts: posts,
    });
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }
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

    if (!post) {
      const err = new Error("No post found, updated failed!");
      return next(err);
    }
  } catch (err) {
    err = new Error("DB connection failed!");
    return next(err);
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

  try {
    const deletedPost = await Post.deleteOne({ _id: postId });

    if (!deletedPost.deletedCount) {
      return next(new Error("Such post does not exist!"));
    }

    res.status(200).json({ message: "Post deleted!" });
  } catch (err) {
    err.message = "DB connection failed!";
    return next(err);
  }
};
