import React, { useState } from "react";
import "./TasksReminders.css";

export interface TaskItem {
  id: string;
  title: string;
  time?: string;
  category: "engineering" | "robotics" | "daily";
  priority: "normal" | "high" | "urgent";
  done: boolean;
  createdAt: string;
}

export interface TasksRemindersProps {
  onStartFocusOnTask: (taskTitle: string) => void;
}

type FilterType = "all" | "today" | "scheduled" | "completed";

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "task-1",
    title: "ESP32 WROOM-32 breadboard bench wiring & servo sweep",
    time: "Today 16:00",
    category: "robotics",
    priority: "urgent",
    done: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Test Mosquitto MQTT stunt topics (rufus/dog1/cmd/stunt)",
    time: "Today 18:30",
    category: "robotics",
    priority: "high",
    done: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Verify LangGraph acyclic DAG invariants & tool allowlists",
    time: "Tonight 22:00",
    category: "engineering",
    priority: "normal",
    done: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-4",
    title: "Review RECALL_TESTS.md questions for evening competency check",
    time: "Tonight 23:59",
    category: "daily",
    priority: "high",
    done: false,
    createdAt: new Date().toISOString(),
  },
];

export const TasksReminders: React.FC<TasksRemindersProps> = ({ onStartFocusOnTask }) => {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPriority, setNewPriority] = useState<"normal" | "high" | "urgent">("normal");
  const [newCategory, setNewCategory] = useState<"engineering" | "robotics" | "daily">("engineering");

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      time: newTime.trim() || undefined,
      category: newCategory,
      priority: newPriority,
      done: false,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTitle("");
    setNewTime("");
  };

  const handleToggleDone = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "completed") return t.done;
    if (activeFilter === "today") return !t.done && t.time?.toLowerCase().includes("today");
    if (activeFilter === "scheduled") return !t.done && Boolean(t.time);
    return true;
  });

  const countForFilter = (filter: FilterType) => {
    if (filter === "completed") return tasks.filter((t) => t.done).length;
    if (filter === "today") return tasks.filter((t) => !t.done && t.time?.toLowerCase().includes("today")).length;
    if (filter === "scheduled") return tasks.filter((t) => !t.done && Boolean(t.time)).length;
    return tasks.length;
  };

  return (
    <div className="tasks-reminders-container">
      {/* Top Creation Bar */}
      <form className="task-add-form" onSubmit={handleAddTask}>
        <div className="task-input-row">
          <input
            type="text"
            className="task-title-input"
            placeholder="Add an action item or reminder..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <input
            type="text"
            className="task-time-input"
            placeholder="Due time (e.g. Today 18:00)"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />

          <select
            className="task-select"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as any)}
          >
            <option value="normal">Normal Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent</option>
          </select>

          <select
            className="task-select"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
          >
            <option value="engineering">#engineering</option>
            <option value="robotics">#robotics</option>
            <option value="daily">#daily</option>
          </select>

          <button type="submit" className="task-add-btn" disabled={!newTitle.trim()}>
            Add Task
          </button>
        </div>
      </form>

      {/* Filter Tabs & Privacy Indicator */}
      <div className="tasks-filter-bar">
        <div className="filter-chips-cluster">
          {(["all", "today", "scheduled", "completed"] as FilterType[]).map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-chip ${activeFilter === f ? "active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              <span>{f.toUpperCase()}</span>
              <span className="chip-badge">{countForFilter(f)}</span>
            </button>
          ))}
        </div>

        <div className="task-privacy-pill" title="Stored locally on PC. Zero external telemetry.">
          <span className="privacy-dot" />
          <span>Local Private Core</span>
        </div>
      </div>

      {/* Tasks Feed List */}
      <div className="tasks-list-feed">
        {filteredTasks.length === 0 ? (
          <div className="tasks-empty-card">
            <span className="tasks-empty-icon">✓</span>
            <h4>No Tasks in this Filter</h4>
            <p>You're completely clear. Add a task above to schedule an action item.</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className={`task-row-card ${task.done ? "done" : ""}`}>
              {/* Checkbox */}
              <div
                className={`task-checkbox ${task.done ? "checked" : ""}`}
                onClick={() => handleToggleDone(task.id)}
              >
                {task.done && <span className="check-mark">✓</span>}
              </div>

              {/* Task Details */}
              <div className="task-content-col" onClick={() => handleToggleDone(task.id)}>
                <span className={`task-title-text ${task.done ? "strikethrough" : ""}`}>
                  {task.title}
                </span>

                <div className="task-meta-tags">
                  <span className={`priority-tag ${task.priority}`}>
                    {task.priority === "urgent" ? "🔴 Urgent" : task.priority === "high" ? "🟡 High" : "Normal"}
                  </span>

                  <span className="category-tag">#{task.category}</span>

                  {task.time && (
                    <span className="time-badge">
                      ⏰ {task.time}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Shortcuts */}
              <div className="task-actions-col">
                {!task.done && (
                  <button
                    type="button"
                    className="start-focus-btn"
                    onClick={() => onStartFocusOnTask(task.title)}
                    title="Launch 25m Focus Session dedicated to this task"
                  >
                    <span>▶</span>
                    <span>Start Focus</span>
                  </button>
                )}

                <button
                  type="button"
                  className="task-delete-btn"
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
