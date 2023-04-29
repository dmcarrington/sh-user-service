import { Request, Response, NextFunction } from "express";
import { responseError } from "../helpers";
import lnurlServer from "../helpers/lnurl";
import { addUserFromLN, updateUserAccount } from "../helpers/mongo";
const Pusher = require("pusher");

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

      pusher.trigger("lnd-auth", "auth", {
        key,
      });

      addUserFromLN(key);
      // Send {status: "OK"} so the client acknowledges the login success
      res.json({ status: "OK" });
    } else {
      return responseError(res, 404, "Unsuccesful LNURL AUTH login");
    }
  } catch (err) {
    next(err);
  }
};
