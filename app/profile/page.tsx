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
  Edit2,
  Plus,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useSession, signOut } from "@/lib/auth-client";
import { formatNGN } from "@/lib/utils";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "paid" | "refunded";
  shippingAddress: {
    fullName?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
  } | null;
  createdAt: string;
  items: OrderItem[];
}

interface UserProfileData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  image?: string;
  createdAt: string;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "addresses" | "security">("overview");

  // Profile data
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Edit profile state
  const [editForm, setEditForm] = useState({ name: "", phone: "" });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddr, setNewAddr] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
    isDefault: false,
  });

  // Security / Password state
  const [pwdForm, setPwdForm] = useState({ current: "", newPwd: "", confirm: "" });
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Sign out confirmation modal
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Fetch Profile & Orders Data
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
      return;
    }

    if (session?.user) {
      setLoadingData(true);
      fetch("/api/v1/store/profile")
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            setProfile(resData.data.profile);
            setEditForm({
              name: resData.data.profile.name || "",
              phone: resData.data.profile.phone || "",
            });
            setOrdersList(resData.data.orders || []);
          }
        })
        .catch((err) => console.error("Profile fetch error:", err))
        .finally(() => setLoadingData(false));

      // Load saved addresses from localStorage
      const saved = localStorage.getItem(`sc_user_addresses_${session.user.id}`);
      if (saved) {
        try {
          setAddresses(JSON.parse(saved));
        } catch {
          // ignore
        }
      } else {
        // Default initial address
        const initialAddr: Address[] = [
          {
            id: "1",
            fullName: session.user.name || "Customer",
            phone: "+234 903 377 7385",
            street: "Grey parrot center, beside second gate urban shelter",
            city: "Millennium City",
            state: "Kaduna",
            country: "Nigeria",
            isDefault: true,
          },
        ];
        setAddresses(initialAddr);
        localStorage.setItem(`sc_user_addresses_${session.user.id}`, JSON.stringify(initialAddr));
      }
    }
  }, [session, isPending, router]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsUpdatingProfile(true);

    try {
      const res = await fetch("/api/v1/store/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, phone: editForm.phone }),
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.profile);
        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
      } else {
        setProfileMsg({ type: "error", text: data.error || "Failed to update profile." });
      }
    } catch {
      setProfileMsg({ type: "error", text: "An error occurred. Please try again." });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Add Address
  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddr.fullName || !newAddr.street || !newAddr.city || !newAddr.state) return;

    const newId = Date.now().toString();
    const updated = newAddr.isDefault
      ? addresses.map((a) => ({ ...a, isDefault: false }))
      : [...addresses];

    const addrToAdd: Address = {
      id: newId,
      ...newAddr,
      isDefault: addresses.length === 0 ? true : newAddr.isDefault,
    };

    const finalAddrs = [...updated, addrToAdd];
    setAddresses(finalAddrs);
    if (session?.user) {
      localStorage.setItem(`sc_user_addresses_${session.user.id}`, JSON.stringify(finalAddrs));
    }
    setShowAddressModal(false);
    setNewAddr({
      fullName: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      country: "Nigeria",
      isDefault: false,
    });
  };

  // Delete Address
  const handleDeleteAddress = (id: string) => {
    const filtered = addresses.filter((a) => a.id !== id);
    setAddresses(filtered);
    if (session?.user) {
      localStorage.setItem(`sc_user_addresses_${session.user.id}`, JSON.stringify(filtered));
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    if (session?.user) {
      localStorage.setItem(`sc_user_addresses_${session.user.id}`, JSON.stringify(updated));
    }
  };

  // Update Password Demo Handler
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwdForm.newPwd !== pwdForm.confirm) {
      setPwdMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (pwdForm.newPwd.length < 8) {
      setPwdMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }

    setIsUpdatingPwd(true);
    setTimeout(() => {
      setIsUpdatingPwd(false);
      setPwdMsg({ type: "success", text: "Password updated successfully!" });
      setPwdForm({ current: "", newPwd: "", confirm: "" });
    }, 800);
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (isPending || loadingData) {
    return (
      <ShopLayout>
        <PageBreadcrumb title="My Profile" crumbs={[]} />
        <div className="w-full max-w-[1280px] mx-auto py-16 px-4 flex flex-col items-center justify-center gap-3">
          <Loader2 size={36} className="animate-spin text-[#f57224]" />
          <p className="text-sm font-medium text-[#666]">Loading account profile...</p>
        </div>
      </ShopLayout>
    );
  }

  const userInitials = (profile?.name || session?.user?.name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333]">Delivered</span>;
      case "shipped":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e8f0fe] text-[#1a73e8]">Shipped</span>;
      case "processing":
      case "paid":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#feefc3] text-[#b06000]">Processing</span>;
      case "cancelled":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#c5221f]">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f1f3f4] text-[#5f6368]">Pending</span>;
    }
  };

  return (
    <ShopLayout>
      <PageBreadcrumb title="My Account" crumbs={[{ label: "Profile", href: "/profile" }]} />

      <div className="w-full max-w-[1280px] my-6 sm:my-10 mx-auto px-4">
        {/* User Banner Header */}
        <div className="bg-white border border-[#f0f0f0] rounded-xl p-5 sm:p-7 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#dc5f17] text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md">
              {userInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a]">
                  {profile?.name || session?.user?.name || "User"}
                </h1>
                <span className="px-2 py-0.5 rounded bg-[#f57224]/10 text-[#f57224] text-[11px] font-bold uppercase">
                  {profile?.role || "Customer"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#777] mt-0.5 flex items-center gap-1.5 justify-center sm:justify-start flex-wrap">
                <span>{profile?.email || session?.user?.email}</span>
                {profile?.phone && (
                  <>
                    <span>•</span>
                    <span>{profile.phone}</span>
                  </>
                )}
              </p>
              <p className="text-[11px] text-[#aaa] mt-1 flex items-center gap-1 justify-center sm:justify-start">
                <Calendar size={12} /> Member since{" "}
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "August 2026"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="px-4 py-2 bg-[#fafafa] hover:bg-[#fee2e2] text-[#dc2626] border border-[#eee] rounded-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Main Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar Tabs (Desktop Sidebar / Mobile Horizontal Scroll) */}
          <div className="lg:col-span-1 bg-white border border-[#f0f0f0] rounded-xl p-3 sm:p-4 shadow-sm">
            {/* Mobile Tab Pills Bar */}
            <div className="flex lg:flex-col overflow-x-auto no-scrollbar gap-1.5 p-1 bg-[#f9f9f9] lg:bg-transparent rounded-lg">
              {[
                { id: "overview", label: "Profile Overview", Icon: User },
                { id: "orders", label: `My Orders (${ordersList.length})`, Icon: ShoppingBag },
                { id: "addresses", label: "Shipping Addresses", Icon: MapPin },
                { id: "security", label: "Account Security", Icon: Lock },
              ].map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap text-left cursor-pointer w-full ${
                      isActive
                        ? "bg-[#1a1a1a] text-white shadow-xs"
                        : "text-[#555] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
                    }`}
                  >
                    <Icon size={16} className={isActive ? "text-[#f57224]" : "text-[#888]"} />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={14} className="hidden lg:block opacity-40" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content Panel */}
          <div className="lg:col-span-3 bg-white border border-[#f0f0f0] rounded-xl p-5 sm:p-8 shadow-sm min-h-[460px]">
            {/* TAB 1: OVERVIEW & PROFILE EDIT */}
            {activeTab === "overview" && (
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#f0f0f0]">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">Personal Details</h2>
                    <p className="text-xs text-[#888]">Manage your name, phone number, and account information.</p>
                  </div>
                </div>

                {profileMsg && (
                  <div
                    className={`p-3.5 rounded-md text-xs sm:text-sm mb-5 flex items-center gap-2.5 ${
                      profileMsg.type === "success"
                        ? "bg-[#edf7ed] border border-[#b7dfb9] text-[#1e4620]"
                        : "bg-[#fdf2f2] border border-[#f8b4b4] text-[#981b1b]"
                    }`}
                  >
                    {profileMsg.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="max-w-xl space-y-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                      Email Address <span className="text-[#888] font-normal">(Read only)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={profile?.email || session?.user?.email || ""}
                        className="w-full px-3.5 py-2.5 border border-[#eee] bg-[#f9f9f9] rounded text-sm text-[#777] cursor-not-allowed"
                      />
                      <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder="+234 801 234 5678"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                      />
                      <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#f57224] disabled:bg-[#888] text-white font-bold text-xs sm:text-sm rounded border-0 cursor-pointer transition-colors flex items-center gap-2"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: MY ORDERS */}
            {activeTab === "orders" && (
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#f0f0f0]">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">Order History</h2>
                    <p className="text-xs text-[#888]">Track and review all your previous purchases.</p>
                  </div>
                </div>

                {ordersList.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <Package size={48} className="text-[#ccc] mb-3" />
                    <h3 className="text-base font-bold text-[#1a1a1a] mb-1">No orders found</h3>
                    <p className="text-xs text-[#888] mb-5 max-w-sm">
                      You haven&apos;t placed any orders yet. Start exploring our collections today!
                    </p>
                    <Link
                      href="/products"
                      className="px-5 py-2.5 bg-[#f57224] hover:bg-[#e06010] text-white font-bold text-xs rounded no-underline transition-colors"
                    >
                      Shop Now
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ordersList.map((ord) => (
                      <div
                        key={ord.id}
                        className="border border-[#e9e9e9] rounded-lg p-4 sm:p-5 hover:border-[#f57224]/40 transition-colors bg-white shadow-2xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5f5f5]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1a1a1a]">{ord.orderNumber}</span>
                              {getStatusBadge(ord.status)}
                            </div>
                            <p className="text-xs text-[#888] mt-1 flex items-center gap-1">
                              <Clock size={13} /> Placed on {new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 sm:text-right justify-between sm:justify-end">
                            <div>
                              <span className="text-xs text-[#888] block">Total Amount</span>
                              <strong className="text-sm sm:text-base text-[#1a1a1a]">
                                {formatNGN(ord.totalAmount)}
                              </strong>
                            </div>

                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="px-3 py-1.5 bg-[#f5f5f5] hover:bg-[#1a1a1a] hover:text-white text-[#333] border-0 rounded text-xs font-semibold cursor-pointer transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs text-[#666]">
                          <span>
                            {ord.items.length} {ord.items.length === 1 ? "item" : "items"}:{" "}
                            <strong>{ord.items.map((i) => i.name).join(", ")}</strong>
                          </span>

                          <Link
                            href={`/orders/tracking?orderNumber=${ord.orderNumber}`}
                            className="text-[#f57224] font-semibold no-underline hover:underline flex items-center gap-1"
                          >
                            Track Status <ExternalLink size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED ADDRESSES */}
            {activeTab === "addresses" && (
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#f0f0f0]">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">Saved Addresses</h2>
                    <p className="text-xs text-[#888]">Manage your delivery destinations for faster checkout.</p>
                  </div>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="px-3.5 py-2 bg-[#f57224] hover:bg-[#e06010] text-white font-bold text-xs rounded border-0 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Address
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <MapPin size={44} className="text-[#ccc] mb-2" />
                    <p className="text-sm font-semibold text-[#555]">No addresses saved yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`p-4 border rounded-lg relative flex flex-col justify-between ${
                          addr.isDefault ? "border-[#f57224] bg-[#fffcfb]" : "border-[#e5e5e5] bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-sm text-[#1a1a1a]">{addr.fullName}</span>
                            {addr.isDefault ? (
                              <span className="px-2 py-0.5 rounded bg-[#f57224] text-white text-[10px] font-bold">
                                Default
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-[11px] text-[#f57224] hover:underline bg-transparent border-0 cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-[#666] leading-relaxed mb-1">{addr.street}</p>
                          <p className="text-xs text-[#666] leading-relaxed mb-2">
                            {addr.city}, {addr.state}, {addr.country}
                          </p>
                          <p className="text-xs text-[#888] font-medium flex items-center gap-1">
                            <Phone size={12} /> {addr.phone}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#f0f0f0] flex justify-end">
                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="text-xs text-[#dc2626] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ACCOUNT SECURITY */}
            {activeTab === "security" && (
              <div>
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#f0f0f0]">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#1a1a1a]">Account Security</h2>
                    <p className="text-xs text-[#888]">Update your account password and security preferences.</p>
                  </div>
                </div>

                {pwdMsg && (
                  <div
                    className={`p-3.5 rounded-md text-xs sm:text-sm mb-5 flex items-center gap-2.5 ${
                      pwdMsg.type === "success"
                        ? "bg-[#edf7ed] border border-[#b7dfb9] text-[#1e4620]"
                        : "bg-[#fdf2f2] border border-[#f8b4b4] text-[#981b1b]"
                    }`}
                  >
                    {pwdMsg.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{pwdMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="max-w-xl space-y-5">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPwd ? "text" : "password"}
                        required
                        value={pwdForm.current}
                        onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                        className="w-full pl-3.5 pr-11 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-[#aaa]"
                      >
                        {showCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? "text" : "password"}
                        required
                        placeholder="Min. 8 characters"
                        value={pwdForm.newPwd}
                        onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                        className="w-full pl-3.5 pr-11 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-[#aaa]"
                      >
                        {showNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#1a1a1a] mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter new password"
                      value={pwdForm.confirm}
                      onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-[#ddd] rounded text-sm outline-none focus:border-[#f57224] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingPwd}
                    className="px-6 py-2.5 bg-[#1a1a1a] hover:bg-[#f57224] disabled:bg-[#888] text-white font-bold text-xs sm:text-sm rounded border-0 cursor-pointer transition-colors flex items-center gap-2"
                  >
                    {isUpdatingPwd ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Updating Password...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-[#1a1a1a] mb-4">Add Shipping Address</h3>
            <form onSubmit={handleAddAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Recipient Name"
                  value={newAddr.fullName}
                  onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-[#ddd] rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="+234 903 377 7385"
                  value={newAddr.phone}
                  onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-[#ddd] rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#333] mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street name & house number"
                  value={newAddr.street}
                  onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                  className="w-full px-3 py-2 border border-[#ddd] rounded text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#333] mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full px-3 py-2 border border-[#ddd] rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#333] mb-1">State</label>
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    className="w-full px-3 py-2 border border-[#ddd] rounded text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#555] pt-1">
                <input
                  type="checkbox"
                  checked={newAddr.isDefault}
                  onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                  className="accent-[#f57224]"
                />
                Set as default shipping address
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 border border-[#ddd] rounded text-xs font-semibold cursor-pointer bg-white text-[#555]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#f57224] text-white border-0 rounded text-xs font-semibold cursor-pointer"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1a1a1a]">
                  Order {selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-[#888]">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-xs px-2.5 py-1 bg-[#f0f0f0] rounded border-0 cursor-pointer hover:bg-[#e0e0e0]"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-3 bg-[#fdfdfd] border border-[#f0f0f0] rounded">
                <span>Status:</span>
                {getStatusBadge(selectedOrder.status)}
              </div>

              <div>
                <h4 className="font-semibold text-xs text-[#1a1a1a] mb-2 uppercase tracking-wide">
                  Order Items ({selectedOrder.items.length})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 border border-[#eee] rounded"
                    >
                      <div>
                        <p className="font-semibold text-xs text-[#1a1a1a]">{item.name}</p>
                        <p className="text-[11px] text-[#777]">
                          Qty: {item.quantity} {item.size ? `• Size: ${item.size}` : ""}{" "}
                          {item.color ? `• Color: ${item.color}` : ""}
                        </p>
                      </div>
                      <span className="font-bold text-xs text-[#1a1a1a]">
                        {formatNGN(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#f0f0f0] space-y-1.5">
                <div className="flex justify-between text-xs text-[#666]">
                  <span>Subtotal</span>
                  <span>{formatNGN(selectedOrder.totalAmount - (selectedOrder.shippingFee || 0))}</span>
                </div>
                <div className="flex justify-between text-xs text-[#666]">
                  <span>Shipping Fee</span>
                  <span>{formatNGN(selectedOrder.shippingFee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#1a1a1a] pt-2 border-t border-[#eee]">
                  <span>Total Paid</span>
                  <span>{formatNGN(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl text-center">
            <LogOut size={36} className="text-[#dc2626] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1a1a1a] mb-1">Confirm Sign Out</h3>
            <p className="text-xs text-[#777] mb-6">Are you sure you want to sign out of your account?</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 border border-[#ddd] rounded text-xs font-semibold cursor-pointer bg-white text-[#555]"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white border-0 rounded text-xs font-semibold cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </ShopLayout>
  );
}
