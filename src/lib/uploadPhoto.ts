import { createClient } from "@/lib/supabase/client";

/** Uploads a File to the given public bucket and returns its public URL. */
export async function uploadPhoto(bucket: "customer-photos" | "article-photos", file: File) {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
