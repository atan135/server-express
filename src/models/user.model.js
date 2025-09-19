const db = require("../utils/database.util");
const bcrypt = require("bcryptjs");

class UserModel {
  // Create a new user
  static async create(userData) {
    const { username, email, password, roleid, fullName } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (username, email, password, roleid, fullName) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, roleid, fullName]
    );

    return {
      id: result.insertId,
      username,
      email,
      roleid,
      fullName,
    };
  }

  // check username or email is exists
  static async checkUsernameOrEmail(username, email) {
    const [rows] = await db.query(
      "SELECT id, username, email, password FROM users WHERE username = ? OR email = ?",
      [username, email]
    );
    return rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const [rows] = await db.query(
      "SELECT id, username, email, password FROM users WHERE email = ?",
      [email]
    );

    return rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const [rows] = await db.query(
      "SELECT id, username, email, password FROM users WHERE username = ?",
      [username]
    );

    return rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const [rows] = await db.query(
      "SELECT id, username, email FROM users WHERE id = ?",
      [id]
    );

    return rows[0];
  }

  static async findAll() {
    const [rows] = await db.query("SELECT id, username, email FROM users ");

    return rows;
  }

  // get role
  static async getRole(name) {
    const [rows] = await db.query("SELECT id, rolename, paramlist FROM roles WHERE rolename = ?", [name]);
    return rows[0];
  }
}

module.exports = UserModel;
