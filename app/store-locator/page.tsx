"use client";

import { useState } from "react";
import { MapPin, Phone, Clock, Search, ExternalLink } from "lucide-react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

const STORES = [
  { id: 1, name: "Sleekandchic New York — Flagship", address: "24 E 64th St, New York, NY 10065", phone: "+1 (212) 555-0182", hours: "Mon–Sat: 10am–9pm · Sun: 11am–7pm", lat: 40.769, lng: -73.971, mapLabel: "New York, NY" },
  { id: 2, name: "Sleekandchic Los Angeles", address: "8500 Beverly Blvd, Los Angeles, CA 90048", phone: "+1 (310) 555-0193", hours: "Mon–Sat: 10am–8pm · Sun: 11am–6pm", lat: 34.076, lng: -118.386, mapLabel: "Los Angeles, CA" },
  { id: 3, name: "Sleekandchic London", address: "145 Oxford Street, London W1D 2JD, UK", phone: "+44 20 7946 0958", hours: "Mon–Sat: 10am–8pm · Sun: 12pm–6pm", lat: 51.514, lng: -0.142, mapLabel: "London, UK" },
  { id: 4, name: "Sleekandchic Paris", address: "17 Avenue des Champs-Élysées, Paris 75008", phone: "+33 1 42 99 00 10", hours: "Mon–Sat: 10am–9pm · Sun: 11am–7pm", lat: 48.871, lng: 2.308, mapLabel: "Paris, France" },
  { id: 5, name: "Sleekandchic Berlin", address: "Kurfürstendamm 28, 10719 Berlin, Germany", phone: "+49 30 8899 4421", hours: "Mon–Sat: 10am–8pm · Closed Sunday", lat: 52.502, lng: 13.328, mapLabel: "Berlin, Germany" },
  { id: 6, name: "Sleekandchic Lagos", address: "1532 Adeola Odeku St, Victoria Island, Lagos", phone: "+234 1 461 0000", hours: "Mon–Sat: 9am–8pm · Sun: 12pm–6pm", lat: 6.428, lng: 3.420, mapLabel: "Lagos, Nigeria" },
  { id: 7, name: "Sleekandchic Tokyo", address: "5-5-3 Ginza, Chuo City, Tokyo 104-0061", phone: "+81 3-6271-0900", hours: "Daily: 11am–9pm", lat: 35.671, lng: 139.764, mapLabel: "Tokyo, Japan" },
  { id: 8, name: "Sleekandchic Sydney", address: "500 George St, Sydney NSW 2000, Australia", phone: "+61 2 9265 6000", hours: "Mon–Sat: 9am–7pm · Sun: 11am–5pm", lat: -33.873, lng: 151.206, mapLabel: "Sydney, Australia" },
];

