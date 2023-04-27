let mongoose = require("mongoose");
import "dotenv/config";

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
});

let users = mongoose.model("users", userSchema);

async function checkLNUserExists(key: any) {
  let existingUsers = await users.find().where("lnurlKey").eq(key);
  if (existingUsers) {
    return true;
  } else {
    return false;
  }
}

export async function addUserFromLN(key: any) {
  if (!checkLNUserExists(key)) {
    await users.create({ lnurlKey: key });
  }
}
