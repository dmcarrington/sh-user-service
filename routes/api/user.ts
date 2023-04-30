import { Router } from "express";
import {
  pseudoLogin,
  lnurlLogin,
  updateAccount,
  createAccount,
  loginWithEmail,
} from "../../controllers/user";

const router = Router();

router.get("/login-lnurl", lnurlLogin);
router.get("/lnurl", pseudoLogin);
router.put("/update-account", updateAccount);
router.post("/signup-username", createAccount);
router.post("/login-email", loginWithEmail);

export default router;
