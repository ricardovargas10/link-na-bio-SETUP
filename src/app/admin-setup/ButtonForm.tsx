"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Upload } from "lucide-react";
import { LinkCard } from "@/components/LinkCard";
import { ICON_COMPONENTS } from "@/components/BrandIcon";
import {
  ANIMATIONS,
  ANIMATION_LABELS,
  LIMITS,
  STYLE_LABELS,
  type Animation,
  type ButtonColors,
  type ButtonStyle,
  type IconRef,
} from "@/lib/content-types";
import { ICON_LABELS, ICON_NAMES } from "@/lib/icon-names";
import { ADMIN_PATH, deleteButton, saveButton, type FormState } from "@/lib/api";
import { spLocalToIso } from "@/lib/time";
import { useAdmin } from "./AdminData";
import { Field, FormAlert, Toggle, inputClass } from "./fields";
import { choiceToPreview, initialChoice, type IconChoice } from "./IconPicker";
import { ConfirmDelete, SubmitButton, submitWithoutReset } from "./ui";
import { ColorField } from "./ColorField";
import { btnGhost, btnPrimary, btnSecondary, card, capsLabel } from "./styles";

export type ButtonFormValues = {
  id?: string;
  label: string;
  subtitle: string;
  url: string;
  icon: IconRef;
  style: ButtonStyle;
  colors: ButtonColors;
  gapBefore: boolean;
  groupTitle: string;
  half: boolean;
  animation: Animation;
  badge: string;
  visible: boolean;
  startsAt: string; // "AAAA-MM-DDTHH:mm" no horário de Brasília, ou ""
  endsAt: string;
  position: number;
};

/** Estilos escolhíveis em Aparência ("featured" virou o Formato "Com imagem"). */
const PLAIN_STYLES = ["white", "orange", "blue", "lilac", "purple"] as const;
const SWATCH: Record<(typeof PLAIN_STYLES)[number], string> = {
  white: "bg-white border border-admin-border",
  orange: "bg-sunset",
  blue: "bg-sky",
  lilac: "bg-lilac",
  purple: "bg-raisin",
};
const VISIBLE_ICONS = 15;

const choiceTile = (on: boolean) =>
  `flex min-h-12 cursor-pointer items-center gap-2.5 rounded-[14px] border-[1.5px] bg-white px-3.5 text-[15px] font-medium has-[:focus-visible]:shadow-[0_0_0_3px_#ffffff,0_0_0_6px_#291d29] ${
    on ? "border-raisin border-2" : "border-admin-border"
  }`;

