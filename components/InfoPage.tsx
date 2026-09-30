import type { ReactNode } from "react";
import ShopLayout from "@/components/ShopLayout";
import PageBreadcrumb from "@/components/PageBreadcrumb";

/** Layout for text pages (help, policies, about). */
export default function InfoPage({
  title,
  intro,
  updated,
  children,
}: {
  title: string;
  intro?: ReactNode;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <ShopLayout>
      <PageBreadcrumb title={title} crumbs={[]} />
      <article className="max-w-[720px] mx-auto px-4 py-10 sm:py-14 text-[15px] leading-[1.75] text-[#444]">
        <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#1a1a1a] leading-tight mb-3">{title}</h1>
        {updated && <p className="text-xs text-[#888] mb-6">Last updated {updated}</p>}
        {intro && <div className="text-base text-[#555] mb-8">{intro}</div>}
        <div className="space-y-8 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#1a1a1a] [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-[#8a6452] [&_a]:font-semibold">
          {children}
        </div>
      </article>
    </ShopLayout>
  );
}
