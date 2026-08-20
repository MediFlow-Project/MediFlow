import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useDispatch } from "react-redux";
import { clearAuthError, loginWithGoogle, setAuthError } from "../store/authSlice";

export default function GoogleSignInButton({ onLoggedIn }) {
  const dispatch = useDispatch();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(280);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(Math.max(200, Math.floor(el.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!clientId) return null;

  async function handleSuccess(credentialResponse) {
    dispatch(clearAuthError());
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      dispatch(setAuthError("Login Google gagal. Coba lagi."));
      return;
    }

    const result = await dispatch(loginWithGoogle(idToken));
    if (loginWithGoogle.fulfilled.match(result)) {
      onLoggedIn(result.payload.user);
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[var(--color-paper-raised)] px-3 text-sm text-muted">
            atau
          </span>
        </div>
      </div>
      <div ref={wrapRef} className="flex min-h-10 w-full justify-center">
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => dispatch(setAuthError("Login Google gagal. Coba lagi."))}
          text="continue_with"
          locale="id"
          shape="rectangular"
          theme="outline"
          size="large"
          width={String(width)}
        />
      </div>
    </div>
  );
}
