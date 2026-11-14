import React, { useRef, useEffect } from "react";
import { sanitizePlainText, stripHtmlTags } from "../utils/security";

interface InlineEditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  tag?: keyof React.JSX.IntrinsicElements;
  className?: string;
  placeholder?: string;
  fieldType?: string;
  fieldIndex?: number;
}

export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onChange,
  tag: Tag = "div",
  className = "",
  placeholder = "텍스트를 입력하세요...",
  fieldType,
  fieldIndex,
}) => {
  const ref = useRef<HTMLElement>(null);
  const isEditing = useRef(false);

  useEffect(() => {
    if (ref.current && !isEditing.current) {
      const currentText = ref.current.innerText ?? "";
      const safeVal = value || "";
      if (currentText !== safeVal) {
        ref.current.innerText = safeVal;
      }
    }
  }, [value]);

  const handleInput = () => {
    if (ref.current) {
      isEditing.current = true;
      const text = ref.current.innerText ?? "";
      onChange(sanitizePlainText(text));
    }
  };

  const handleFocus = () => {
    isEditing.current = true;
  };

  const handleBlur = () => {
    isEditing.current = false;
    if (ref.current) {
      const text = ref.current.innerText ?? "";
      const sanitized = sanitizePlainText(text);
      if (sanitized !== value) {
        onChange(sanitized);
      }
    }
  };

  // Prevent rich HTML paste injection by intercepting clipboard and inserting sanitized plain text
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const rawPastedText = e.clipboardData.getData("text/plain");
    const cleanText = stripHtmlTags(rawPastedText);

    if (document.queryCommandSupported && document.queryCommandSupported("insertText")) {
      document.execCommand("insertText", false, cleanText);
    } else {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      selection.deleteFromDocument();
      selection.getRangeAt(0).insertNode(document.createTextNode(cleanText));
      selection.collapseToEnd();
    }

    if (ref.current) {
      const updated = sanitizePlainText(ref.current.innerText ?? "");
      onChange(updated);
    }
  };

  return React.createElement(Tag, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    draggable: false,
    onInput: handleInput,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onPaste: handlePaste,
    onMouseDown: (e: React.MouseEvent) => {
      // Prevent parent draggable elements from intercepting mouse drag as a card drag
      e.stopPropagation();
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
    },
    onDragStart: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    className: `focus:outline-none focus:ring-[1.5px] focus:ring-blue-400/40 focus:bg-blue-400/5 hover:ring-1 hover:ring-white/20 hover:bg-white/5 rounded-md px-1.5 py-0.5 -mx-1.5 transition-all cursor-text outline-none ${className}`,
    "data-placeholder": placeholder,
    "data-field-type": fieldType,
    "data-field-index": fieldIndex !== undefined ? String(fieldIndex) : undefined,
    title: "클릭하여 내용 수정",
  });
};

