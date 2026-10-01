import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

interface PageBreadcrumbProps {
  title: string;
  crumbs?: Crumb[];
}

const linkClass = "text-[#666] no-underline hover:text-[#8a6452] transition-colors";

export default function PageBreadcrumb({ title, crumbs = [] }: PageBreadcrumbProps) {
  return (
    <div className="bg-[#f8f8f8] border-b border-[#efefef] py-[30px]">
      <nav aria-label="Breadcrumb" className="max-w-[1280px] mx-auto px-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-[13px] list-none p-0 m-0">
          <li>
            <Link href="/" className={linkClass}>
              Home
            </Link>
          </li>
          {crumbs.map((crumb) => (
            <li key={crumb.label} className="flex items-center gap-1.5">
              <ChevronRight size={12} color="#ccc" aria-hidden />
              {crumb.href ? (
                <Link href={crumb.href} className={linkClass}>
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[#1a1a1a] font-medium">{crumb.label}</span>
              )}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <ChevronRight size={12} color="#ccc" aria-hidden />
            <span aria-current="page" className="text-[#1a1a1a] font-medium">
              {title}
            </span>
          </li>
        </ol>
      </nav>
    </div>
  );
}
