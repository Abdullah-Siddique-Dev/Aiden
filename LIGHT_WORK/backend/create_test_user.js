import bcrypt from "bcryptjs";
import { db } from "./db.js";
import { nanoid } from "nanoid";

// Create a test user with known credentials
const testEmail = "demo@test.com";
const testPassword = "test123";
const testName = "Demo User";

// Check if user already exists
const existing = db.prepare("SELECT id, email FROM users WHERE email = ?").get(testEmail);

if (existing) {
  console.log(`\n✓ User already exists with email: ${testEmail}`);
  console.log(`  User ID: ${existing.id}`);
  
  // Update the password to our known one
  const password_hash = bcrypt.hashSync(testPassword, 10);
  db.prepare("UPDATE users SET password_hash = ?, name = ? WHERE email = ?")
    .run(password_hash, testName, testEmail);
  
  console.log(`✓ Password has been reset to: ${testPassword}`);
} else {
  // Create new user
  const id = nanoid();
  const password_hash = bcrypt.hashSync(testPassword, 10);
  
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, disability_type, language)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, testName, testEmail, password_hash, "none", "en");
  
  console.log(`\n✓ New test user created successfully!`);
}

console.log(`\n========================================`);
console.log(`🔐 TEST CREDENTIALS:`);
console.log(`========================================`);
console.log(`Email:    ${testEmail}`);
console.log(`Password: ${testPassword}`);
console.log(`========================================\n`);

// Verify the login works
const user = db.prepare("SELECT * FROM users WHERE email = ?").get(testEmail);
const isValid = bcrypt.compareSync(testPassword, user.password_hash);

if (isValid) {
  console.log(`✅ Login verification SUCCESSFUL!`);
  console.log(`   You can now log in with these credentials.`);
} else {
  console.log(`❌ Login verification FAILED!`);
}

console.log(`\n`);
