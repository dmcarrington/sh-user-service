import { Router } from "express";
import {
  pseudoLogin,
  lnurlLogin,
  updateAccount,
  createAccount,
  loginWithEmail,
  getUsers,
} from "../../controllers/user";

const router = Router();

router.get("/login-lnurl", lnurlLogin);
router.get("/lnurl", pseudoLogin);
router.put("/update-account", updateAccount);
router.post("/signup-username", createAccount);
router.post("/login-email", loginWithEmail);
router.get("/list-users", getUsers);

export default router;
