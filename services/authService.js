const crypto = require("crypto");
const supabase = require("../config/supabase");

// পাসওয়ার্ড হ্যাশ করার জন্য নোডের বিল্ট-ইন ক্রিপ্টো হেল্পার
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [salt, key] = storedHash.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === key;
};

class AuthService {
  /**
   * ইউজার রেজিস্ট্রেশন
   */
  async register({ name, email, password }) {
    // ১. ইমেইল ডুপ্লিকেট কি না চেক করা
    const { data: existingUser } = await supabase
      .from("user")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (existingUser) {
      const error = new Error("An account with this email already exists");
      error.statusCode = 409;
      throw error;
    }

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // ২. "user" টেবিলে প্রোফাইল ডাটা ইনসার্ট করা
    const { data: user, error: userError } = await supabase
      .from("user")
      .insert([
        {
          id: userId,
          name: name.trim(),
          email: email.toLowerCase().trim(),
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        },
      ])
      .select("id, name, email, createdAt")
      .single();

    if (userError) {
      console.error("User insert error:", userError);
      throw new Error(`Failed to create user: ${userError.message}`);
    }

    // ৩. "account" টেবিলে পাসওয়ার্ড হ্যাশ সংরক্ষণ করা
    const hashedPassword = hashPassword(password);
    const { error: accountError } = await supabase.from("account").insert([
      {
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId: userId,
        password: hashedPassword,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    if (accountError) {
      console.error("Account insert error:", accountError);
      throw new Error(`Failed to store credentials: ${accountError.message}`);
    }

    // ৪. ইউজারের জন্য সেশন তৈরি করা
    const session = await this.createSession(userId);

    return { user, session };
  }

  /**
   * ইউজার লগইন
   */
  async login({ email, password }) {
    // ১. ইউজার খোঁজা
    const { data: user, error: userError } = await supabase
      .from("user")
      .select("id, name, email")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (userError || !user) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // ২. পাসওয়ার্ড চেক করা
    const { data: account, error: accountError } = await supabase
      .from("account")
      .select("password")
      .eq("userId", user.id)
      .eq("providerId", "credential")
      .single();

    if (accountError || !account || !account.password) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    const isValid = verifyPassword(password, account.password);
    if (!isValid) {
      const error = new Error("Invalid email or password");
      error.statusCode = 401;
      throw error;
    }

    // ৩. সেশন তৈরি করা
    const session = await this.createSession(user.id);

    return { user, session };
  }

  /**
   * অ্যাক্টিভ সেশন তৈরি করা
   */
  async createSession(userId, ipAddress = null, userAgent = null) {
    const sessionId = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex");
    const now = new Date();
    // সেশন ভ্যালিডিটি: ৭ দিন
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: session, error } = await supabase
      .from("session")
      .insert([
        {
          id: sessionId,
          token,
          userId,
          expiresAt,
          ipAddress,
          userAgent,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ])
      .select("token, expiresAt")
      .single();

    if (error) {
      console.error("Session creation error:", error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return session;
  }

  /**
   * সেশন টোকেন ভ্যালিডেট করা
   */
  async getSessionUser(token) {
    if (!token) return null;

    const { data: session, error } = await supabase
      .from("session")
      .select(`
        id,
        token,
        expiresAt,
        user:userId ( id, name, email )
      `)
      .eq("token", token)
      .single();

    if (error || !session) return null;

    // সেশন কি এক্সপায়ার হয়ে গেছে?
    if (new Date(session.expiresAt) < new Date()) {
      await supabase.from("session").delete().eq("id", session.id);
      return null;
    }

    return session.user;
  }

  /**
   * সেশন ডিলিট / লগআউট
   */
  async logout(token) {
    if (!token) return;
    await supabase.from("session").delete().eq("token", token);
  }
}

module.exports = new AuthService();

