import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "aiden.db"));

const users = db.prepare("SELECT id, name, email, disability_type, created_at FROM users").all();

if (users.length === 0) {
  console.log("No users found in the database.");
  console.log("\n📝 You need to SIGN UP to create an account.");
  console.log("Go to http://localhost:5173 and click 'Sign Up' to register.");
} else {
  console.log(`Found ${users.length} user(s):\n`);
  users.forEach((user, i) => {
    console.log(`${i + 1}. Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Type: ${user.disability_type}`);
    console.log(`   Created: ${user.created_at}\n`);
  });
}

db.close();
