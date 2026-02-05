import React from "react";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { KanbanSquare, ListTodo, CalendarDays, Sparkles } from "lucide-react";

export function ProjectTabs({ tab, setTab }) {
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger tabValue="kanban">
          <span className="inline-flex items-center gap-2">
            <KanbanSquare size={16} /> Kanban
          </span>
        </TabsTrigger>
        <TabsTrigger tabValue="list">
          <span className="inline-flex items-center gap-2">
            <ListTodo size={16} /> Lista
          </span>
        </TabsTrigger>
        <TabsTrigger tabValue="calendar">
          <span className="inline-flex items-center gap-2">
            <CalendarDays size={16} /> Calendário
          </span>
        </TabsTrigger>
        <TabsTrigger tabValue="ai">
          <span className="inline-flex items-center gap-2">
            <Sparkles size={16} /> IA
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}