export default function StoreLocatorPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(1);

  const filtered = STORES.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.address.toLowerCase().includes(query.toLowerCase()) ||
    s.mapLabel.toLowerCase().includes(query.toLowerCase())
  );

  const selected = STORES.find(s => s.id === selectedId);

  return (
    <ShopLayout>
      <PageBreadcrumb title="Store Locator" crumbs={[]} />

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)", padding: "48px 16px", textAlign: "center" }}>
        <MapPin size={32} color="#f57224" style={{ marginBottom: "14px" }} />
        <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#fff", marginBottom: "10px" }}>Find a Store Near You</h2>
        <p style={{ fontSize: "15px", color: "#888", marginBottom: "28px" }}>Visit one of our {STORES.length} locations worldwide</p>
        {/* Search */}
        <div style={{ maxWidth: "480px", margin: "0 auto", display: "flex", boxShadow: "0 4px 24px rgba(0,0,0,0.2)", borderRadius: "4px", overflow: "hidden" }}>
          <input
            type="text"
            placeholder="Search by city, country or store name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, padding: "14px 18px", border: "none", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
          />
          <button style={{ padding: "0 20px", background: "#f57224", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Search size={18} color="#fff" />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "36px auto", padding: "0 16px", display: "grid", gridTemplateColumns: "400px 1fr", gap: "24px", alignItems: "flex-start" }}>
        {/* Store List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "640px", overflowY: "auto", paddingRight: "4px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#aaa", fontSize: "14px" }}>
              No stores found matching &ldquo;{query}&rdquo;
            </div>
          )}
          {filtered.map(store => (
            <button
              key={store.id}
              onClick={() => setSelectedId(store.id)}
              style={{
                padding: "18px 20px",
                background: "#fff",
                border: `2px solid ${selectedId === store.id ? "#f57224" : "#f0f0f0"}`,
                borderRadius: "8px",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: selectedId === store.id ? "0 4px 16px rgba(245,114,36,0.15)" : "none",
              }}
              onMouseEnter={(e) => { if (selectedId !== store.id) (e.currentTarget as HTMLButtonElement).style.borderColor = "#f0c090"; }}
              onMouseLeave={(e) => { if (selectedId !== store.id) (e.currentTarget as HTMLButtonElement).style.borderColor = "#f0f0f0"; }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: selectedId === store.id ? "#f57224" : "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.2s" }}>
                  <MapPin size={16} color={selectedId === store.id ? "#fff" : "#aaa"} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", marginBottom: "3px" }}>{store.name}</p>
                  <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.5, marginBottom: "4px" }}>{store.address}</p>
                  <p style={{ fontSize: "12px", color: "#888", display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={11} /> {store.hours.split("·")[0].trim()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map + Detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Map placeholder */}
          <div style={{ borderRadius: "8px", overflow: "hidden", height: "380px", position: "relative", background: "#e0e8f0", border: "1px solid #f0f0f0" }}>
            <img
              src={`https://placehold.co/800x380/d8e4f0/888?text=${encodeURIComponent(selected?.mapLabel ?? "Select a Store")}`}
              alt="Store map"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {selected && (
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -60%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50% 50% 50% 0", background: "#f57224", transform: "rotate(-45deg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ transform: "rotate(45deg)" }}>
                    <MapPin size={18} color="#fff" />
                  </div>
                </div>
                <div style={{ background: "#fff", padding: "6px 12px", borderRadius: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontSize: "13px", fontWeight: 700, color: "#1a1a1a", whiteSpace: "nowrap", marginTop: "6px" }}>
                  {selected.name}
                </div>
              </div>
            )}
            <div style={{ position: "absolute", bottom: "12px", right: "12px" }}>
              <a href={`https://maps.google.com/?q=${selected?.address}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 14px", background: "#fff", border: "1px solid #e5e5e5", borderRadius: "4px", fontSize: "12px", fontWeight: 600, color: "#1a1a1a", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", transition: "background 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f5f5f5")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#fff")}
              >
                <ExternalLink size={12} /> Open in Google Maps
              </a>
            </div>
          </div>

          {/* Selected store detail */}
          {selected && (
            <div style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "24px 28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1a1a1a", marginBottom: "16px" }}>{selected.name}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {[
                  { Icon: MapPin, label: "Address", value: selected.address },
                  { Icon: Phone, label: "Phone", value: selected.phone },
                  { Icon: Clock, label: "Hours", value: selected.hours },
                ].map(({ Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", gap: "12px", alignItems: "flex-start", gridColumn: label === "Hours" ? "span 2" : "span 1" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#fff3ec", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      <Icon size={14} color="#f57224" />
                    </div>
                    <div>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>{label}</p>
                      <p style={{ fontSize: "13px", color: "#555", lineHeight: 1.6 }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <a href={`https://maps.google.com/?q=${selected.address}`} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, padding: "11px", background: "#f57224", color: "#fff", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "13px", textAlign: "center", transition: "background 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#e06010")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f57224")}
                >
                  Get Directions
                </a>
                <a href={`tel:${selected.phone.replace(/\s/g, "")}`}
                  style={{ flex: 1, padding: "11px", border: "2px solid #1a1a1a", color: "#1a1a1a", textDecoration: "none", borderRadius: "4px", fontWeight: 700, fontSize: "13px", textAlign: "center", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#1a1a1a"; (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; (e.currentTarget as HTMLAnchorElement).style.color = "#1a1a1a"; }}
                >
                  Call Store
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All stores grid */}
      <div style={{ maxWidth: "1280px", margin: "0 auto 56px", padding: "0 16px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a1a", marginBottom: "20px" }}>All Locations</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {STORES.map(store => (
            <div key={store.id} style={{ background: "#fff", border: "1px solid #f0f0f0", borderRadius: "8px", padding: "20px", transition: "box-shadow 0.2s, border-color 0.2s", cursor: "pointer" }}
              onClick={() => setSelectedId(store.id)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#f57224"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.borderColor = "#f0f0f0"; }}
            >
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#fff3ec", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <MapPin size={18} color="#f57224" />
              </div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "#1a1a1a", marginBottom: "4px" }}>{store.name}</p>
              <p style={{ fontSize: "12px", color: "#888", lineHeight: 1.5 }}>{store.mapLabel}</p>
            </div>
          ))}
        </div>
      </div>
    </ShopLayout>
  );
}
