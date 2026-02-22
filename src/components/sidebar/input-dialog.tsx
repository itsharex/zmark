import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface InputDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  initialValue?: string;
  placeholder?: string;
}

export function InputDialog({
  open,
  onClose,
  onConfirm,
  title,
  initialValue = "",
  placeholder = "请输入",
}: InputDialogProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComposing = useRef(false);

  useEffect(() => {
    if (open) {
      setInputValue(initialValue);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, initialValue]);

  const handleConfirm = () => {
    onConfirm(inputValue);
    setInputValue("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-4">
          <Input
            ref={inputRef}
            id="name"
            value={inputValue}
            placeholder={placeholder}
            onChange={(e) => setInputValue(e.target.value)}
            onCompositionStart={() => (isComposing.current = true)}
            onCompositionEnd={() => {
              setTimeout(() => (isComposing.current = false), 100);
            }}
            onKeyDown={(e) => {
              if (isComposing.current) return;
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="destructive" onClick={onClose}>
            取消
          </Button>
          <Button variant="secondary" onClick={handleConfirm}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
