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
import { useEnterSubmit } from "@/hooks";

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
  const enterSubmit = useEnterSubmit({ onEnter: handleConfirm });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent aria-describedby={undefined}>
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
            onKeyDown={enterSubmit.onKeyDown}
            onCompositionStart={enterSubmit.onCompositionStart}
            onCompositionEnd={enterSubmit.onCompositionEnd}
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
