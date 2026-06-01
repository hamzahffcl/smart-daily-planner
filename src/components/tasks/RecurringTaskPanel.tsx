"use client";

import { useState } from "react";
import { usePlannerStore, RecurringTemplate } from "@/store/usePlannerStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, RefreshCw, CalendarDays, Tag } from "lucide-react";

export default function RecurringTaskPanel() {
  const recurringTemplates = usePlannerStore((state) => state.recurringTemplates);
  const addRecurringTemplate = usePlannerStore((state) => state.addRecurringTemplate);
  const updateRecurringTemplate = usePlannerStore((state) => state.updateRecurringTemplate);
  const deleteRecurringTemplate = usePlannerStore((state) => state.deleteRecurringTemplate);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<RecurringTemplate["priority"]>("Medium");
  const [frequency, setFrequency] = useState<RecurringTemplate["frequency"]>("Daily");
  const [tagsInput, setTagsInput] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    addRecurringTemplate({
      title: title.trim(),
      priority,
      frequency,
      tags: parsedTags,
      notes: notes.trim(),
    });

    // Reset Form
    setTitle("");
    setPriority("Medium");
    setFrequency("Daily");
    setTagsInput("");
    setNotes("");
    setIsDialogOpen(false);
  };

  const getPriorityColor = (prio: RecurringTemplate["priority"]) => {
    switch (prio) {
      case "High":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Low":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
  };

  const getFrequencyBadgeColor = (freq: RecurringTemplate["frequency"]) => {
    switch (freq) {
      case "Daily":
        return "bg-violet-500/15 text-violet-500 border-violet-500/20";
      case "Weekly":
        return "bg-indigo-500/15 text-indigo-500 border-indigo-500/20";
      case "Monthly":
        return "bg-blue-500/15 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Recurring Tasks</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define habits and routines that generate tasks automatically
          </p>
        </div>

        {/* Add Routine Button */}
        <Button onClick={() => setIsDialogOpen(true)} className="font-semibold shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Routine
        </Button>

        {/* Add Template Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Add Recurring Task Template
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="rec-title" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Task Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rec-title"
                  placeholder="e.g. Morning Meditation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rec-frequency" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Frequency
                  </Label>
                  <Select
                    value={frequency}
                    onValueChange={(val) => setFrequency(val as RecurringTemplate["frequency"])}
                  >
                    <SelectTrigger id="rec-frequency" className="font-medium">
                      <SelectValue placeholder="Select Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily" className="font-medium text-violet-500">Daily</SelectItem>
                      <SelectItem value="Weekly" className="font-medium text-indigo-500">Weekly</SelectItem>
                      <SelectItem value="Monthly" className="font-medium text-blue-500">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rec-priority" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Priority
                  </Label>
                  <Select
                    value={priority}
                    onValueChange={(val) => setPriority(val as RecurringTemplate["priority"])}
                  >
                    <SelectTrigger id="rec-priority" className="font-medium">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High" className="text-destructive font-semibold">High</SelectItem>
                      <SelectItem value="Medium" className="text-amber-500 font-semibold">Medium</SelectItem>
                      <SelectItem value="Low" className="text-emerald-500 font-semibold">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rec-tags" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tags (Comma separated)
                </Label>
                <Input
                  id="rec-tags"
                  placeholder="e.g. Health, Habit, Work"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rec-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Notes
                </Label>
                <Textarea
                  id="rec-notes"
                  placeholder="Add notes for the auto-generated tasks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 border-t pt-4 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="font-semibold px-6">
                  Save Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Routine Cards Grid */}
      {recurringTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recurringTemplates.map((template) => (
            <Card
              key={template.id}
              className={`overflow-hidden transition-all duration-300 ${
                template.active ? "bg-card border-l-4 border-l-primary" : "bg-muted/30 opacity-70"
              }`}
            >
              <CardContent className="p-4 flex justify-between items-start space-x-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className={`text-sm font-semibold truncate ${template.active ? "text-foreground" : "text-muted-foreground"}`}>
                      {template.title}
                    </span>
                    <Badge variant="outline" className={`text-[10px] px-1.5 rounded ${getFrequencyBadgeColor(template.frequency)}`}>
                      <RefreshCw className="h-2.5 w-2.5 mr-1 animate-spin-slow" />
                      {template.frequency}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] px-1.5 rounded ${getPriorityColor(template.priority)}`}>
                      {template.priority}
                    </Badge>
                  </div>

                  {template.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {template.notes}
                    </p>
                  )}

                  <div className="flex items-center flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                    {template.tags.length > 0 && (
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <Tag className="h-2.5 w-2.5" />
                        {template.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-full font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Toggle Switch & Delete */}
                <div className="flex items-center space-x-3 shrink-0 pt-0.5">
                  <Switch
                    checked={template.active}
                    onCheckedChange={(checked) =>
                      updateRecurringTemplate(template.id, { active: checked })
                    }
                    className="data-[state=checked]:bg-primary"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecurringTemplate(template.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-muted/20 border border-dashed rounded-2xl text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">No recurring routines created yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-[280px]">
            Add task templates (like morning exercises or coding practice) that you want to do regularly.
          </p>
        </div>
      )}
    </div>
  );
}
