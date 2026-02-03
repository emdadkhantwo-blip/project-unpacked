import { useState } from "react";
import { format } from "date-fns";
import {
  MessageSquare,
  Pin,
  PinOff,
  Trash2,
  Plus,
  AlertCircle,
  ThumbsUp,
  HelpCircle,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGuestNotes,
  useToggleGuestNotePinned,
  useDeleteGuestNote,
  type GuestNote,
} from "@/hooks/useGuestNotes";
import { AddGuestNoteDialog } from "./AddGuestNoteDialog";
import type { Guest } from "@/hooks/useGuests";

interface GuestNotesTabProps {
  guest: Guest;
}

export function GuestNotesTab({ guest }: GuestNotesTabProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: notes = [], isLoading } = useGuestNotes(guest.id);
  const togglePinned = useToggleGuestNotePinned();
  const deleteNote = useDeleteGuestNote();

  const getNoteTypeIcon = (type: GuestNote["note_type"]) => {
    switch (type) {
      case "complaint":
        return <AlertCircle className="h-3 w-3" />;
      case "compliment":
        return <ThumbsUp className="h-3 w-3" />;
      case "request":
        return <HelpCircle className="h-3 w-3" />;
      default:
        return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getNoteTypeBadge = (type: GuestNote["note_type"]) => {
    switch (type) {
      case "complaint":
        return (
          <Badge variant="destructive" className="text-xs">
            {getNoteTypeIcon(type)}
            <span className="ml-1">Complaint</span>
          </Badge>
        );
      case "compliment":
        return (
          <Badge className="bg-success text-success-foreground text-xs">
            {getNoteTypeIcon(type)}
            <span className="ml-1">Compliment</span>
          </Badge>
        );
      case "request":
        return (
          <Badge variant="secondary" className="text-xs">
            {getNoteTypeIcon(type)}
            <span className="ml-1">Request</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {getNoteTypeIcon(type)}
            <span className="ml-1">General</span>
          </Badge>
        );
    }
  };

  const handleTogglePinned = (note: GuestNote) => {
    togglePinned.mutate({
      noteId: note.id,
      guestId: guest.id,
      isPinned: !note.is_pinned,
    });
  };

  const handleDelete = (note: GuestNote) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate({ noteId: note.id, guestId: guest.id });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Staff Notes ({notes.length})</h4>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No notes yet. Add observations about this guest.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card
              key={note.id}
              className={note.is_pinned ? "border-primary/50 bg-primary/5" : ""}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getNoteTypeBadge(note.note_type)}
                    {note.is_pinned && (
                      <Badge variant="outline" className="text-xs">
                        <Pin className="h-3 w-3 mr-1" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleTogglePinned(note)}
                    >
                      {note.is_pinned ? (
                        <PinOff className="h-3.5 w-3.5" />
                      ) : (
                        <Pin className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(note)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm whitespace-pre-wrap">{note.content}</p>

                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {note.author_name}
                  </div>
                  <span>•</span>
                  <span>{format(new Date(note.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddGuestNoteDialog
        guestId={guest.id}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
