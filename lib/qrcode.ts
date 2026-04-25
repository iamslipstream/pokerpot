import QRCode from "qrcode";

export async function qrSvgDataUri(text: string): Promise<string> {
  const svg = await QRCode.toString(text, {
    type: "svg",
    margin: 1,
    width: 240,
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "M",
  });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
