import Link from "next/link";

import { getPublicSiteData } from "@/lib/portfolio-data";

export async function SiteHeader() {
  const { name } = await getPublicSiteData();

  return (
    <header className="w-full border-b border-neutral-800">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-100 no-underline transition hover:opacity-80"
          aria-label="Amiracle home"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shrink-0"
            aria-hidden="true"
          >
            <g clipPath="url(#header-star-clip)">
              <path
                d="M4.86069 0.0417987C4.81873 0.0691199 4.78488 0.108197 4.76297 0.154621L3.60857 2.60795C3.53243 2.76958 3.41998 2.90939 3.2809 3.01534C3.14181 3.12129 2.98026 3.19021 2.81015 3.21617L0.227879 3.61203C0.178735 3.61932 0.132531 3.64094 0.0945297 3.67442C0.0565283 3.7079 0.0282576 3.7519 0.0129381 3.80141C-0.00238147 3.85093 -0.00413395 3.90395 0.00788035 3.95446C0.0198947 4.00496 0.0451927 4.05091 0.0808926 4.08707L1.94872 5.99405C2.07202 6.11997 2.16425 6.27545 2.21747 6.44709C2.27069 6.61873 2.28329 6.80137 2.2542 6.97926L1.81374 9.67378C1.80517 9.72501 1.81048 9.77773 1.82906 9.82595C1.84765 9.87417 1.87877 9.91595 1.91887 9.94654C1.95898 9.97713 2.00647 9.99531 2.05594 9.99899C2.10541 10.0027 2.15487 9.99173 2.1987 9.9674L4.50699 8.69433C4.65912 8.61056 4.82837 8.56679 5.0002 8.56679C5.17202 8.56679 5.34128 8.61056 5.4934 8.69433L7.8022 9.9674C7.84604 9.99188 7.89556 10.0029 7.94512 9.99933C7.99467 9.99571 8.04225 9.97756 8.08244 9.94695C8.12263 9.91634 8.15381 9.87449 8.17241 9.82619C8.19102 9.77789 8.1963 9.72508 8.18766 9.67378L7.7467 6.97874C7.71773 6.80093 7.7304 6.61841 7.78362 6.44687C7.83683 6.27534 7.92899 6.11994 8.05217 5.99405L9.92 4.08655C9.95541 4.05034 9.98045 4.00447 9.99229 3.95412C10.0041 3.90377 10.0023 3.85095 9.98701 3.80163C9.97171 3.75232 9.94357 3.70847 9.90575 3.67506C9.86793 3.64164 9.82196 3.61999 9.77302 3.61256L7.19025 3.21617C7.02033 3.19001 6.859 3.121 6.72011 3.01506C6.58121 2.90912 6.4689 2.76942 6.39282 2.60795L5.23793 0.154621C5.21602 0.108197 5.18217 0.0691199 5.14021 0.0417987C5.09825 0.0144775 5.04984 0 5.00045 0C4.95106 0 4.90265 0.0144775 4.86069 0.0417987Z"
                stroke="#CCFF00"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
            <defs>
              <clipPath id="header-star-clip">
                <rect width="10" height="10" fill="white" />
              </clipPath>
            </defs>
          </svg>
          <span className="font-mono text-sm font-bold text-zinc-100">
            {name}
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:gap-x-4"
        >
          {[
            { label: "Work", href: "/#work" },
            { label: "About", href: "/about" },
            { label: "Experience", href: "/experience" },
            { label: "Contact", href: "/contact" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-mono text-[11px] font-normal text-neutral-400 no-underline transition hover:text-zinc-100 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-300 sm:text-xs"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
