import { hashInternalPassword } from "./security.js";

const password = process.env.INTERNAL_TEST_PASSWORD;

if (!password) {
  console.error("Set INTERNAL_TEST_PASSWORD in the environment before running this command.");
  process.exit(1);
}

console.log(hashInternalPassword(password));
