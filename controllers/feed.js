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
    error.status = 422;
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
