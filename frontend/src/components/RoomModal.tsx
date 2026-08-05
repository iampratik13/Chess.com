import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "join";
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
}

export const RoomModal = ({ isOpen, onClose, mode, onCreateRoom, onJoinRoom }: RoomModalProps) => {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (isOpen) setCode("");
  }, [isOpen, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-border bg-popover p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-xl font-semibold">
            {mode === "create" ? "Create a room" : "Join a room"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {mode === "create" ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ll generate a code you can share with a friend to start playing.
            </p>
            <Button className="mt-6 w-full" onClick={onCreateRoom}>
              Create room
            </Button>
          </>
        ) : (
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (code.length === 6) onJoinRoom(code);
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="XXXXXX"
              autoFocus
              className="text-center font-mono text-2xl tracking-[0.4em]"
            />
            <Button type="submit" className="mt-4 w-full" disabled={code.length !== 6}>
              Join room
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
