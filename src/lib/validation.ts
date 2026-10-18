import { z } from "zod";

export const TITLE_MAX = 200;
/** Serialized TipTap JSON cap (about 1 MB). Plenty for text, blocks pasted binaries. */
export const CONTENT_MAX_BYTES = 1_000_000;
export const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty.")
  .max(TITLE_MAX, `Title must be ${TITLE_MAX} characters or fewer.`);

export const contentSchema = z
  .looseObject({
    type: z.literal("doc"),
    content: z.array(z.unknown()).optional(),
  })
  .refine((c) => JSON.stringify(c).length <= CONTENT_MAX_BYTES, {
    message: "Document is too large to save.",
  });

export const createDocumentSchema = z.object({
  title: titleSchema.optional(),
});

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    /** ISO timestamp the client last saw; used to detect concurrent edits. */
    baseUpdatedAt: z.iso.datetime().optional(),
  })
  .refine((v) => v.title !== undefined || v.content !== undefined, {
    message: "Nothing to update.",
  });

export const shareSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  role: z.enum(["viewer", "editor"]),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(60, "Name must be 60 characters or fewer."),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ShareInput = z.infer<typeof shareSchema>;
