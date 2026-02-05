import React, { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";

function SortableTask({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={onClick} dragging={isDragging} />
    </div>
  );
}

const COLS = [
  { id: "todo", title: "To do", tone: "neutral" },
  { id: "doing", title: "Doing", tone: "secondary" },
  { id: "blocked", title: "Blocked", tone: "warning" },
  { id: "done", title: "Done", tone: "success" }
];

export function KanbanBoard({ tasks, onOpenTask, onMoveTask }) {
  const [local, setLocal] = useState(null); // lista local p/ reordenação rápida no front

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const data = local || tasks;

  const byStatus = useMemo(() => {
    const map = { todo: [], doing: [], blocked: [], done: [] };
    for (const t of data) map[t.status]?.push(t);
    return map;
  }, [data]);

  function setFromTasks(nextTasks) {
    setLocal(nextTasks);
    // libera local depois (evita drift). Pode ajustar.
    window.clearTimeout(window.__prjxKanbanReset);
    window.__prjxKanbanReset = window.setTimeout(() => setLocal(null), 400);
  }

  function findTask(id) {
    return data.find((t) => t.id === id);
  }

  function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = findTask(activeId);
    if (!activeTask) return;

    // Caso 1: drop em coluna (overId é status)
    const overIsColumn = COLS.some((c) => c.id === overId);
    if (overIsColumn) {
      if (activeTask.status === overId) return;

      const next = data.map((t) => (t.id === activeId ? { ...t, status: overId } : t));
      setFromTasks(next);
      onMoveTask?.({ taskId: activeId, status: overId });
      return;
    }

    // Caso 2: drop em outra task -> inferir status do "over task"
    const overTask = findTask(overId);
    if (!overTask) return;

    const fromStatus = activeTask.status;
    const toStatus = overTask.status;

    // muda status se necessário
    let next = data.map((t) => (t.id === activeId ? { ...t, status: toStatus } : t));

    // reordena dentro do status do destino
    const inTarget = next.filter((t) => t.status === toStatus);
    const others = next.filter((t) => t.status !== toStatus);

    const oldIndex = inTarget.findIndex((t) => t.id === activeId);
    const newIndex = inTarget.findIndex((t) => t.id === overId);

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      const moved = arrayMove(inTarget, oldIndex, newIndex);
      next = [...others, ...moved];
    }

    setFromTasks(next);

    if (fromStatus !== toStatus) {
      onMoveTask?.({ taskId: activeId, status: toStatus });
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <div className="grid gap-4 lg:grid-cols-4">
        {COLS.map((c) => (
          <KanbanColumn key={c.id} id={c.id} title={c.title} tone={c.tone} tasks={byStatus[c.id] || []}>
            {(byStatus[c.id] || []).map((t) => (
              <SortableTask key={t.id} task={t} onClick={() => onOpenTask?.(t.id)} />
            ))}
          </KanbanColumn>
        ))}
      </div>

      {/* SortableContext global evita warning quando arrastar */}
      <SortableContext items={data.map((t) => t.id)} />
    </DndContext>
  );
}
