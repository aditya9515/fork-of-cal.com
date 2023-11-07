"use client";

import type { SSRConfig } from "next-i18next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
// import I18nLanguageHandler from "@components/I18nLanguageHandler";
import { usePathname } from "next/navigation";
import Script from "next/script";
import type { ReactNode } from "react";

import "@calcom/embed-core/src/embed-iframe";
import LicenseRequired from "@calcom/features/ee/common/components/LicenseRequired";
import { trpc } from "@calcom/trpc/react";

import type { AppProps } from "@lib/app-providers-app-dir";
import AppProviders from "@lib/app-providers-app-dir";

export interface CalPageWrapper {
  (props?: AppProps): JSX.Element;
  PageWrapper?: AppProps["Component"]["PageWrapper"];
}

const interFont = Inter({ subsets: ["latin"], variable: "--font-inter", preload: true, display: "swap" });
const calFont = localFont({
  src: "../fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  preload: true,
  display: "swap",
});

export type PageWrapperProps = Readonly<{
  getLayout: (page: React.ReactElement) => ReactNode;
  children: React.ReactElement;
  requiresLicense: boolean;
  isThemeSupported: boolean;
  isBookingPage: boolean;
  nonce: string | undefined;
  themeBasis: string | null;
  i18n?: SSRConfig;
}>;

function PageWrapper(props: PageWrapperProps) {
  const pathname = usePathname();
  let pageStatus = "200";

  if (pathname === "/404") {
    pageStatus = "404";
  } else if (pathname === "/500") {
    pageStatus = "500";
  }

  // On client side don't let nonce creep into DOM
  // It also avoids hydration warning that says that Client has the nonce value but server has "" because browser removes nonce attributes before DOM is built
  // See https://github.com/kentcdodds/nonce-hydration-issues
  // Set "" only if server had it set otherwise keep it undefined because server has to match with client to avoid hydration error
  const nonce = typeof window !== "undefined" ? (props.nonce ? "" : undefined) : props.nonce;
  const providerProps: PageWrapperProps = {
    ...props,
    nonce,
  };

  const getLayout: (page: React.ReactElement) => ReactNode = props.getLayout ?? ((page) => page);

  return (
    <AppProviders {...providerProps}>
      {/* <I18nLanguageHandler locales={props.router.locales || []} /> */}
      <>
        <Script
          nonce={nonce}
          id="page-status"
          dangerouslySetInnerHTML={{ __html: `window.CalComPageStatus = '${pageStatus}'` }}
        />
        <style jsx global>{`
          :root {
            --font-inter: ${interFont.style.fontFamily};
            --font-cal: ${calFont.style.fontFamily};
          }
        `}</style>

        {getLayout(
          props.requiresLicense ? <LicenseRequired>{props.children}</LicenseRequired> : props.children
        )}
      </>
    </AppProviders>
  );
}

export default trpc.withTRPC(PageWrapper);