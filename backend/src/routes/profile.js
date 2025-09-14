import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import UserAccount from "../models/UserAccount.js";


const r = Router();
r.get("/me", requireAuth, async (req, res) => {
  const me = await UserAccount.findById(req.user.sub).select("_id name email createdAt");
  res.json(me);
});
export default r;

