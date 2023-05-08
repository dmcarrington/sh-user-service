import { Request, Response, NextFunction } from "express";
import { responseError } from "../helpers";
import lnurlServer from "../helpers/lnurl";
import { createLnbitsAccount } from "../helpers/lnbits";
import {
  createMongoAccount,
  updateUserAccount,
  checkEmailUserExists,
  checkLNUserExists,
  addLnbitsAccount,
  addNostrAccount,
  getMongoAccountIds,
} from "../helpers/mongo";
import { generateKeys } from "../helpers/nostr";
import { NostrAccount } from "../interfaces/nostr";
import { LnbitsAccount } from "../interfaces/lnbits";
import crypto from "crypto";

// Instantiate Pusher as an alternative to websockets so we can deploy the FE on Vercel
const Pusher = require("pusher");
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Generate Nostr keys and save them to account in Mongo
async function initialiseNostrAccount(identifier: any) {
  const nostrKeys = await generateKeys();
  let nostrAccount: NostrAccount = {
    sk: nostrKeys.sk,
    pk: nostrKeys.pk,
    lnurlKey: "",
    email: "",
  };

  if (identifier.key) {
    nostrAccount.lnurlKey = identifier.key;
  } else if (identifier.email) {
    nostrAccount.email = identifier.email;
  }

  return await addNostrAccount(nostrAccount);
}

// Generate lnbits user and wallet, and save to our account in Mongo
async function initialiseLnbitsAccount(identifier: any) {
  const lnbits = await createLnbitsAccount();
  if (lnbits) {
    let lnbitsAccount: LnbitsAccount = {
      lnurlKey: "",
      email: "",
      lnbitsUserId: lnbits.user_id,
      lnbitsUsername: lnbits.user_name,
      lnbitsWalletId: lnbits.wallet_id,
      lnbitsWalletName: lnbits.wallet_name,
    };
    if (identifier.key) {
      lnbitsAccount.lnurlKey = identifier.key;
    } else if (identifier.email) {
      lnbitsAccount.email = identifier.email;
    }
    return await addLnbitsAccount(lnbitsAccount);
  } else {
    console.log("failed to create lnbits account for user!");
    return false;
  }
}

// verify login with email account & password
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
        const nostrSk = user.nostrSk;
        const nostrPk = user.nostrPk;
        pusher.trigger("lnd-auth", "auth", {
          email,
          name,
          nostrSk,
          nostrPk,
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

// Create an account authenticated from username & password as alternative to lnurl
export const createAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    if (await createMongoAccount(req.body)) {
      await initialiseLnbitsAccount({ email: req.body.email });
      await initialiseNostrAccount({ email: req.body.email });
      res.json({ status: "OK" });
    } else {
      return responseError(res, 400, "Unable to create account");
    }
  } catch (err) {
    next(err);
  }
};

// Update optional fields on the account
export const updateAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const updatedAccount = req.body;
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

// handle the actual login via lnurl as a callback
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
      let nostrSk = "";
      let nostrPk = "";
      if (user) {
        email = user.email;
        name = user.name;
        nostrSk = user.nostrSk;
        nostrPk = user.nostrPk;
      }

      pusher.trigger("lnd-auth", "auth", {
        key,
        email,
        name,
        nostrSk,
        nostrPk,
      });

      if (await createMongoAccount({ key: key })) {
        await initialiseLnbitsAccount({ key: key });
        await initialiseNostrAccount({ key: key });
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

// Return a list of all identifiers (lnurlKey or email) of all users on the system
export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const accountIDs = await getMongoAccountIds();
    res.json({ accountIDs });
  } catch (err) {
    next(err);
  }
};
