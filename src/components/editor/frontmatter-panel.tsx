import {
  Calendar,
  FileText,
  List,
  Plus,
  Tag,
  Trash2,
  Type,
  User,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/stores";

const getIconForKey = (key: string) => {
  const k = key.toLowerCase();
  if (k === "tags" || k === "tag") return <Tag className="w-4 h-4" />;
  if (k === "date") return <Calendar className="w-4 h-4" />;
  if (k === "author") return <User className="w-4 h-4" />;
  if (k === "title") return <Type className="w-4 h-4" />;
  if (k === "aliases" || k === "alias") return <List className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

function TagEditor({
  value,
  onChange,
}: {
  value: string | string[];
  onChange: (val: string | string[]) => void;
}) {
  const tags = Array.isArray(value) ? value : value ? [value] : [];
  const [newTag, setNewTag] = useState("");

  const handleRemove = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      if (!tags.includes(newTag.trim())) {
        onChange([...tags, newTag.trim()]);
      }
      setNewTag("");
    } else if (e.key === "Backspace" && newTag === "" && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 items-center w-full min-h-7 px-2 border border-transparent hover:border-input rounded-md focus-within:border-input focus-within:ring-1 focus-within:ring-ring focus-within:bg-transparent hover:bg-transparent transition-colors">
      {tags.map((tag: string) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          {tag}
          <X
            className="w-3 h-3 ml-1 cursor-pointer hover:text-destructive"
            onClick={() => handleRemove(tag)}
          />
        </span>
      ))}
      <input
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={handleAdd}
        placeholder={tags.length === 0 ? "添加标签..." : ""}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground min-w-[80px] h-6"
      />
    </div>
  );
}

function PropertyRow({
  propKey,
  value,
  onKeyChange,
  onValueChange,
  onDelete,
}: {
  propKey: string;
  value: string | string[];
  onKeyChange: (newKey: string) => void;
  onValueChange: (newVal: string | string[]) => void;
  onDelete: () => void;
}) {
  const [editingKey, setEditingKey] = useState(propKey);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setEditingKey(propKey);
  }, [propKey]);

  const isTags =
    propKey.toLowerCase() === "tags" || propKey.toLowerCase() === "tag";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: <temp>
    <div
      className="group flex items-start gap-2 py-1 -mx-2 px-2 rounded-md hover:bg-muted/30 transition-colors"
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
    >
      <div className="flex items-center text-muted-foreground gap-2 w-[140px] shrink-0 min-h-8">
        {getIconForKey(propKey)}
        <Input
          value={editingKey}
          onChange={(e) => setEditingKey(e.target.value)}
          onBlur={() => {
            if (editingKey.trim() && editingKey !== propKey) {
              onKeyChange(editingKey.trim());
            } else {
              setEditingKey(propKey);
            }
          }}
          className="h-7 px-1.5 py-0 border-transparent bg-transparent hover:border-input focus-visible:ring-1 focus-visible:ring-ring font-medium shadow-none"
        />
      </div>
      <div className="flex-1 flex items-center min-h-8">
        {isTags ? (
          <TagEditor value={value} onChange={onValueChange} />
        ) : (
          <Input
            value={String(value ?? "")}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder="空值"
            className="h-7 px-2 py-0 border-transparent bg-transparent hover:border-input focus-visible:ring-1 focus-visible:ring-ring shadow-none"
          />
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={`h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive transition-opacity ${isFocused ? "opacity-100" : "opacity-0"}`}
        onClick={onDelete}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function FrontmatterPanel() {
  const { frontmatter, setFrontmatter, curPath } = useEditorStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newPropKey, setNewPropKey] = useState("");

  if (!curPath) return null;

  const entries = Object.entries(frontmatter || {});

  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const newFrontmatter = { ...frontmatter };
    newFrontmatter[newKey] = newFrontmatter[oldKey];
    delete newFrontmatter[oldKey];
    setFrontmatter(newFrontmatter);
  };

  const handleValueChange = (key: string, newValue: string | string[]) => {
    setFrontmatter({ ...frontmatter, [key]: newValue });
  };

  const handleDelete = (key: string) => {
    const newFrontmatter = { ...frontmatter };
    delete newFrontmatter[key];
    setFrontmatter(newFrontmatter);
  };

  const handleAddNew = () => {
    if (newPropKey.trim()) {
      setFrontmatter({ ...frontmatter, [newPropKey.trim()]: "" });
      setNewPropKey("");
      setIsAdding(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-1 pb-6 border-b border-border/40 text-sm">
      {entries.length === 0 ? (
        <div className="opacity-60 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="text-muted-foreground h-8 px-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            添加文档属性
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map(([key, value]) => (
            <PropertyRow
              key={key}
              propKey={key}
              value={value}
              onKeyChange={(newKey) => handleKeyChange(key, newKey)}
              onValueChange={(newVal) => handleValueChange(key, newVal)}
              onDelete={() => handleDelete(key)}
            />
          ))}
          <div className="mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(true)}
              className="text-muted-foreground h-8 px-2"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加属性
            </Button>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="flex items-center gap-2 mt-2 px-2">
          <Input
            autoFocus
            value={newPropKey}
            onChange={(e) => setNewPropKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNew();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewPropKey("");
              }
            }}
            onBlur={() => {
              if (newPropKey.trim()) handleAddNew();
              else setIsAdding(false);
            }}
            placeholder="输入属性名..."
            className="h-8 w-[160px]"
          />
        </div>
      )}
    </div>
  );
}
