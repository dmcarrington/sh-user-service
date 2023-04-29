import { Router } from "express";
import {
  pseudoLogin,
  lnurlLogin,
  updateAccount,
  createAccount,
} from "../../controllers/user";

const router = Router();

router.get("/login-lnurl", lnurlLogin);
router.get("/lnurl", pseudoLogin);
router.put("/update-account", updateAccount);
router.post("/signup-username", createAccount);

export default router;