function Section({ title, description, aside, dim, children }: { title: string; description?: string; aside?: ReactNode; dim?: boolean; children: ReactNode }) {
  return (
    <section className={`${card} p-4 sm:p-5 ${dim ? "opacity-55" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[17px] font-semibold">{title}</h2>
        {aside}
      </div>
      {description ? <p className="mt-0.5 text-[13.5px] leading-snug text-admin-muted">{description}</p> : null}
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

export function ButtonForm({ title, initial, maxPosition }: { title: string; initial: ButtonFormValues; maxPosition: number }) {
  const base = `${ADMIN_PATH}/`;
  const router = useRouter();
  const { run } = useAdmin();
  const [state, formAction, saving] = useActionState<FormState, FormData>(async (_prev, fd) => {
    // As datas vão para a API em UTC (o campo mostra o horário de Brasília).
    const fieldErrors: Record<string, string> = {};
    for (const [key, label] of [["startsAt", "início"], ["endsAt", "fim"]] as const) {
      const iso = spLocalToIso(String(fd.get(key) ?? ""));
      if (iso === undefined) fieldErrors[key] = `Data de ${label} inválida.`;
      fd.set(key, iso ?? "");
    }
    if (Object.keys(fieldErrors).length) return { error: "Confira os campos marcados.", fieldErrors };
    const r = await run(() => saveButton(fd));
    if (r.ok) router.push(base);
    return r;
  }, {});
  const [v, setV] = useState(initial);
  const [iconChoice, setIconChoice] = useState<IconChoice>(initialChoice(initial.icon));
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [allIcons, setAllIcons] = useState(false);
  const [openColor, setOpenColor] = useState<keyof ButtonColors | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const lastPlainStyle = useRef<ButtonStyle>(initial.style === "featured" ? "white" : initial.style);
  const lastIconChoice = useRef<IconChoice>(initial.icon.type === "lib" ? initialChoice(initial.icon) : "lib:link");

  const set = <K extends keyof ButtonFormValues>(key: K, value: ButtonFormValues[K]) => setV((o) => ({ ...o, [key]: value }));
  const err = state.fieldErrors ?? {};
  const preview = choiceToPreview(iconChoice, initial.icon, fileUrl);
  const thumb = v.style === "featured";
  const thumbSrc = preview.src;

  useEffect(() => () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
  }, [fileUrl]);

  function pickIcon(c: IconChoice) {
    setIconChoice(c);
    if (c.startsWith("lib:")) lastIconChoice.current = c;
  }

  function onFile(file: File | undefined) {
    setFileError(null);
    if (!file) return;
    const allowed = thumb ? ["image/png", "image/jpeg", "image/webp"] : ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      setFileError(thumb ? "Use uma imagem JPG, PNG ou WEBP." : "Use uma imagem PNG, JPG, WEBP ou SVG.");
      return;
    }
    if (file.size > 600 * 1024) {
      setFileError("A imagem pode ter no máximo 600 KB.");
      return;
    }
    setFileUrl(URL.createObjectURL(file));
    setIconChoice("custom-new");
  }

  function setFormat(withThumb: boolean) {
    if (withThumb === thumb) return;
    if (withThumb) {
      lastPlainStyle.current = v.style;
      set("style", "featured");
      // A imagem usa o mesmo campo do ícone; ícone da biblioteca não serve como imagem.
      if (iconChoice.startsWith("lib:")) setIconChoice(initial.icon.type === "custom" ? "custom-keep" : "none");
    } else {
      set("style", lastPlainStyle.current);
    }
  }

  const iconMode = iconChoice === "none" ? "none" : iconChoice.startsWith("lib:") ? "lib" : "custom";
  const icons = allIcons ? ICON_NAMES : ICON_NAMES.slice(0, VISIBLE_ICONS);
  const colorRows: { key: keyof ButtonColors; label: string; name: string }[] = [
    { key: "bg", label: "Fundo", name: "colorBg" },
    { key: "text", label: "Texto", name: "colorText" },
    { key: "icon", label: "Ícone", name: "colorIcon" },
  ];

  return (
    <>
    <form onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4" noValidate>
      {initial.id ? <input type="hidden" name="id" value={initial.id} /> : null}
      <input type="hidden" name="style" value={v.style} />
      <input type="hidden" name="iconChoice" value={iconChoice} />
      <input
        ref={fileInput}
        type="file"
        name="iconFile"
        accept={thumb ? "image/png,image/jpeg,image/webp" : "image/png,image/jpeg,image/webp,image/svg+xml"}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {/* Barra de cima */}
      <div className="sticky top-0 z-30 -mx-4 -mt-6 flex items-center gap-2 border-b border-[#e9e2e4] bg-white/95 px-4 py-2 backdrop-blur">
        <Link href={base} aria-label="Voltar para os botões" className="flex size-11 items-center justify-center rounded-xl border-[1.5px] border-admin-border bg-white">
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h1 className="flex-1 truncate text-[16px] font-semibold">{title}</h1>
        <Link href={base} className={`${btnGhost} hidden sm:inline-flex`}>
          Cancelar
        </Link>
        <SubmitButton pending={saving} pendingText="Salvando…" className={`${btnPrimary} min-h-11 px-4`}>
          Salvar
        </SubmitButton>
      </div>

      {/* Prévia */}
      <div className={`${thumb ? "" : "sticky top-[61px] z-20"} -mx-4 border-b border-[#e9e2e4] bg-admin-bg/95 px-4 pt-2 pb-4 backdrop-blur`}>
        <p className={`${capsLabel} mb-2`}>Como vai ficar na página</p>
        <div className="rounded-[18px] border border-admin-line bg-shell px-3.5 pt-5 pb-3.5">
          <div className={v.half ? "mx-auto max-w-[60%]" : ""}>
          <LinkCard
            preview
            label={v.label}
            subtitle={v.subtitle}
            badge={v.badge}
            url={v.url}
            icon={preview.icon}
            iconPreviewSrc={preview.src}
            style={v.style}
            colors={v.colors}
            animation={v.animation}
            half={v.half}
          />
          </div>
        </div>
      </div>

      <FormAlert error={state.error} />

      {/* 1. Conteúdo */}
      <Section title="Conteúdo" description="O formato, o que a pessoa lê e para onde o botão leva.">
        <fieldset>
          <legend className="text-[14.5px] font-semibold">Formato</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <label className={choiceTile(!thumb)}>
              <input type="radio" name="format" checked={!thumb} onChange={() => setFormat(false)} className="sr-only" />
              <span aria-hidden className="h-4 w-6 rounded-[4px] border border-admin-border bg-[#f2edee]" />
              Botão simples
            </label>
            <label className={choiceTile(thumb)}>
              <input type="radio" name="format" checked={thumb} onChange={() => setFormat(true)} className="sr-only" />
              <span aria-hidden className="h-4 w-6 overflow-hidden rounded-[4px] border border-raisin bg-raisin">
                <span className="block h-2 bg-white/90" />
              </span>
              Com imagem
            </label>
          </div>
        </fieldset>

        {thumb ? (
          <div className="rounded-[14px] border-[1.5px] border-admin-line bg-admin-bg/60 p-3.5">
            <p className="text-[14.5px] font-semibold">Imagem do botão</p>
            <div className="mt-2 overflow-hidden rounded-xl">
              {thumbSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbSrc} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-1 bg-[#f2edee] text-[13.5px] text-admin-muted">
                  <ImageIcon className="size-6" aria-hidden /> Sem imagem ainda
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => fileInput.current?.click()} className={btnSecondary}>
                <Upload className="size-4" aria-hidden /> {thumbSrc ? "Trocar imagem" : "Enviar imagem"}
              </button>
              {thumbSrc ? (
                <button type="button" onClick={() => setIconChoice("none")} className={`${btnGhost} text-danger`}>
                  Remover
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[13px] text-admin-muted">JPG, PNG ou WEBP até 600 KB. O corte é 16:9 (formato de vídeo).</p>
            {fileError || err.icon ? <p className="mt-1.5 text-[13.5px] font-semibold text-danger">{fileError ?? err.icon}</p> : null}
          </div>
        ) : null}

        <Field id="label" label="Texto do botão" count={v.label.length} max={LIMITS.label} error={err.label}>
          <input id="label" name="label" value={v.label} onChange={(e) => set("label", e.target.value)} maxLength={LIMITS.label} aria-invalid={!!err.label} className={inputClass} />
        </Field>

        <Field id="url" label="Link" hint="https://, wa.me/, mailto: ou tel:. Sem link, o botão fica como aviso na página." error={err.url}>
          <input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="https://"
            value={v.url}
            onChange={(e) => set("url", e.target.value)}
            aria-invalid={!!err.url}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="subtitle" label="Subtítulo" count={v.subtitle.length} max={LIMITS.subtitle} error={err.subtitle}>
            <input id="subtitle" name="subtitle" value={v.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={LIMITS.subtitle} className={inputClass} />
          </Field>
          <Field id="badge" label="Selo" count={v.badge.length} max={LIMITS.badge} error={err.badge}>
            <input id="badge" name="badge" placeholder="Ex.: Novo" value={v.badge} onChange={(e) => set("badge", e.target.value)} maxLength={LIMITS.badge} className={inputClass} />
          </Field>
        </div>
      </Section>

      {/* 2. Ícone */}
      <Section
        title="Ícone"
        description="Aparece à esquerda do texto no botão simples."
        dim={thumb}
        aside={thumb ? <span className="rounded-full bg-[#f2edee] px-2.5 py-0.5 text-[12px] font-semibold text-admin-muted">Não usado no formato com imagem</span> : null}
      >
        <fieldset disabled={thumb} className="flex flex-col gap-3">
          <legend className="sr-only">Tipo de ícone</legend>
          <div className="grid grid-cols-3 rounded-[14px] bg-[#f2edee] p-1">
            {(
              [
                ["none", "Nenhum"],
                ["lib", "Da biblioteca"],
                ["custom", "Adicionar ícone"],
              ] as const
            ).map(([mode, text]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={iconMode === mode}
                onClick={() => {
                  if (mode === "none") pickIcon("none");
                  else if (mode === "lib") pickIcon(lastIconChoice.current);
                  else if (initial.icon.type === "custom" && iconMode !== "custom") setIconChoice("custom-keep");
                  else fileInput.current?.click();
                }}
                className={`min-h-11 rounded-[11px] px-2 text-[14px] ${iconMode === mode ? "bg-white font-semibold shadow-[0_1px_2px_rgba(41,29,41,0.12)]" : "font-medium text-admin-muted"}`}
              >
                {text}
              </button>
            ))}
          </div>

          {iconMode === "lib" ? (
            <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
              {icons.map((name) => {
                const C = ICON_COMPONENTS[name];
                const c = `lib:${name}`;
                const on = iconChoice === c;
                return (
                  <button
                    key={name}
                    type="button"
                    title={ICON_LABELS[name]}
                    aria-label={ICON_LABELS[name]}
                    aria-pressed={on}
                    onClick={() => pickIcon(c)}
                    className={`flex aspect-square min-h-11 items-center justify-center rounded-xl border-[1.5px] bg-white ${on ? "border-2 border-raisin" : "border-admin-border"}`}
                  >
                    <C className="size-5" stroke={2} aria-hidden />
                  </button>
                );
              })}
              {!allIcons && ICON_NAMES.length > VISIBLE_ICONS ? (
                <button
                  type="button"
                  onClick={() => setAllIcons(true)}
                  className="flex aspect-square min-h-11 items-center justify-center rounded-xl border-[1.5px] border-dashed border-admin-border text-[13px] font-semibold text-admin-muted"
                  aria-label="Ver todos os ícones"
                >
                  +{ICON_NAMES.length - VISIBLE_ICONS}
                </button>
              ) : null}
            </div>
          ) : null}

          {iconMode === "custom" && !thumb ? (
            <div className="flex items-center gap-3">
              {preview.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.src} alt="" className="size-11 rounded-xl border border-admin-line object-contain" />
              ) : null}
              <button type="button" onClick={() => fileInput.current?.click()} className={btnSecondary}>
                <Upload className="size-4" aria-hidden /> {preview.src ? "Trocar ícone" : "Enviar ícone"}
              </button>
            </div>
          ) : null}
          {!thumb ? <p className="text-[13px] text-admin-muted">Ícone próprio: PNG, JPG, WEBP ou SVG, até 600 KB, de preferência quadrado.</p> : null}
          {!thumb && (fileError || err.icon) ? <p className="text-[13.5px] font-semibold text-danger">{fileError ?? err.icon}</p> : null}
        </fieldset>
      </Section>

      {/* 3. Aparência */}
      <Section title="Aparência" description="O estilo define as cores. Trocar uma cor abaixo vale só para aquela parte.">
        {!thumb ? (
          <fieldset>
            <legend className="text-[14.5px] font-semibold">Estilo</legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PLAIN_STYLES.map((s) => (
                <label key={s} className={choiceTile(v.style === s)}>
                  <input type="radio" name="plainStyle" checked={v.style === s} onChange={() => set("style", s)} className="sr-only" />
                  <span aria-hidden className={`size-5 rounded-full ${SWATCH[s]}`} />
                  {STYLE_LABELS[s]}
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        <div>
          <p className="text-[14.5px] font-semibold">Cores</p>
          <div className="mt-1.5 overflow-hidden rounded-[14px] border-[1.5px] border-admin-border bg-white">
            {colorRows.map((r, i) => {
              const val = v.colors[r.key];
              const open = openColor === r.key;
              return (
                <div key={r.key} className={i > 0 ? "border-t border-admin-line" : ""}>
                  <input type="hidden" name={r.name} value={val ?? ""} />
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenColor(open ? null : r.key)}
                    className="flex min-h-[54px] w-full items-center gap-3 px-3.5 text-left"
                  >
                    <span aria-hidden className="size-[26px] shrink-0 rounded-lg border border-admin-border" style={{ backgroundColor: val ?? "transparent" }} />
                    <span className="flex-1 text-[15px] font-semibold">{r.label}</span>
                    <span className="text-[13px] text-admin-muted tabular-nums">{val ? val.toUpperCase() : "Do estilo"}</span>
                    <ChevronRight className={`size-4 text-admin-faint transition-transform ${open ? "rotate-90" : ""}`} aria-hidden />
                  </button>
                  {open ? (
                    <div className="px-3.5 pb-3.5">
                      <ColorField label={`Cor: ${r.label}`} value={val} onChange={(c) => setV((o) => ({ ...o, colors: { ...o.colors, [r.key]: c } }))} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <fieldset>
          <legend className="text-[14.5px] font-semibold">Animação</legend>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            {ANIMATIONS.map((a) => (
              <label key={a} className={choiceTile(v.animation === a)}>
                <input type="radio" name="animation" value={a} checked={v.animation === a} onChange={() => set("animation", a)} className="sr-only" />
                {ANIMATION_LABELS[a]}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-[13px] text-admin-muted">Um botão animado por vez. Dois ou mais e nenhum chama atenção.</p>
        </fieldset>
      </Section>

      {/* 4. Exibição */}
      <Section title="Exibição" description="Onde o botão fica na página e por quanto tempo.">
        <Toggle name="visible" checked={v.visible} onChange={(x) => set("visible", x)} title="Mostrar na página" description="Desligado, o botão fica guardado aqui e some do site." />
        <Toggle name="half" checked={v.half} onChange={(x) => set("half", x)} title="Meia largura" description="Divide a linha com o próximo botão que também estiver em meia largura." />
        <Toggle name="gapBefore" checked={v.gapBefore} onChange={(x) => set("gapBefore", x)} title="Começa um grupo aqui" description="Abre um respiro acima e libera o título do grupo abaixo." />
        <Field
          id="groupTitle"
          label="Título do grupo"
          hint="Aparece em caixa alta acima do grupo. Em branco, fica só o espaço."
          count={v.groupTitle.length}
          max={LIMITS.groupTitle}
          error={err.groupTitle}
        >
          <input
            id="groupTitle"
            name="groupTitle"
            placeholder="Ex.: Cursos"
            disabled={!v.gapBefore}
            value={v.groupTitle}
            onChange={(e) => set("groupTitle", e.target.value)}
            maxLength={LIMITS.groupTitle}
            className={inputClass}
          />
        </Field>

        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["startsAt", "endsAt"] as const).map((key) => (
              <Field key={key} id={key} label={key === "startsAt" ? "Aparece a partir de" : "Some depois de"} error={err[key]}>
                <div className="flex gap-2">
                  <input id={key} name={key} type="datetime-local" value={v[key]} onChange={(e) => set(key, e.target.value)} aria-invalid={!!err[key]} className={`${inputClass} min-w-0 flex-1`} />
                  {v[key] ? (
                    <button type="button" onClick={() => set(key, "")} className={`${btnGhost} mt-1.5 shrink-0`}>
                      Limpar
                    </button>
                  ) : null}
                </div>
              </Field>
            ))}
          </div>
          <p className="mt-1.5 text-[13px] text-admin-muted">Horário de Brasília. Em branco, o botão não tem data.</p>
        </div>

        <Field id="position" label="Posição" hint="Também dá para arrastar o cartão na lista.">
          <select id="position" name="position" value={v.position} onChange={(e) => set("position", Number(e.target.value))} className={`${inputClass} max-w-40`}>
            {Array.from({ length: maxPosition }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}º
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SubmitButton pending={saving} pendingText="Salvando…" className={`${btnPrimary} min-h-[52px] flex-1 basis-48`}>
          Salvar botão
        </SubmitButton>
        <Link href={base} className={btnGhost}>
          Cancelar
        </Link>
      </div>
    </form>
    {initial.id ? (
      <div className="mt-3 flex flex-wrap">
        <ConfirmDelete
          action={async () => {
            try {
              await run(() => deleteButton(initial.id!));
              router.push(base);
            } catch {
              /* a lista avisa se não conseguiu */
            }
          }}
          name={initial.label}
          detail="Os cliques registrados vão junto."
        />
      </div>
    ) : null}
    </>
  );
}
