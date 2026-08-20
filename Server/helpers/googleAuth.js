const { OAuth2Client } = require("google-auth-library");
const HttpError = require("./HttpError");

const client = new OAuth2Client();

function displayName(payload) {
  const fromName = String(payload.name || "").trim();
  if (fromName) return fromName;

  const parts = [payload.given_name, payload.family_name]
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  if (parts.length) return parts.join(" ");

  const email = String(payload.email || "");
  return email.split("@")[0] || "Pasien";
}

async function verifyGoogleIdToken(idToken) {
  const audience = process.env.GOOGLE_CLIENT_ID;
  if (!audience) {
    throw new HttpError(500, "Login Google belum dikonfigurasi");
  }
  if (!idToken || !String(idToken).trim()) {
    throw new HttpError(400, "Token Google wajib diisi");
  }

  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: String(idToken).trim(),
      audience,
    });
    payload = ticket.getPayload();
  } catch {
    throw new HttpError(401, "Token Google tidak valid");
  }

  if (!payload?.email || payload.email_verified === false) {
    throw new HttpError(401, "Akun Google tidak valid");
  }

  return {
    email: String(payload.email).trim().toLowerCase(),
    name: displayName(payload),
  };
}

module.exports = { verifyGoogleIdToken };
