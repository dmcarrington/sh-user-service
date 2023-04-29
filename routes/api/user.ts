import { Router } from "express";
import { pseudoLogin, lnurlLogin, updateAccount } from "../../controllers/user";

const router = Router();

router.get("/login-lnurl", lnurlLogin);
router.get("/lnurl", pseudoLogin);
router.put("/update-account", updateAccount);

export default router;
