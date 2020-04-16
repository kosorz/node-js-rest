import jwt from "jsonwebtoken";

export default (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    const err = new Error("No auth header!");
    err.statusCode = 401;
    next(err);
  }

  const token = req.get("Authorization").split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "secret_to_sign");
  } catch (err) {
    next(err);
  }

  if (!decodedToken) {
    const err = new Error("Not authenticated!");
    err.statusCode = 401;
    next(err);
  }

  req.userId = decodedToken.userId;
  next();
};
