const supabase = require("../config/supabase");

/**
 * Task Service - সরাসরি Supabase (PostgreSQL) এর সাথে ডেটাবেস অপারেশন চালায়
 */
class TaskService {
  /**
   * ১. নতুন টাস্ক তৈরি করা (CREATE)
   * SQL সমতুল্য: INSERT INTO tasks (...) VALUES (...) RETURNING *;
   */
  async createTask({ title, description, priority, category, tags, dueDate, userId }) {
    // a. tasks টেবিলে মূল রেকর্ড ইনসার্ট করা
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          description: description || null,
          priority: priority || "MEDIUM",
          status: "TODO",
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          user_id: userId || "default-user",
        },
      ])
      .select()
      .single();

    if (taskError) {
      console.error("Supabase Insert Error:", taskError);
      throw new Error(`Failed to create task: ${taskError.message}`);
    }

    return task;
  }

  /**
   * ২. সকল টাস্ক আনা (READ ALL / FILTER)
   * SQL সমতুল্য: SELECT * FROM tasks WHERE user_id = ... ORDER BY created_at DESC;
   */
  async getAllTasks({ userId, search, status, priority }) {
    let query = supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    // যদি নির্দিষ্ট ইউজারের টাস্ক ফিল্টার করতে হয়
    if (userId) {
      query = query.eq("user_id", userId);
    }

    // স্ট্যাটাস ফিল্টার
    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }

    // প্রায়োরিটি ফিল্টার
    if (priority && priority !== "ALL") {
      query = query.eq("priority", priority);
    }

    // সার্চ কুয়েরি (ilike = case-insensitive search)
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Fetch Error:", error);
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * ৩. নির্দিষ্ট একটি টাস্ক আনা (READ SINGLE)
   * SQL সমতুল্য: SELECT * FROM tasks WHERE id = :id LIMIT 1;
   */
  async getTaskById(id, userId) {
    let query = supabase.from("tasks").select("*").eq("id", id);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    return data;
  }

  /**
   * ৪. টাস্ক আপডেট করা (UPDATE / PATCH)
   * SQL সমতুল্য: UPDATE tasks SET ... WHERE id = :id RETURNING *;
   */
  async updateTask(id, userId, updateFields) {
    // updated_at টাইমস্ট্যাম্প আপডেট করা
    const payload = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    let query = supabase.from("tasks").update(payload).eq("id", id);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error("Supabase Update Error:", error);
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return data;
  }

  /**
   * ৫. টাস্ক ডিলিট করা (DELETE)
   * SQL সমতুল্য: DELETE FROM tasks WHERE id = :id;
   */
  async deleteTask(id, userId) {
    let query = supabase.from("tasks").delete().eq("id", id);

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error("Supabase Delete Error:", error);
      throw new Error(`Failed to delete task: ${error.message}`);
    }

    return data && data.length > 0;
  }
}

module.exports = new TaskService();

