import express, { Router } from "express";
import {
  checkAuth,
  login,
  signup,
  updateProfile,
} from "../Controller/UserController.js";
import { protectRoute } from "../middleware/auth.js";

const userRouter = Router();

userRouter.post("/signup", signup);
userRouter.post("/login", login);
//use protect route method to verify user
userRouter.put("/update-profile", protectRoute, updateProfile);
userRouter.get("/check", protectRoute, checkAuth);

export default userRouter;
