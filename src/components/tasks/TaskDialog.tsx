"use client";

import React, { useState, useEffect } from "react";
import { usePlannerStore, Task } from "@/store/usePlannerStore";
import { useLanguageStore } from "@/store/useLanguageStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, ListTodo, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface TaskDialogProps {
  task?: Task; // If provided, we are editing. Otherwise, creating.
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TaskDialog({ task, open, onOpenChange }: TaskDialogProps) {
  const { t } = useLanguageStore();
  const addTask = usePlannerStore((state) => state.addTask);
  const updateTask = usePlannerStore((state) => state.updateTask);

  // Form states
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("Medium");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [alarmTime, setAlarmTime] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");
  
  // Subtasks management
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Initialize values if editing
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setPriority(task.priority);
      setDueDate(task.dueDate);
      setAlarmTime(task.alarmTime || "");
      setTagsInput(task.tags.join(", "));
      setNotes(task.notes);
      setSubtasks(task.subtasks);
    } else {
      // Reset form
      setTitle("");
      setPriority("Medium");
      setDueDate(format(new Date(), "yyyy-MM-dd"));
      setAlarmTime("");
      setTagsInput("");
      setNotes("");
      setSubtasks([]);
    }
  }, [task, open]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      {
        id: Math.random().toString(36).substring(2, 9),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle("");
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const taskData = {
      title: title.trim(),
      priority,
      dueDate,
      alarmTime: alarmTime || undefined,
      tags: parsedTags,
      subtasks,
      notes: notes.trim(),
    };

    if (task) {
      updateTask(task.id, taskData);
    } else {
      addTask(taskData);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {task ? t("task.edit") : t("task.create")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("task.titleLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder={t("task.titlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <Label htmlFor="priority" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("dashboard.priority")}
              </Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as Task["priority"])}
              >
                <SelectTrigger id="priority" className="font-medium">
                  <SelectValue placeholder={t("task.selectPriority")}>
                    {priority ? t(`filter.${priority.toLowerCase()}`) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High" className="text-destructive font-semibold">{t("filter.high")}</SelectItem>
                  <SelectItem value="Medium" className="text-amber-500 font-semibold">{t("filter.medium")}</SelectItem>
                  <SelectItem value="Low" className="text-emerald-500 font-semibold">{t("filter.low")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <Label htmlFor="dueDate" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("task.dueDateLabel")}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Alarm Time */}
            <div className="space-y-1.5">
              <Label htmlFor="alarmTime" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                {t("task.alarmLabel")}
              </Label>
              <Input
                id="alarmTime"
                type="time"
                value={alarmTime}
                onChange={(e) => setAlarmTime(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("task.tagsLabel")}
              </Label>
              <Input
                id="tags"
                placeholder={t("task.tagsPlaceholder")}
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("task.notesLabel")}
            </Label>
            <Textarea
              id="notes"
              placeholder={t("task.notesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Subtasks Section */}
          <div className="space-y-1.5 border-t pt-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListTodo className="h-4 w-4" />
              {t("task.subtasksChecklist", { count: subtasks.length.toString() })}
            </Label>
            
            {/* Subtask list */}
            {subtasks.length > 0 && (
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1 border rounded-lg p-2 bg-muted/20">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center justify-between text-xs py-0.5 border-b border-muted last:border-0 pl-1">
                    <span className="font-medium truncate mr-2">{st.title}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="h-5 w-5 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add subtask inputs */}
            <div className="flex gap-2">
              <Input
                placeholder={t("task.subtaskPlaceholder")}
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="h-9 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSubtask}
                className="h-9 px-3 shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t("app.add")}
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-4 mt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {t("app.cancel")}
            </Button>
            <Button type="submit" className="font-semibold px-6">
              {task ? t("task.saveChanges") : t("task.createTask")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
