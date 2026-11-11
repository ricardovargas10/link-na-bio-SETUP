"use client";

import { useEffect, useRef, useState } from "react";
import { ICON_COMPONENTS } from "@/components/BrandIcon";
import type { IconRef } from "@/lib/content-types";
import { ICON_LABELS, ICON_NAMES } from "@/lib/icon-names";

export type IconChoice = string; // "none" | "lib:<nome>" | "custom-keep" | "custom-new"

export function initialChoice(icon: IconRef): IconChoice {
  if (icon.type === "lib") return `lib:${icon.name}`;
  if (icon.type === "custom") return "custom-keep";
  return "none";
}

/** Converte a escolha em ícone + endereço da imagem, para a pré-visualização. */
export function choiceToPreview(choice: IconChoice, current: IconRef, fileUrl: string | null): { icon: IconRef; src: string | null } {
  if (choice.startsWith("lib:")) return { icon: { type: "lib", name: choice.slice(4) as never }, src: null };
  if (choice === "custom-keep" && current.type === "custom") return { icon: current, src: `/media/${current.mediaId}` };
  if (choice === "custom-new" && fileUrl) return { icon: { type: "none" }, src: fileUrl };
  return { icon: { type: "none" }, src: null };
}

const tile =
  "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 bg-white px-1 py-2 text-[11px] leading-tight font-semibold text-raisin";

export function IconPicker({
  current,
  allowNone = true,
  error,
  onChange,
}: {
  current: IconRef;
  allowNone?: boolean;
  error?: string;
  onChange: (choice: IconChoice, fileUrl: string | null) => void;
}) {
  const [choice, setChoice] = useState<IconChoice>(initialChoice(current));
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  const pick = (c: IconChoice, url: string | null = fileUrl) => {
    setChoice(c);
    onChange(c, url);
  };

  const onFile = (file: File | undefined) => {
    setFileError(null);
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      setFileError("Use uma imagem PNG, JPG, WEBP ou SVG.");
      return;
    }
    if (file.size > 600 * 1024) {
      setFileError("A imagem pode ter no máximo 600 KB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    pick("custom-new", url);
  };

  const sel = (c: IconChoice) => (choice === c ? "border-raisin" : "border-raisin/10");

  return (
    <fieldset>
      <legend className="text-[15px] font-semibold">Ícone</legend>
      <input type="hidden" name="iconChoice" value={choice} />
      <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {allowNone ? (
          <button type="button" aria-pressed={choice === "none"} onClick={() => pick("none")} className={`${tile} ${sel("none")}`}>
            <span className="flex size-6 items-center justify-center text-[18px] text-raisin/50">∅</span>
            Nenhum
          </button>
        ) : null}
        {ICON_NAMES.map((name) => {
          const C = ICON_COMPONENTS[name];
          const c = `lib:${name}`;
          return (
            <button key={name} type="button" aria-pressed={choice === c} onClick={() => pick(c)} className={`${tile} ${sel(c)}`}>
              <C className="size-6 text-sunset" stroke={2} aria-hidden />
              {ICON_LABELS[name]}
            </button>
          );
        })}
        {current.type === "custom" ? (
          <button type="button" aria-pressed={choice === "custom-keep"} onClick={() => pick("custom-keep")} className={`${tile} ${sel("custom-keep")}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/${current.mediaId}`} alt="" className="size-6 rounded object-contain" />
            Imagem atual
          </button>
        ) : null}
        <button
          type="button"
          aria-pressed={choice === "custom-new"}
          onClick={() => fileInput.current?.click()}
          className={`${tile} ${sel("custom-new")}`}
        >
          {fileUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fileUrl} alt="" className="size-6 rounded object-contain" />
          ) : (
            <span className="flex size-6 items-center justify-center text-[20px] text-sunset">＋</span>
          )}
          {fileUrl ? "Imagem nova" : "Enviar imagem"}
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        name="iconFile"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <p className="mt-1.5 text-[13px] text-raisin/70">Imagem própria: PNG, JPG, WEBP ou SVG, até 600 KB (de preferência quadrada).</p>
      {fileError || error ? <p className="mt-1 text-[14px] font-semibold text-[#B3261E]">{fileError ?? error}</p> : null}
    </fieldset>
  );
}
