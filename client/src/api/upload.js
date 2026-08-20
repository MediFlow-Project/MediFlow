import { sendJsonOrForm } from "./http";

export function toAdminFormData(fields, file) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) {
      body.append(key, "");
      return;
    }
    body.append(key, String(value));
  });
  if (file) body.append("file", file);
  return body;
}

export function adminSave(method, path, payload) {
  return sendJsonOrForm(method, path, payload);
}

export async function uploadAdminImage(file, folder) {
  const body = new FormData();
  body.append("file", file);
  if (folder) body.append("folder", folder);
  const { data } = await sendJsonOrForm("post", "/admin/uploads", body);
  if (!data?.url) {
    throw new Error("Gagal mengunggah foto");
  }
  return data.url;
}
