"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!token) {
      setErrorMessage("Invalid or missing reset token. Please request a new reset link.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to reset password. The link may have expired.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-white p-6 sm:p-12 flex flex-col justify-center items-center text-center">
        <AlertCircle size={48} className="text-[#981b1b] mb-4" />
        <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-2">
          Invalid Reset Link
        </h3>
        <p className="text-sm text-[#888] mb-6 max-w-[320px]">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/password/reset"
          className="px-6 py-2.5 bg-[#1a1a1a] text-white no-underline rounded text-sm font-semibold hover:bg-[#b88d7a] transition-colors"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white p-6 sm:p-12 flex flex-col justify-center items-center text-center">
        <CheckCircle size={48} className="text-[#166534] mb-4" />
        <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-2">
          Password Reset Successful!
        </h3>
        <p className="text-sm text-[#888] mb-6 max-w-[320px]">
          Your password has been updated. Redirecting you to the login page...
        </p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-[#1a1a1a] text-white no-underline rounded text-sm font-semibold hover:bg-[#b88d7a] transition-colors"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-12 flex flex-col justify-center">
      <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-1.5">
        Set a new password
      </h3>
      <p className="text-xs sm:text-sm text-[#888] mb-6 leading-relaxed">
        Enter your new password below. Make sure it&apos;s at least 8 characters.
      </p>

      {errorMessage && (
        <div className="p-3.5 bg-[#fdf2f2] border border-[#f8b4b4] rounded-md text-xs sm:text-sm mb-5 flex items-center gap-2.5">
          <AlertCircle size={18} className="shrink-0 text-[#981b1b]" />
          <span className="text-[#981b1b]">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
            New Password <span className="text-[#f57224]">*</span>
          </label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-3.5 pr-11 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-[#aaa]"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
            Confirm Password <span className="text-[#f57224]">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPwd ? "text" : "password"}
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-3.5 pr-11 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-[#aaa]"
            >
              {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#1a1a1a] hover:bg-[#b88d7a] disabled:bg-[#888] text-white border-0 rounded font-bold text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Resetting...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}

export default function NewPasswordPage() {
  return (
    <ShopLayout>
      <PageBreadcrumb title="New Password" crumbs={[]} />
      <div className="w-full max-w-[1280px] my-6 sm:my-12 mx-auto px-4">
        <section className="grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden border border-[#f0f0f0] shadow-md min-h-[480px]">
          {/* Left: Banner */}
          <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
            {[220, 160, 100].map((size, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  border: `${30 - i * 8}px solid rgba(184,141,122,${0.06 + i * 0.02})`,
                  right: -size / 3,
                  top: -size / 3,
                }}
              />
            ))}
            <div
              style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "28px",
                fontSize: "40px",
              }}
            >
              🔒
            </div>
            <h2 className="text-white text-2xl font-extrabold mb-3 text-center">
              Almost There!
            </h2>
            <p className="text-[#888] text-sm text-center leading-relaxed max-w-[280px]">
              Choose a strong password to keep your account secure.
            </p>
          </div>

          {/* Right: Form */}
          <Suspense
            fallback={
              <div className="bg-white p-12 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#888]" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </section>
      </div>
    </ShopLayout>
  );
}
