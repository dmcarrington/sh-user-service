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

// Instantiate user schema
let users = mongoose.model("users", userSchema);

// Check if a user with a given key exists
async function checkLNUserExists(key: any) {
  let existingUsers = await users.findOne({ lnurlKey: key });
  if (existingUsers) {
    return true;
  } else {
    return false;
  }
}

// Create an account with a given key if it does not yet exist
export async function addUserFromLN(key: any) {
  if (!(await checkLNUserExists(key))) {
    console.log("creating account: " + key);
    try {
      await users.create({ lnurlKey: key });
    } catch (err) {
      console.log("Error creating account: " + err);
    }
  } else {
    console.log("user exists, not creating");
  }
}
