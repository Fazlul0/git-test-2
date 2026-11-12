(function () {
  "use strict";

  const STORAGE_KEY = "todo.items";
  const FILTERS = ["all", "active", "completed"];

  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyState = document.getElementById("empty-state");
  const countLabel = document.getElementById("todo-count");
  const filterButtons = Array.from(document.querySelectorAll(".filter"));
  const clearCompletedButton = document.getElementById("clear-completed");

  let items = loadItems();
  let currentFilter = "all";

  function loadItems() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.text === "string")
        .map((item) => ({
          id: String(item.id),
          text: item.text,
          completed: Boolean(item.completed),
        }));
    } catch (error) {
      console.warn("Could not read saved todos:", error);
      return [];
    }
  }

  function saveItems() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Could not save todos:", error);
    }
  }

  function visibleItems() {
    if (currentFilter === "active") return items.filter((item) => !item.completed);
    if (currentFilter === "completed") return items.filter((item) => item.completed);
    return items;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function addItem(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    items.push({ id: createId(), text: trimmed, completed: false });
    saveItems();
    render();
    input.value = "";
    input.focus();
  }

  function toggleItem(id) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    item.completed = !item.completed;
    saveItems();
    render();
  }

  function deleteItem(id) {
    items = items.filter((entry) => entry.id !== id);
    saveItems();
    render();
  }

  function clearCompleted() {
    items = items.filter((entry) => !entry.completed);
    saveItems();
    render();
  }

  function render() {
    const shown = visibleItems();
    list.replaceChildren();

    shown.forEach((item) => {
      const li = document.createElement("li");
      li.className = item.completed ? "todo-item done" : "todo-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = item.completed;
      checkbox.setAttribute("aria-label", `Mark "${item.text}" as completed`);
      checkbox.addEventListener("change", () => toggleItem(item.id));

      const text = document.createElement("span");
      text.textContent = item.text;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Delete "${item.text}"`);
      remove.addEventListener("click", () => deleteItem(item.id));

      li.append(checkbox, text, remove);
      list.appendChild(li);
    });

    const remaining = items.filter((item) => !item.completed).length;
    countLabel.textContent = `${remaining} item${remaining === 1 ? "" : "s"} left`;
    emptyState.hidden = shown.length > 0;
    clearCompletedButton.hidden = !items.some((item) => item.completed);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    addItem(input.value);
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      if (!FILTERS.includes(filter)) return;
      currentFilter = filter;
      filterButtons.forEach((other) => other.classList.toggle("active", other === button));
      render();
    });
  });

  clearCompletedButton.addEventListener("click", clearCompleted);

  render();
})();
