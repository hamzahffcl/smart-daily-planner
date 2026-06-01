"use client";

import { useState } from "react";
import { Task, usePlannerStore } from "@/store/usePlannerStore";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Tag,
  Bell,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import TaskDialog from "./TaskDialog";

interface TaskItemProps {
  task: Task;
}

export default function TaskItem({ task }: TaskItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const toggleTask = usePlannerStore((state) => state.toggleTask);
  const toggleSubtask = usePlannerStore((state) => state.toggleSubtask);
  const deleteTask = usePlannerStore((state) => state.deleteTask);

  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "High":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Low":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  const isOverdue = !task.completed && task.dueDate < format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <Card className={`overflow-hidden transition-all duration-300 hover:shadow-md ${task.completed ? "opacity-75 bg-muted/30" : "bg-card"}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            {/* Task Completed Checkbox */}
            <div className="pt-0.5">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleTask(task.id)}
                id={`task-${task.id}`}
                className="h-5 w-5 rounded-md border-2"
              />
            </div>

            {/* Task Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-1">
                {/* Title */}
                <label
                  htmlFor={`task-${task.id}`}
                  className={`text-sm font-semibold tracking-tight transition-all truncate select-none cursor-pointer ${
                    task.completed ? "line-through text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {task.title}
                </label>
                
                {/* Priority */}
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>

                {/* Alarm Badge */}
                {task.alarmTime && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex items-center gap-1 bg-primary/5 text-primary">
                    <Bell className="h-3 w-3" />
                    {task.alarmTime}
                  </Badge>
                )}

                {/* Carry Over warning */}
                {task.carryOverCount > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-orange-500/15 text-orange-500 border-orange-500/30 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Carried over {task.carryOverCount}x
                  </Badge>
                )}
              </div>

              {/* Tags and Due Date */}
              <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                <span className={`flex items-center space-x-1 font-medium ${isOverdue ? "text-destructive font-bold" : ""}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {isOverdue
                      ? "Overdue: "
                      : task.dueDate === format(new Date(), "yyyy-MM-dd")
                      ? "Today"
                      : format(parseISO(task.dueDate), "d MMM yyyy")}
                  </span>
                </span>

                {task.tags.length > 0 && (
                  <div className="flex items-center space-x-1.5 flex-wrap">
                    <Tag className="h-3 w-3" />
                    {task.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-secondary/50 text-secondary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtasks Progress mini bar */}
              {totalSubtasks > 0 && (
                <div className="mt-3 flex items-center space-x-2">
                  <div className="flex-1 bg-muted h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${subtaskProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted-foreground font-mono">
                    {completedSubtasks}/{totalSubtasks} Subtasks
                  </span>
                </div>
              )}

              {/* Smart Warning: Delayed > 3 days */}
              {!task.completed && task.carryOverCount >= 3 && (
                <div className="mt-3 p-2 bg-destructive/5 border border-destructive/20 rounded-lg flex items-start space-x-2 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Smart Warning:</span> Delayed for {task.carryOverCount} days. Consider breaking this task down into subtasks or re-evaluating its importance.
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteTask(task.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              {(task.notes || totalSubtasks > 0) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              )}
            </div>
          </div>

          {/* Expanded view for Notes & Subtasks */}
          {isExpanded && (task.notes || totalSubtasks > 0) && (
            <div className="mt-4 pt-3 border-t flex flex-col space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
              {/* Notes */}
              {task.notes && (
                <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-muted/30">
                  <span className="font-semibold text-foreground block mb-1">Notes</span>
                  <p className="whitespace-pre-wrap leading-relaxed">{task.notes}</p>
                </div>
              )}

              {/* Subtask list */}
              {totalSubtasks > 0 && (
                <div>
                  <span className="text-xs font-semibold text-foreground block mb-2">Subtasks Checklist</span>
                  <div className="space-y-2">
                    {task.subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center space-x-2 pl-1.5">
                        <Checkbox
                          checked={subtask.completed}
                          onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                          id={`sub-${subtask.id}`}
                          className="h-4 w-4 rounded"
                        />
                        <label
                          htmlFor={`sub-${subtask.id}`}
                          className={`text-xs select-none cursor-pointer ${
                            subtask.completed ? "line-through text-muted-foreground" : "text-foreground font-medium"
                          }`}
                        >
                          {subtask.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {isEditDialogOpen && (
        <TaskDialog
          task={task}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
}
