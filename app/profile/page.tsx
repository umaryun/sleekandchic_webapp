"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  ShoppingBag,
  MapPin,
  Lock,
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Package,
  Clock,
  Phone,
  Mail,
  Calendar,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { authClient, useSession, signOut } from "@/lib/auth-client";
import { formatNGN } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/nigeria";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentMethod: "paystack" | "cod" | null;
  createdAt: string;
  items: OrderItem[];
}

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
}

interface Address {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

type Tab = "overview" | "orders" | "addresses" | "security";
type Message = { type: "success" | "error"; text: string } | null;

const EMPTY_ADDRESS = { firstName: "", lastName: "", phone: "", street: "", city: "", state: "", isDefault: false };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error(json?.error || "Something went wrong. Please try again.");
  return json.data as T;
}

function Banner({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <div
      role={message.type === "error" ? "alert" : "status"}
      className={`p-3.5 rounded-md text-xs sm:text-sm mb-5 flex items-center gap-2.5 ${
        message.type === "success"
          ? "bg-[#edf7ed] border border-[#b7dfb9] text-[#1e4620]"
          : "bg-[#fdf2f2] border border-[#f8b4b4] text-[#981b1b]"
      }`}
    >
      {message.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message.text}</span>
    </div>
  );
}

const inputClass = "w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#1a1a1a] transition-colors";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<Message>(null);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState(EMPTY_ADDRESS);
  const [addressMsg, setAddressMsg] = useState<Message>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<Message>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!isPending && !userId) router.push("/login?redirect=/profile");
  }, [isPending, userId, router]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([
      api<{ profile: UserProfileData; orders: Order[] }>("/api/v1/store/profile"),
      api<Address[]>("/api/v1/store/addresses"),
    ])
      .then(([data, saved]) => {
        if (cancelled) return;
        setProfile(data.profile);
        setEditForm({ name: data.profile.name || "", phone: data.profile.phone || "" });
        setOrdersList(data.orders || []);
        setAddresses(saved);
      })
      .catch((err) => console.error("Profile fetch error:", err))
      .finally(() => !cancelled && setLoadedFor(userId));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsUpdatingProfile(true);
    try {
      const data = await api<{ profile: UserProfileData }>("/api/v1/store/profile", {
        method: "PATCH",
        body: JSON.stringify({ name: editForm.name, phone: editForm.phone }),
      });
      setProfile(data.profile);
      setProfileMsg({ type: "success", text: "Your details were saved." });
    } catch (err) {
      setProfileMsg({ type: "error", text: err instanceof Error ? err.message : "Your details weren't saved." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const reloadAddresses = async () => setAddresses(await api<Address[]>("/api/v1/store/addresses"));

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    setAddressMsg(null);
    try {
      await api("/api/v1/store/addresses", { method: "POST", body: JSON.stringify(newAddr) });
      await reloadAddresses();
      setShowAddressModal(false);
      setNewAddr(EMPTY_ADDRESS);
      setAddressMsg({ type: "success", text: "Address saved. You can choose it at checkout." });
    } catch (err) {
      setAddressMsg({ type: "error", text: err instanceof Error ? err.message : "The address wasn't saved." });
    } finally {
      setSavingAddress(false);
    }
  };

  const changeAddress = async (id: string, request: RequestInit) => {
    setAddressMsg(null);
    try {
      await api(`/api/v1/store/addresses/${id}`, request);
      await reloadAddresses();
    } catch (err) {
      setAddressMsg({ type: "error", text: err instanceof Error ? err.message : "That didn't work. Please try again." });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdMsg({ type: "error", text: "The new passwords don't match." });
      return;
    }
    if (pwdForm.newPwd.length < 8) {
      setPwdMsg({ type: "error", text: "Use at least 8 characters for your new password." });
      return;
    }
    setIsUpdatingPwd(true);
    try {
      const res = await authClient.changePassword({
        currentPassword: pwdForm.current,
        newPassword: pwdForm.newPwd,
        revokeOtherSessions: true,
      });
      if (res.error) {
        setPwdMsg({ type: "error", text: res.error.message || "Your password wasn't changed. Check your current password." });
        return;
      }
      setPwdMsg({ type: "success", text: "Password changed. You've been signed out on your other devices." });
      setPwdForm({ current: "", newPwd: "", confirm: "" });
    } catch {
      setPwdMsg({ type: "error", text: "Your password wasn't changed. Please try again." });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending || !userId || loadedFor !== userId) {
    return (
      <ShopLayout>
        <PageBreadcrumb title="My Account" crumbs={[]} />
        <div className="w-full max-w-[1280px] mx-auto py-16 px-4 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#8a6452]" />
          <p className="text-sm font-medium text-[#666]">Loading your account…</p>
        </div>
      </ShopLayout>
    );
  }

  const displayName = profile?.name || session?.user?.name || "";
  const userInitials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333]">Delivered</span>;
      case "shipped":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8]">On its way</span>;
      case "processing":
      case "paid":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#feefc3] text-[#8a5300]">Preparing</span>;
      case "cancelled":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#c5221f]">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f1f3f4] text-[#5f6368]">Placed</span>;
    }
  };

  const paymentLine = (o: Order) =>
    o.paymentStatus === "paid"
      ? "Paid"
      : o.paymentStatus === "refunded"
        ? "Refunded"
        : o.paymentMethod === "cod"
          ? "Due on delivery"
          : "Not paid";

  return (
    <ShopLayout>
      <PageBreadcrumb title="My Account" crumbs={[]} />

      <div className="w-full max-w-[1280px] my-6 sm:my-10 mx-auto px-4">
        <div className="bg-white border border-[#f0f0f0] rounded-xl p-5 sm:p-7 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#8a6452] text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shrink-0">
              {userInitials}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">{displayName}</h1>
              <p className="text-xs sm:text-sm text-[#777] mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
                <span>{profile?.email || session?.user?.email}</span>
                {profile?.phone && (
                  <>
                    <span>•</span>
                    <span>{profile.phone}</span>
                  </>
                )}
              </p>
              {profile?.createdAt && (
                <p className="text-[11px] text-[#888] mt-1 flex items-center gap-1 justify-center sm:justify-start">
                  <Calendar size={12} /> Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="px-4 py-2 bg-[#fafafa] hover:bg-[#fee2e2] text-[#dc2626] border border-[#eee] rounded-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-1 bg-white border border-[#f0f0f0] rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex lg:flex-col overflow-x-auto gap-1.5 p-1 bg-[#f9f9f9] lg:bg-transparent rounded-lg" role="tablist">
              {(
                [
                  { id: "overview", label: "My Details", Icon: User },
                  { id: "orders", label: `My Orders (${ordersList.length})`, Icon: ShoppingBag },
                  { id: "addresses", label: "Addresses", Icon: MapPin },
                  { id: "security", label: "Password", Icon: Lock },
                ] as const
              ).map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer w-full ${
                      isActive ? "bg-[#1a1a1a] text-white" : "text-[#555] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-white" : "text-[#888]"} />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={14} className="hidden lg:block opacity-40" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3 bg-white border border-[#f0f0f0] rounded-xl p-5 sm:p-8 shadow-sm min-h-[460px]">
            {activeTab === "overview" && (
              <div>
                <div className="pb-4 mb-6 border-b border-[#f0f0f0]">
                  <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">My Details</h2>
                  <p className="text-xs text-[#888]">Your name and phone number.</p>
                </div>
                <Banner message={profileMsg} />
                <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-5">
                  <div>
                    <label htmlFor="pf-name" className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">Full name</label>
                    <input id="pf-name" type="text" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="pf-email" className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                      Email <span className="text-[#888] font-normal">(can&apos;t be changed)</span>
                    </label>
                    <div className="relative">
                      <input id="pf-email" type="email" disabled value={profile?.email || session?.user?.email || ""} className="w-full px-3.5 py-2.5 border border-[#eee] bg-[#f9f9f9] rounded text-sm text-[#777] cursor-not-allowed" />
                      <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pf-phone" className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">Phone</label>
                    <div className="relative">
                      <input id="pf-phone" type="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className={inputClass} />
                      <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                    </div>
                  </div>
                  <button type="submit" disabled={isUpdatingProfile} className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#333] disabled:bg-[#888] text-white font-bold text-xs sm:text-sm rounded cursor-pointer transition-colors flex items-center gap-2">
                    {isUpdatingProfile ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : "Save Changes"}
                  </button>
                </form>
              </div>
            )}

            {activeTab === "orders" && (
              <div>
                <div className="pb-4 mb-6 border-b border-[#f0f0f0]">
                  <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">My Orders</h2>
                  <p className="text-xs text-[#888]">Every order you&apos;ve placed while signed in.</p>
                </div>
                {ordersList.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <Package size={48} className="text-[#ccc] mb-3" />
                    <h3 className="text-base font-bold text-[#1a1a1a] mb-1">No orders yet</h3>
                    <p className="text-xs text-[#888] mb-5 max-w-sm">When you place an order, it will appear here.</p>
                    <Link href="/products" className="px-5 py-2.5 bg-[#1a1a1a] text-white font-bold text-xs rounded no-underline">Shop Now</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ordersList.map((ord) => (
                      <div key={ord.id} className="border border-[#e9e9e9] rounded-lg p-4 sm:p-5 bg-white">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5f5f5]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1a1a1a]">{ord.orderNumber}</span>
                              {getStatusBadge(ord.status)}
                            </div>
                            <p className="text-xs text-[#888] mt-1 flex items-center gap-1">
                              <Clock size={13} /> Placed on {new Date(ord.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 sm:text-right justify-between sm:justify-end">
                            <div>
                              <span className="text-xs text-[#888] block">{paymentLine(ord)}</span>
                              <strong className="text-sm sm:text-base text-[#1a1a1a]">{formatNGN(ord.totalAmount)}</strong>
                            </div>
                            <button type="button" onClick={() => setSelectedOrder(ord)} className="px-3 py-1.5 bg-[#f5f5f5] hover:bg-[#1a1a1a] hover:text-white text-[#333] rounded text-xs font-semibold cursor-pointer transition-colors">
                              View Details
                            </button>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs text-[#666]">
                          <span>
                            {ord.items.length} {ord.items.length === 1 ? "item" : "items"}: <strong>{ord.items.map((i) => i.name).join(", ")}</strong>
                          </span>
                          <Link href={`/orders/tracking?order=${encodeURIComponent(ord.orderNumber)}`} className="text-[#8a6452] font-semibold no-underline hover:underline flex items-center gap-1">
                            Track <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "addresses" && (
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#f0f0f0] gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">Addresses</h2>
                    <p className="text-xs text-[#888]">Saved addresses appear at checkout so you don&apos;t retype them.</p>
                  </div>
                  <button type="button" onClick={() => setShowAddressModal(true)} className="px-3.5 py-2 bg-[#1a1a1a] hover:bg-[#333] text-white font-bold text-xs rounded cursor-pointer transition-colors flex items-center gap-1.5 shrink-0">
                    <Plus size={14} /> Add Address
                  </button>
                </div>
                <Banner message={addressMsg} />
                {addresses.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <MapPin size={44} className="text-[#ccc] mb-2" />
                    <p className="text-sm font-semibold text-[#555]">No saved addresses yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className={`p-4 border rounded-lg flex flex-col justify-between ${addr.isDefault ? "border-[#1a1a1a]" : "border-[#e5e5e5]"}`}>
                        <div>
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <span className="font-bold text-sm text-[#1a1a1a]">
                              {[addr.firstName, addr.lastName].filter(Boolean).join(" ") || "Address"}
                            </span>
                            {addr.isDefault ? (
                              <span className="px-2 py-0.5 rounded bg-[#1a1a1a] text-white text-[10px] font-bold">Default</span>
                            ) : (
                              <button type="button" onClick={() => changeAddress(addr.id, { method: "PATCH", body: JSON.stringify({ isDefault: true }) })} className="text-[11px] text-[#8a6452] font-semibold hover:underline cursor-pointer">
                                Make default
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-[#666] leading-relaxed">{addr.street}</p>
                          <p className="text-xs text-[#666] leading-relaxed mb-2">{addr.city}, {addr.state}</p>
                          {addr.phone && (
                            <p className="text-xs text-[#888] font-medium flex items-center gap-1"><Phone size={12} /> {addr.phone}</p>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex justify-end">
                          <button type="button" onClick={() => changeAddress(addr.id, { method: "DELETE" })} className="text-xs text-[#dc2626] hover:underline flex items-center gap-1 cursor-pointer">
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div>
                <div className="pb-4 mb-6 border-b border-[#f0f0f0]">
                  <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">Change Password</h2>
                  <p className="text-xs text-[#888]">Changing your password signs you out on your other devices.</p>
                </div>
                <Banner message={pwdMsg} />
                <form onSubmit={handleUpdatePassword} className="max-w-xl space-y-5">
                  <div>
                    <label htmlFor="pw-current" className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">Current password</label>
                    <div className="relative">
                      <input id="pw-current" type={showCurrentPwd ? "text" : "password"} required autoComplete="current-password" value={pwdForm.current} onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })} className={`${inputClass} pr-11`} />
                      <button type="button" onClick={() => setShowCurrentPwd(!showCurrentPwd)} aria-label={showCurrentPwd ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#888]">
                        {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pw-new" className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">New password</label>
                    <div className="relative">
                      <input id="pw-new" type={showNewPwd ? "text" : "password"} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" value={pwdForm.newPwd} onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })} className={`${inputClass} pr-11`} />
                      <button type="button" onClick={() => setShowNewPwd(!showNewPwd)} aria-label={showNewPwd ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-[#888]">
                        {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pw-confirm" className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">Confirm new password</label>
                    <input id="pw-confirm" type="password" required autoComplete="new-password" value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} className={inputClass} />
                  </div>
                  <button type="submit" disabled={isUpdatingPwd} className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#333] disabled:bg-[#888] text-white font-bold text-xs sm:text-sm rounded cursor-pointer transition-colors flex items-center gap-2">
                    {isUpdatingPwd ? <><Loader2 size={16} className="animate-spin" /> Changing…</> : "Change Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="addr-title">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 id="addr-title" className="text-lg font-bold text-[#1a1a1a] mb-4">Add an address</h3>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ad-first" className="block text-xs font-semibold text-[#333] mb-1">First name</label>
                  <input id="ad-first" type="text" required autoComplete="given-name" value={newAddr.firstName} onChange={(e) => setNewAddr({ ...newAddr, firstName: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="ad-last" className="block text-xs font-semibold text-[#333] mb-1">Last name</label>
                  <input id="ad-last" type="text" required autoComplete="family-name" value={newAddr.lastName} onChange={(e) => setNewAddr({ ...newAddr, lastName: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label htmlFor="ad-phone" className="block text-xs font-semibold text-[#333] mb-1">Phone</label>
                <input id="ad-phone" type="tel" required autoComplete="tel" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label htmlFor="ad-street" className="block text-xs font-semibold text-[#333] mb-1">Street address</label>
                <input id="ad-street" type="text" required autoComplete="street-address" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ad-city" className="block text-xs font-semibold text-[#333] mb-1">City / Town</label>
                  <input id="ad-city" type="text" required autoComplete="address-level2" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="ad-state" className="block text-xs font-semibold text-[#333] mb-1">State</label>
                  <select id="ad-state" required value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} className={`${inputClass} bg-white`}>
                    <option value="" disabled>Choose</option>
                    {NIGERIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#555] pt-1">
                <input type="checkbox" checked={newAddr.isDefault} onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })} className="accent-[#1a1a1a]" />
                Make this my default address
              </label>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f0f0]">
                <button type="button" onClick={() => setShowAddressModal(false)} className="px-4 py-2 border border-[#ddd] rounded text-xs font-semibold cursor-pointer bg-white text-[#555]">Cancel</button>
                <button type="submit" disabled={savingAddress} className="px-4 py-2 bg-[#1a1a1a] text-white rounded text-xs font-semibold cursor-pointer disabled:opacity-60">
                  {savingAddress ? "Saving…" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="order-title">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-4">
              <div>
                <h3 id="order-title" className="text-base font-bold text-[#1a1a1a]">Order {selectedOrder.orderNumber}</h3>
                <p className="text-xs text-[#888]">Placed on {new Date(selectedOrder.createdAt).toLocaleDateString("en-NG")}</p>
              </div>
              <button type="button" onClick={() => setSelectedOrder(null)} className="text-xs px-2.5 py-1 bg-[#f0f0f0] rounded cursor-pointer hover:bg-[#e0e0e0]">Close</button>
            </div>
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 bg-[#fdfdfd] border border-[#f0f0f0] rounded">
                <span>Status</span>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <div>
                <h4 className="font-semibold text-xs text-[#1a1a1a] mb-2 uppercase tracking-wide">Items ({selectedOrder.items.length})</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 border border-[#eee] rounded">
                      <div>
                        <p className="font-semibold text-xs text-[#1a1a1a]">{item.name}</p>
                        <p className="text-[11px] text-[#777]">
                          Qty {item.quantity}
                          {item.size ? ` · Size ${item.size}` : ""}
                          {item.color ? ` · ${item.color}` : ""}
                        </p>
                      </div>
                      <span className="font-bold text-xs text-[#1a1a1a]">{formatNGN(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t border-[#f0f0f0] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#666]"><span>Subtotal</span><span>{formatNGN(selectedOrder.subtotal)}</span></div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-[#28a745]"><span>Discount</span><span>-{formatNGN(selectedOrder.discountAmount)}</span></div>
                )}
                <div className="flex justify-between text-[#666]"><span>Delivery</span><span>{selectedOrder.shippingFee === 0 ? "Free" : formatNGN(selectedOrder.shippingFee)}</span></div>
                <div className="flex justify-between text-sm font-bold text-[#1a1a1a] pt-2 border-t border-[#eee]">
                  <span>Total ({paymentLine(selectedOrder).toLowerCase()})</span>
                  <span>{formatNGN(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="signout-title">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl text-center">
            <LogOut size={36} className="text-[#dc2626] mx-auto mb-3" />
            <h3 id="signout-title" className="text-base font-bold text-[#1a1a1a] mb-1">Sign out?</h3>
            <p className="text-xs text-[#777] mb-6">You&apos;ll need your email and password to sign back in.</p>
            <div className="flex justify-center gap-3">
              <button type="button" onClick={() => setShowSignOutConfirm(false)} className="px-4 py-2 border border-[#ddd] rounded text-xs font-semibold cursor-pointer bg-white text-[#555]">Cancel</button>
              <button type="button" onClick={handleSignOut} className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded text-xs font-semibold cursor-pointer">Sign Out</button>
            </div>
          </div>
        </div>
      )}
    </ShopLayout>
  );
}
