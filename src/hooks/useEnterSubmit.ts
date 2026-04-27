import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useRef,
} from "react";

interface UseEnterSubmitOptions {
  onEnter: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useEnterSubmit({
  onEnter,
  enabled = true,
  preventDefault = true,
}: UseEnterSubmitOptions) {
  const isComposing = useRef(false);

  const onCompositionStart = useCallback(() => {
    isComposing.current = true;
  }, []);

  const onCompositionEnd = useCallback(() => {
    setTimeout(() => {
      isComposing.current = false;
    }, 100);
  }, []);

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!enabled) return;
      if (event.key !== "Enter") return;
      if (event.nativeEvent.isComposing || isComposing.current) return;

      if (preventDefault) {
        event.preventDefault();
      }
      onEnter();
    },
    [enabled, onEnter, preventDefault],
  );

  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
  };
}
