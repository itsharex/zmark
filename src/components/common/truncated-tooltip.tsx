import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TreeItem } from "@/types";
import { useLayoutEffect, useRef, useState } from "react";

export const TruncatedTooltip = ({ content }: { content: TreeItem }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const textContent =
    typeof content === "string" ? content : (content[0] as string);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element) {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    }
  }, [content]);

  const span = (
    <span ref={ref} className="truncate">
      {textContent}
    </span>
  );

  if (isTruncated) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="truncate">{span}</div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{textContent}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return span;
};
