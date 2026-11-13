const taskService = require("../services/taskService");
const { sendSuccess, sendError } = require("../utils/responseHandler");

class TaskController {
  /**
   * POST /api/tasks
   * নতুন টাস্ক তৈরি
   */
  async createTask(req, res, next) {
    try {
      const { title, description, priority, category, tags, dueDate } = req.body;

      // ভ্যালিডেশন: টাইটেল ছাড়া টাস্ক তৈরি হতে দেওয়া যাবে না
      if (!title || !title.trim()) {
        return sendError(res, 400, "Task title is required");
      }

      // ইউজার আইডি (লগইন করা ইউজার থাকলে তার আইডি, নতুবা ডিফল্ট)
      const userId = req.user ? req.user.id : "default-user";

      const newTask = await taskService.createTask({
        title: title.trim(),
        description: description ? description.trim() : null,
        priority: priority || "MEDIUM",
        category: category || "General",
        tags: tags || [],
        dueDate,
        userId,
      });

      return sendSuccess(res, 201, "Task created successfully in PostgreSQL!", newTask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks
   * সমস্ত টাস্ক পাওয়া (সার্চ এবং ফিল্টার সহ)
   */
  async getAllTasks(req, res, next) {
    try {
      const { search, status, priority } = req.query;
      const userId = req.user ? req.user.id : null;

      const tasks = await taskService.getAllTasks({
        userId,
        search,
        status,
        priority,
      });

      return sendSuccess(res, 200, "Tasks fetched successfully", tasks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:id
   * নির্দিষ্ট একটি টাস্ক পাওয়া
   */
  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;

      const task = await taskService.getTaskById(id, userId);

      if (!task) {
        return sendError(res, 404, `Task with ID ${id} not found`);
      }

      return sendSuccess(res, 200, "Task fetched successfully", task);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:id
   * টাস্কের তথ্য বা স্ট্যাটাস আপডেট করা
   */
  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;
      const updates = req.body;

      // কিছু আপডেট করার না থাকলে এরর
      if (!updates || Object.keys(updates).length === 0) {
        return sendError(res, 400, "No fields provided to update");
      }

      const updatedTask = await taskService.updateTask(id, userId, updates);

      if (!updatedTask) {
        return sendError(res, 404, `Task with ID ${id} not found or unauthorized`);
      }

      return sendSuccess(res, 200, "Task updated successfully", updatedTask);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/tasks/:id
   * টাস্ক ডিলিট করা
   */
  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;

      const deleted = await taskService.deleteTask(id, userId);

      if (!deleted) {
        return sendError(res, 404, `Task with ID ${id} not found or unauthorized`);
      }

      return sendSuccess(res, 200, "Task deleted successfully from PostgreSQL", { id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();

