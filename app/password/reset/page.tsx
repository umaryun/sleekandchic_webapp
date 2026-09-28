"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await (authClient as any).forgetPassword({
        email,
        redirectTo: "/password/new",
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to send reset email. Please try again.");
      } else {
        setSuccessMessage(
          "If an account exists with that email, we've sent a password reset link. Please check your inbox."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title="Reset Password" crumbs={[]} />
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
              🔑
            </div>
            <h2 className="text-white text-2xl font-extrabold mb-3 text-center">
              Forgot Password?
            </h2>
            <p className="text-[#888] text-sm text-center leading-relaxed max-w-[280px]">
              No worries! Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <div className="mt-8">
              <Link
                href="/login"
                className="px-6 py-2.5 border border-white/20 text-white no-underline rounded text-xs font-semibold hover:border-[#b88d7a] transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white p-6 sm:p-12 flex flex-col justify-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-1.5">
              Reset your password
            </h3>
            <p className="text-xs sm:text-sm text-[#888] mb-6 leading-relaxed">
              Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>

            {errorMessage && (
              <div className="p-3.5 bg-[#fdf2f2] border border-[#f8b4b4] rounded-md text-xs sm:text-sm mb-5 flex items-center gap-2.5">
                <AlertCircle size={18} className="shrink-0 text-[#981b1b]" />
                <span className="text-[#981b1b]">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-[#f0fdf4] border border-[#86efac] rounded-md text-xs sm:text-sm mb-5 flex items-center gap-2.5">
                <CheckCircle size={18} className="shrink-0 text-[#166534]" />
                <span className="text-[#166534]">{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                  Email Address <span className="text-[#f57224]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1a1a1a] hover:bg-[#b88d7a] disabled:bg-[#888] text-white border-0 rounded font-bold text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <p className="mt-5 text-xs sm:text-sm text-[#888] text-center">
              Remember your password?{" "}
              <Link href="/login" className="text-[#f57224] font-semibold no-underline hover:underline">
                Login
              </Link>
            </p>
          </div>
        </section>
      </div>
    </ShopLayout>
  );
}
