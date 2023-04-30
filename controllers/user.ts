import { Request, Response, NextFunction } from "express";
import { responseError } from "../helpers";
import lnurlServer from "../helpers/lnurl";
import { createLnbitsAccount } from "../helpers/lnbits";
import {
  addUserFromLN,
  updateUserAccount,
  createAccountByEmail,
  checkEmailUserExists,
  checkLNUserExists,
  addLnbitsAccount,
} from "../helpers/mongo";
import crypto from "crypto";

const Pusher = require("pusher");

export const loginWithEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const user = await checkEmailUserExists(req.body.email);
    if (user) {
      const pwd = crypto
        .createHash("sha256")
        .update(req.body.password)
        .digest("hex");
      if (pwd === user.password) {
        res.json(user);
        const email = user.email;
        const name = user.name;
        pusher.trigger("lnd-auth", "auth", {
          email,
          name,
        });
      } else {
        return responseError(res, 401, "unauthorized");
      }
    } else {
      return responseError(res, 401, "unauthorized");
    }
  } catch (err) {
    return responseError(res, 500, "error");
  }
};

export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (await createAccountByEmail(req.body)) {
      const lnbits = await createLnbitsAccount();
      await addLnbitsAccount({
        email: req.body.email,
        lnbitsUsername: lnbits?.user_name,
        lnbitsUserId: lnbits?.user_id,
        lnbitsWalletId: lnbits?.wallet_id,
        lnbitsWalletName: lnbits?.wallet_name,
      });
      res.json({ status: "OK" });
    } else {
      return responseError(res, 400, "Unable to create account");
    }
  } catch (err) {
    next(err);
  }
};

export const updateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const updatedAccount = req.body;
    console.log("updating account with new body " + req.body);
    if (await updateUserAccount(updatedAccount)) {
      res.json({ status: "OK" });
    } else {
      return responseError(res, 400, "Unable to update account");
    }
  } catch (err) {
    next(err);
  }
};

export const lnurlLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const result = await lnurlServer.generateNewUrl("login");
    res.send(result);
  } catch (err) {
    next(err);
  }
};

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

export const pseudoLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const query = req.query;
    if (query.key) {
      const key: string = String(query.key);

      // This will return false if this is the first time this user has logged in.
      // Expected, as these fields require a subsequent update to set them anyway.
      const user = await checkLNUserExists(key);
      let email = "";
      let name = "";
      if (user) {
        email = user.email;
        name = user.name;
      }

      pusher.trigger("lnd-auth", "auth", {
        key,
        email,
        name,
      });

      if (await addUserFromLN(key)) {
        const lnbits = await createLnbitsAccount();
        await addLnbitsAccount({
          email: req.body.email,
          lnbitsUsername: lnbits?.user_name,
          lnbitsUserId: lnbits?.user_id,
          lnbitsWalletId: lnbits?.wallet_id,
          lnbitsWalletName: lnbits?.wallet_name,
        });
      }
      // Send {status: "OK"} so the client acknowledges the login success
      res.json({ status: "OK" });
    } else {
      return responseError(res, 404, "Unsuccesful LNURL AUTH login");
    }
  } catch (err) {
    next(err);
  }
};
