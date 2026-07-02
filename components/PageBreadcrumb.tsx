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

export default function PageBreadcrumb({ title, crumbs = [] }: PageBreadcrumbProps) {
  return (
    <div
      style={{
        background: "#f8f8f8",
        borderBottom: "1px solid #efefef",
        padding: "30px 0",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a1a" }}>{title}</h1> */}
        <nav style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
          <Link href="/" style={{ color: "#666", textDecoration: "none" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#b88d7a")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#666")}
          >
            Home
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ChevronRight size={12} color="#ccc" />
              {crumb.href ? (
                <Link href={crumb.href} style={{ color: "#666", textDecoration: "none" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#b88d7a")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#666")}
                >
                  {crumb.label}
                </Link>
              ) : (
                <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{crumb.label}</span>
              )}
            </span>
          ))}
          <ChevronRight size={12} color="#ccc" />
          <span style={{ color: "#1a1a1a", fontWeight: 500 }}>{title}</span>
        </nav>
      </div>
    </div>
  );
}
