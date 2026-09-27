import { getCurrentUser } from "@/app/api/utils/auth";
import { generalLimiter } from "@/app/api/utils/rate-limit";
import { MAX_UPLOAD_BYTES, saveUpload } from "@/app/api/utils/uploads";

// POST multipart/form-data with a "file" field. Any signed-in user (admin or crew).
export async function POST(request) {
  const limited = generalLimiter(request);
  if (limited) return limited;
  const user = await getCurrentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (Number(request.headers.get("content-length") || 0) > MAX_UPLOAD_BYTES + 64 * 1024) {
    return Response.json({ error: "File too large (10 MB max)." }, { status: 413 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json({ error: "Attach a file in the 'file' field." }, { status: 400 });
    }
    const result = await saveUpload(Buffer.from(await file.arrayBuffer()));
    if (result.error) return Response.json({ error: result.error }, { status: result.status });
    return Response.json(result, { status: 201 });
  } catch (error) {
    console.error("Upload failed:", error);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
