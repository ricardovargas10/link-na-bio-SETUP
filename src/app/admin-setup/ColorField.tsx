"use client";

import { useState } from "react";

/** Cores prontas (prefabs). */
const PRESETS = [
  { name: "Branco", hex: "#ffffff" },
  { name: "Preto", hex: "#000000" },
  { name: "Laranja Set Up", hex: "#f05924" },
  { name: "Roxo Set Up", hex: "#291d29" },
  { name: "Azul Set Up", hex: "#84d1eb" },
  { name: "Bege Set Up", hex: "#fcf6ec" },
  { name: "Lilás", hex: "#8b7cf6" },
  { name: "Lilás claro", hex: "#d9ccff" },
];

/** Aceita #abc, #aabbcc, aabbcc ou rgb(1, 2, 3). Devolve #aabbcc ou null. */
export function parseColor(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  let m = v.match(/^#?([0-9a-f]{6})$/);
  if (m) return `#${m[1]}`;
  m = v.match(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (m) return `#${m[1]}${m[1]}${m[2]}${m[2]}${m[3]}${m[3]}`;
  m = v.match(/^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})/) ?? v.match(/^(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})$/);
  if (m) {
    const n = [m[1], m[2], m[3]].map(Number);
    if (n.every((x) => x <= 255)) return `#${n.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  }
  return null;
}

/** Cor do botão: prontas, roda de cores e campo para hexadecimal ou RGB. Vazio = cor do estilo. */
export function ColorField({
  name = "",
  label,
  value,
  onChange,
}: {
  name?: string;
  label: string;
  value: string | null;
  onChange: (hex: string | null) => void;
}) {
  const [typed, setTyped] = useState(value ?? "");
  // Quando a cor muda por fora (amostra ou roda), o campo de texto acompanha.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    if (parseColor(typed) !== value) setTyped(value ?? "");
  }
  const invalid = typed.trim() !== "" && !parseColor(typed);

  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={`min-h-10 rounded-full border-2 px-3 text-[13px] font-semibold ${value === null ? "border-raisin" : "border-raisin/15"}`}
        >
          Do estilo
        </button>
        {PRESETS.map((p) => (
          <button
            key={p.hex}
            type="button"
            title={p.name}
            aria-label={p.name}
            aria-pressed={value === p.hex}
            onClick={() => onChange(p.hex)}
            className={`size-10 rounded-full border-2 ${value === p.hex ? "border-raisin ring-2 ring-raisin ring-offset-2" : "border-raisin/15"}`}
            style={{ backgroundColor: p.hex }}
          />
        ))}
        <label className="relative size-10 cursor-pointer overflow-hidden rounded-full border-2 border-raisin/15" title="Roda de cores">
          <span className="sr-only">Roda de cores</span>
          <span aria-hidden className="absolute inset-0" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
          <input type="color" value={value ?? "#ffffff"} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span aria-hidden className="size-10 shrink-0 rounded-xl border-2 border-raisin/15" style={{ backgroundColor: value ?? "transparent" }} />
        <input
          aria-label={`${label}: hexadecimal ou RGB`}
          placeholder="#f05924 ou rgb(240, 89, 36)"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            const hex = parseColor(e.target.value);
            if (hex) onChange(hex);
            else if (e.target.value.trim() === "") onChange(null);
          }}
          className="block min-h-11 w-full rounded-xl border-[1.5px] border-admin-border bg-white px-3 text-[16px] outline-none focus:border-raisin focus:shadow-[0_0_0_3px_rgba(41,29,41,0.16)]"
        />
      </div>
      {invalid ? <p className="mt-1 text-[13px] font-semibold text-danger">Use #RRGGBB ou rgb(r, g, b).</p> : null}
    </fieldset>
  );
}
