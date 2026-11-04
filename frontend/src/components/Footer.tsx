"use client";

import Link from "next/link";
import Image from "next/image";
import React from "react";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/constants/mail";

const footerLinkClass =
  "inline-flex min-h-11 items-center hover:underline focus-visible:outline-2 focus-visible:outline-white";

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function Footer() {
  return (
    <footer className="overflow-hidden bg-brand py-10 text-white md:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 border-b border-white/20 pb-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <div className="flex justify-start">
              <Image
                src="/assets/clearuplogo-white.png"
                alt="Clearup"
                width={2048}
                height={663}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="h-auto w-[190px]"
              />
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-blue-100">
              Questions? Email{" "}
              <a
                href={SUPPORT_MAILTO}
                className="inline-flex min-h-10 items-center text-white underline underline-offset-4 hover:text-blue-100 focus-visible:outline-2 focus-visible:outline-white"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 md:col-span-8 md:gap-8">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-blue-100">
                Company
              </h4>
              <ul className="text-sm">
                <li>
                  <Link href="/about-clearup" className={footerLinkClass}>
                    About Clearup
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-blue-100">
                Explore
              </h4>
              <ul className="text-sm">
                <li>
                  <Link href="/products" className={footerLinkClass}>
                    View products
                  </Link>
                </li>
                <li>
                  <Link href="/routines" className={footerLinkClass}>
                    View routines
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className={footerLinkClass}>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-blue-100">
                Community
              </h4>
              <ul className="text-sm">
                <li>
                  <Link
                    href="https://www.instagram.com/clearup.skin/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${footerLinkClass} gap-2`}
                  >
                    <InstagramIcon className="h-4 w-4 shrink-0" />
                    Instagram
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 pt-5 text-sm text-blue-100 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; Clearup {new Date().getFullYear()}
          </p>

          <div className="flex flex-wrap gap-x-6 text-white">
            <Link href="/privacy" className={footerLinkClass}>
              Privacy policy
            </Link>
            <Link href="/tos" className={footerLinkClass}>
              Terms of service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
