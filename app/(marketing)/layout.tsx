import { SiteFooter } from "@/components/site/site-footer";

/**
 * Public marketing shell. The header is rendered per page rather than here, so
 * a page with an ink hero can float a transparent nav over it while body
 * pages get the sticky white bar.
 */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <a
        href="#main"
        className="ring-brand sr-only rounded-md bg-ink px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100"
      >
        Skip to content
      </a>
      {children}
      <SiteFooter />
    </div>
  );
}
