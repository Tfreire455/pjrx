import React, { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";

import { KanbanColumn } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";

const COLS = [
  { id: "todo", title: "To do", tone: "neutral" },
  { id: "doing", title: "Doing", tone: "secondary" },
  { id: "blocked", title: "Blocked", tone: "warning" },
  { id: "done", title: "Done", tone: "success" }
];

function SortableTask({ task, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

export function KanbanBoard({ tasks = [], onOpenTask, onMoveTask }) {
  const [activeId, setActiveId] = useState(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const tasksByStatus = useMemo(() => {
    const map = { todo: [], doing: [], blocked: [], done: [] };
    // Proteção: garante que é array e filtra itens inválidos
    const list = Array.isArray(localTasks) ? localTasks : [];
    
    list.forEach((t) => {
      // Se a task não tiver status válido, joga em todo
      const status = map[t.status] ? t.status : 'todo';
      map[status].push(t);
    });
    return map;
  }, [localTasks]);

  function findTask(id) {
    return localTasks.find((t) => t.id === id);
  }

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";

    if (!isActiveTask) return;

    if (isActiveTask && isOverTask) {
      setLocalTasks((items) => {
        const activeIndex = items.findIndex((t) => t.id === activeId);
        const overIndex = items.findIndex((t) => t.id === overId);

        if (items[activeIndex].status !== items[overIndex].status) {
          const newItems = [...items];
          newItems[activeIndex] = { ...newItems[activeIndex], status: items[overIndex].status };
          return arrayMove(newItems, activeIndex, overIndex - 1);
        }
        return arrayMove(items, activeIndex, overIndex);
      });
    }

    const isOverColumn = COLS.some(c => c.id === overId);
    if (isActiveTask && isOverColumn) {
      setLocalTasks((items) => {
        const activeIndex = items.findIndex((t) => t.id === activeId);
        if (items[activeIndex].status !== overId) {
           const newItems = [...items];
           newItems[activeIndex] = { ...newItems[activeIndex], status: overId };
           return arrayMove(newItems, activeIndex, activeIndex); 
        }
        return items;
      });
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTask = findTask(active.id);
    if (!activeTask) return;

    const overId = over.id;
    const isOverColumn = COLS.some(c => c.id === overId);
    let newStatus = activeTask.status;

    if (isOverColumn) {
      newStatus = overId;
    } else {
      const overTask = findTask(overId);
      if (overTask) newStatus = overTask.status;
    }

    if (activeTask.status !== newStatus) {
      onMoveTask({ taskId: activeTask.id, status: newStatus });
    }
  }

  const activeTask = activeId ? findTask(activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 lg:grid-cols-4 h-full items-start">
        {COLS.map((col) => (
          <KanbanColumn key={col.id} id={col.id} title={col.title} tone={col.tone} tasks={tasksByStatus[col.id]}>
            <SortableContext 
              // Proteção contra IDs nulos/vazios no SortableContext
              items={tasksByStatus[col.id].map(t => t.id).filter(Boolean)} 
              strategy={verticalListSortingStrategy}
            >
              {tasksByStatus[col.id].map((task, index) => (
                // Use task.id, mas tenha fallback para index se vier vazio
                <SortableTask key={task.id || `task-${index}`} task={task} onClick={() => onOpenTask(task.id)} />
              ))}
            </SortableContext>
          </KanbanColumn>
        ))}
      </div>

      {createPortal(
        <DragOverlay>
          {activeTask && (
            <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
              <TaskCard task={activeTask} isOverlay />
            </div>
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}