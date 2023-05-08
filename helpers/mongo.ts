let mongoose = require("mongoose");
import "dotenv/config";
const crypto = require("crypto");
import { NostrAccount } from "../interfaces/nostr";
import { LnbitsAccount } from "../interfaces/lnbits";

// connect to mongo, for now on our local docker network
const mongoURI = process.env.MONGO_CONNECTION_STRING;
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to mongo 🌳: " + mongoURI));

let userSchema = new mongoose.Schema({
  lnurlKey: String, // key for the user if signed in via lnurl
  name: String, // Optional given name property
  email: String, // Email address required for regular login, optional if using lnurl
  password: String, // Password required if using regular login
  lnbitsUsername: String, // username for our lnbits account (uuid)
  lnbitsUserId: String, // lnbits local user id
  lnbitsWalletName: String, // name of the above user's lbnits account (always 'satoshis_hive' for now)
  lnbitsWalletId: String, // lnbits local wallet id
  nostrSk: String, // Nostr secret key for this account
  nostrPk: String, // Nostr public key for this account
});

// Instantiate user schema
let users = mongoose.model("users", userSchema);

// Check if a user with a given key exists
export async function checkLNUserExists(key: any) {
  let existingUser = await users.findOne({ lnurlKey: key });
  if (existingUser) {
    return existingUser;
  } else {
    return false;
  }
}

// Check if a user with a given email exists
export async function checkEmailUserExists(emailAddress: any) {
  let existingUsers = await users.findOne({ email: emailAddress });
  if (existingUsers) {
    return existingUsers;
  } else {
    return false;
  }
}

// create a local account object either based on our lnurl key or email address
export async function createMongoAccount(params: any) {
  if (params.key) {
    if (await checkLNUserExists(params.key)) {
      return false;
    } else {
      if (await users.create({ lnurlKey: params.key })) return true;
    }
  } else if (params.email) {
    let existingUser = await users.findOne({ email: params.email });
    if (existingUser) {
      return false;
    } else {
      const pwd = crypto
        .createHash("sha256")
        .update(params.password)
        .digest("hex");
      if (await users.create({ email: params.email, password: pwd }))
        return true;
    }
  } else {
    console.log("Creating account requires key or email");
    return false;
  }
}

// Update account details for a single account identifed by key or email
export async function updateUserAccount(newAccountDetails: any) {
  if (newAccountDetails.lnurlKey) {
    // update based on lnurlKey
    console.log("updating account: " + newAccountDetails.lnurlKey);
    const res = await users.updateOne(
      { lnurlKey: newAccountDetails.lnurlKey },
      {
        $set: {
          email: newAccountDetails.email,
          name: newAccountDetails.name,
        },
        $currentDate: { lastModified: true },
      }
    );
    if (res.modifiedCount == 1) {
      return true;
    }
    return false;
  } else if (newAccountDetails.email) {
    // update based on email
    const res = await users.updateOne(
      { email: newAccountDetails.email },
      {
        $set: {
          name: newAccountDetails.name,
        },
        $currentDate: { lastModified: true },
      }
    );
    if (res.modifiedCount == 1) {
      return true;
    }
    return false;
  }
}

// Add lnbits details for a single account identifed by key or email
export async function addLnbitsAccount(newAccountDetails: LnbitsAccount) {
  if (newAccountDetails.lnurlKey) {
    // update based on lnurlKey
    const res = await users.updateOne(
      { lnurlKey: newAccountDetails.lnurlKey },
      {
        $set: {
          lnbitsUsername: newAccountDetails.lnbitsUsername,
          lnbitsUserId: newAccountDetails.lnbitsUserId,
          lnbitsWalletName: newAccountDetails.lnbitsWalletName,
          lnbitsWalletId: newAccountDetails.lnbitsWalletId,
        },
        $currentDate: { lastModified: true },
      }
    );
    if (res.modifiedCount == 1) {
      return true;
    }
    return false;
  } else if (newAccountDetails.email) {
    // update based on email
    const res = await users.updateOne(
      { email: newAccountDetails.email },
      {
        $set: {
          lnbitsUsername: newAccountDetails.lnbitsUsername,
          lnbitsUserId: newAccountDetails.lnbitsUserId,
          lnbitsWalletName: newAccountDetails.lnbitsWalletName,
          lnbitsWalletId: newAccountDetails.lnbitsWalletId,
        },
        $currentDate: { lastModified: true },
      }
    );
    if (res.modifiedCount == 1) {
      return true;
    }
    return false;
  }
}

// Add Nostr secret and public keys to the account in Mongo
export async function addNostrAccount(nostrAccount: NostrAccount) {
  if (nostrAccount.email) {
    return await users.updateOne(
      { email: nostrAccount.email },
      {
        $set: {
          nostrSk: nostrAccount.sk,
          nostrPk: nostrAccount.pk,
        },
        $currentDate: { lastModified: true },
      }
    );
  } else if (nostrAccount.lnurlKey) {
    return await users.updateOne(
      { lnurlKey: nostrAccount.lnurlKey },
      {
        $set: {
          nostrSk: nostrAccount.sk,
          nostrPk: nostrAccount.pk,
        },
        $currentDate: { lastModified: true },
      }
    );
  } else {
    console.log("no account identifier provided");
    return false;
  }
}

// Return the identifier (email or lnurl key) of all users on our system
export async function getMongoAccountIds() {
  const accounts = users.find({}, { lnurlKey: 1, email: 1, _id: 0 });
  return accounts;
}
