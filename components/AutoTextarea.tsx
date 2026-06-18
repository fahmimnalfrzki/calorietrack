"use client";

import { useEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

// Textarea yang otomatis menyesuaikan tinggi dengan isinya (tidak ada teks terpotong).
export default function AutoTextarea(props: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(resize, [props.value]);

  return (
    <textarea
      {...props}
      ref={ref}
      onInput={resize}
      rows={1}
    />
  );
}
