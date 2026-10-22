"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, X } from "lucide-react";

interface Announcement {
  text: string;
  link: string;
}

const DISMISSED_KEY = "sc-announcement-dismissed";

/** The owner's message across the top of the shop (admin → Settings). Shoppers can close it. */
export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/store/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const a = json?.data?.announcement as Announcement | null | undefined;
        // A closed announcement stays closed until the owner writes a new one.
        if (!cancelled && a?.text && sessionStorage.getItem(DISMISSED_KEY) !== a.text) setAnnouncement(a);
      })
      .catch(() => {
        // No announcement is fine.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!announcement) return null;

  const text = (
    <>
      {announcement.text}
      {announcement.link && (
        <span className="ml-1.5 inline-flex items-center font-semibold underline underline-offset-2">
          Shop now <ChevronRight size={13} aria-hidden />
        </span>
      )}
    </>
  );

  return (
    <div className="relative bg-[#1a1a1a] px-10 py-2 text-center text-xs tracking-wide text-white sm:text-[13px]" role="region" aria-label="Announcement">
      {announcement.link ? (
        <Link href={announcement.link} className="hover:text-white/85">
          {text}
        </Link>
      ) : (
        <p>{text}</p>
      )}
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISSED_KEY, announcement.text);
          setAnnouncement(null);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-white/70 hover:text-white"
        aria-label="Close announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
