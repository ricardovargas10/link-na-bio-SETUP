import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Set Up | Escola de inglês para brasileiros";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const icon = await readFile(join(process.cwd(), "public/brand/icon.png"));
  const src = `data:image/png;base64,${icon.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "0 96px",
          background: "#FCF6EC",
          color: "#291D29",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} width={260} height={260} alt="" style={{ borderRadius: 48 }} />
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
            Escola de inglês para brasileiros
          </div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, marginTop: 24, letterSpacing: -2 }}>
            O inglês começa aqui e leva você para onde você quiser
          </div>
        </div>
      </div>
    ),
    size,
  );
}
