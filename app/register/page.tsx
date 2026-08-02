"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", agree: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirm) {
      setErrorMessage("Passwords do not match. Please verify your password.");
      return;
    }

    if (!form.agree) {
      setErrorMessage("Please agree to the Terms & Conditions to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to create account. Please try again.");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title="Sign Up" crumbs={[]} />
      <div className="w-full max-w-[1280px] my-6 sm:my-12 mx-auto px-4">
        <section className="grid grid-cols-1 lg:grid-cols-2 rounded-xl overflow-hidden border border-[#f0f0f0] shadow-md min-h-[560px]">
          {/* Left: Banner (Hidden on Mobile) */}
          <div className="hidden lg:flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-[#f57224] to-[#e06010]">
            {[240, 180, 120].map((size, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  border: `${32 - i * 8}px solid rgba(255,255,255,${0.06 + i * 0.02})`,
                  right: -size / 3,
                  bottom: -size / 3,
                }}
              />
            ))}
            <div
              style={{
                width: "180px",
                height: "180px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                backgroundImage: "url(https://placehold.co/180x180/f57224/fff?text=Join+Us)",
                backgroundSize: "cover",
                marginBottom: "28px",
              }}
            />
            <h2 className="text-white text-2xl font-extrabold mb-3 text-center">
              Join Sleekandchic Today!
            </h2>
            <p className="text-white/80 text-sm text-center leading-relaxed max-w-[280px]">
              Create an account to enjoy exclusive deals, save your addresses, and track your orders.
            </p>
            <div className="mt-7">
              <Link
                href="/login"
                className="px-6 py-2.5 bg-white/15 hover:bg-white/25 text-white no-underline rounded text-xs font-semibold border border-white/30 transition-colors"
              >
                Already have an account?
              </Link>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white p-6 sm:p-12 flex flex-col justify-center">
            <h3 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] mb-1.5">
              Create your account
            </h3>
            <p className="text-xs sm:text-sm text-[#888] mb-6">
              Fill in the form below to get started with Sleekandchic.
            </p>

            {errorMessage && (
              <div className="p-3.5 bg-[#fdf2f2] border border-[#f8b4b4] rounded-md text-[#981b1b] text-xs sm:text-sm mb-5 flex items-center gap-2.5">
                <AlertCircle size={18} className="shrink-0 text-[#981b1b]" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                  Full Name <span className="text-[#f57224]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                />
              </div>

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

              {/* Phone */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                    placeholder="Min. 8 characters"
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

              {/* Confirm Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                  Confirm Password <span className="text-[#f57224]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    placeholder="Re-enter password"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className="w-full pl-3.5 pr-11 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-[#aaa]"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs sm:text-sm text-[#555] mt-1">
                <input
                  type="checkbox"
                  required
                  checked={form.agree}
                  onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                  className="accent-[#f57224] w-4 h-4 mt-0.5 shrink-0"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#f57224] no-underline font-medium hover:underline">
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy-policy" className="text-[#f57224] no-underline font-medium hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#f57224] hover:bg-[#e06010] disabled:bg-[#ffa876] text-white border-0 rounded font-bold text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            </form>

            <p className="mt-4 text-xs sm:text-sm text-[#888] text-center">
              Already have an account?{" "}
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
