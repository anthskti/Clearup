import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero_Images = {
  desktop: "/assets/clearupv2_desktopv2.webp",
  mobile: "/assets/clearupv2_mobile2.webp",
};

const HeroSection = () => {
  return (
    <section className="relative mt-18 grid bg-[#f9fcfb]">
      {/* Intrinsic height so the full asset (top art + bottom alpha fade) stays in frame. */}
      <div aria-hidden="true" className="relative col-start-1 row-start-1 w-full self-start">
        <Image
          src={Hero_Images.desktop}
          alt=""
          width={2880}
          height={1320}
          priority
          className="hidden h-auto w-full lg:block"
          draggable={false}
          sizes="100vw"
          quality={90}
        />
        <Image
          src={Hero_Images.mobile}
          alt=""
          width={1760}
          height={2000}
          priority
          className="h-auto w-full lg:hidden"
          draggable={false}
          sizes="100vw"
          quality={90}
        />
      </div>

      {/* Share the image's grid cell, but let larger text expand the section instead of overflowing it. */}
      <div className="pointer-events-none relative col-start-1 row-start-1 self-start pt-[56vw] pb-12 md:pb-16 lg:self-center lg:py-12">
        <div className="container mx-auto flex flex-col items-center px-6 md:px-8 lg:items-start lg:px-6">
          <div className="pointer-events-auto flex w-full max-w-md flex-col items-center gap-4 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 motion-reduce:animate-none lg:max-w-[48%] lg:items-start lg:gap-5 lg:text-left">
            <h1 className="font-edu text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-stone-900 md:text-[2rem] lg:text-[2.75rem]">
              Pick Products
              <br />
              <span className="text-[#0E4B84]">Build Your Routine</span>
              <br />
              Improve Your Skin!
            </h1>

            <p className="hidden max-w-[25rem] text-base leading-6 text-stone-600 md:block">
              Your skincare organizer to help you improve your skin, save money,
              and age beautifully.
            </p>

            <div className="flex w-full flex-wrap justify-center gap-2 md:w-auto md:gap-4 lg:justify-start">
              <Button
                asChild
                variant="default"
                className="group h-auto! min-h-11 min-w-0 max-w-full flex-auto gap-2 whitespace-normal! px-3! text-sm hover:shadow-lg hover:shadow-[#0E4B84]/20 md:flex-none"
              >
                <Link href="/builder">
                  Start Your Build
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transform-none"
                  />
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="h-auto! min-h-11 min-w-0 max-w-full flex-auto whitespace-normal! px-3! text-sm hover:shadow-lg hover:shadow-[#0E4B84]/20 md:flex-none"
              >
                <Link href="/routines">View Routines</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
