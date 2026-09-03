import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const uploadDirectory = fileURLToPath(new URL("../uploads/", import.meta.url));

export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const allowedAttachmentTypes = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
  ["application/pdf", [".pdf"]],
]);

export function isPermittedAttachment(file: Express.Multer.File): boolean {
  const extensions = allowedAttachmentTypes.get(file.mimetype);
  if (!extensions || !extensions.includes(extname(file.originalname).toLowerCase())) return false;
  const bytes = file.buffer;
  if (file.mimetype === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (file.mimetype === "image/webp") return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-";
}

export async function storeAttachment(buffer: Buffer, originalName: string): Promise<string> {
  await mkdir(uploadDirectory, { recursive: true });
  const storageKey = `${randomUUID()}${extname(originalName).toLowerCase()}`;
  await writeFile(join(uploadDirectory, storageKey), buffer, { flag: "wx" });
  return storageKey;
}

export async function readStoredAttachment(storageKey: string): Promise<Buffer> {
  return readFile(join(uploadDirectory, storageKey));
}

export async function removeStoredAttachment(storageKey: string): Promise<void> {
  await unlink(join(uploadDirectory, storageKey)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}
