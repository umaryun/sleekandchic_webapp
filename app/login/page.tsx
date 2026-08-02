"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const res = await signIn.email({
        email: form.email,
        password: form.password,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Invalid email or password. Please try again.");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title="Login" crumbs={[]} />
      <div className="w-full max-w-[1280px] my-6 sm:my-12 mx-auto px-4">
        <section className="grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden border border-[#f0f0f0] shadow-md min-h-[540px]">
          {/* Left: Banner (Hidden on Mobile) */}
          <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]">
            {/* Decorative circles */}
            {[220, 160, 100].map((size, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  border: `${30 - i * 8}px solid rgba(245,114,36,${0.06 + i * 0.02})`,
                  right: -size / 3,
                  top: -size / 3,
                }}
              />
            ))}
            <div
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                backgroundImage: "url(https://placehold.co/180x180/2a2a2a/555?text=Sleek%26Chic)",
                backgroundSize: "cover",
                marginBottom: "28px",
              }}
            />
            <h2 className="text-white text-2xl font-extrabold mb-3 text-center">
              Welcome Back!
            </h2>
            <p className="text-[#888] text-sm text-center leading-relaxed max-w-[280px]">
              Sign in to your account to access your orders, cart, and personalized recommendations.
            </p>
            <div className="mt-8">
              <Link
                href="/register"
                className="px-6 py-2.5 border border-white/20 text-white no-underline rounded text-xs font-semibold hover:border-[#f57224] transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white p-6 sm:p-12 flex flex-col justify-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-1.5">
              Login to your account
            </h3>
            <p className="text-xs sm:text-sm text-[#888] mb-6 leading-relaxed">
              Your personal data will be used to manage access to your account and orders.
            </p>

            {errorMessage && (
              <div className="p-3.5 bg-[#fdf2f2] border border-[#f8b4b4] rounded-md color-[#981b1b] text-xs sm:text-sm mb-5 flex items-center gap-2.5">
                <AlertCircle size={18} className="shrink-0 text-[#981b1b]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                  Email Address <span className="text-[#f57224]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                  Password <span className="text-[#f57224]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
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

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-[#555]">
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    className="accent-[#f57224] w-4 h-4"
                  />
                  Remember me
                </label>
                <Link href="/password/reset" className="text-[#f57224] no-underline font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1a1a1a] hover:bg-[#f57224] disabled:bg-[#888] text-white border-0 rounded font-bold text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <p className="mt-5 text-xs sm:text-sm text-[#888] text-center">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[#f57224] font-semibold no-underline hover:underline">
                Register now
              </Link>
            </p>
          </div>
        </section>
      </div>
    </ShopLayout>
  );
}
