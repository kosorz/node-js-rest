import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import ioConnect from "socket.io";

import feedRoutes from "./routes/feed";
import authRoutes from "./routes/auth";

dotenv.config();
const __dirname = dirname(fileURLToPath(import.meta.url));
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const app = express();

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  const statusCode = err.statusCode || 500;
  const message = err.message;

  res.status(statusCode).json({ message });
});

let connected;
try {
  connected = mongoose.connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@node-training-7n0n7.mongodb.net/social?retryWrites=true&w=majority`
  );
} catch (err) {
  console.log(err);
}

const startUp = () => {
  const server = app.listen(8080);
  const io = ioConnect(server);

  io.on("connection", (socket) => {
    console.log("Client connected");
  });
};

connected && startUp();
