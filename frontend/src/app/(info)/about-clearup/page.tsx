import type { Metadata } from "next";
import Link from "next/link";
import { AboutHero } from "@/components/info/AboutHero";
import { InfoArticle } from "@/components/info/InfoArticle";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/constants/mail";

export const metadata: Metadata = {
  title: "About Clearup",
  description: "The story behind Clearup, a simpler way to build and share skincare routines.",
};

// Add your video URL and replace the temporary skincare still when ready.
const ABOUT_VIDEO_SRC: string = "";
const ABOUT_POSTER_SRC = "/assets/home.webp";

export default function AboutClearupPage() {
  return (
    <InfoArticle
      currentPage="/about-clearup"
      title="About Clearup"
      description="A place to make sense of skincare, build a routine, and learn from one another."
      hero={<AboutHero videoSrc={ABOUT_VIDEO_SRC} poster={ABOUT_POSTER_SRC} />}
    >
      <section id="clearup-story">
        <h2>Why I built Clearup</h2>
        <p>
          When I was a teenager, my acne was terrible, so
          I wanted to get into skincare to take care of my skin, but the endless amount of
          products become overwhelming. I didn&apos;t know what my skin type was, I
          didn&apos;t have much to spend, and I didn&apos;t know how to use half of the
          products I&apos;ve gotten from my sister. So, I wanted to make a website that can help
          anybody learn how to take care of their skin via sharing their
          routines with others to learn about skincare.
        </p>
        <p>
          PCPartPicker was an inspiration: choosing parts, comparing prices, and
          sharing a build all in one place. Clearup brings that approach to
          organizing skincare, while recognizing that everyone&apos;s skin is different.
        </p>
      </section>
      <section>
        <h2>Clarity for your routine</h2>
        <p>
          Clearup helps you browse products, compare listed merchant prices, and
          arrange your morning and evening steps. You can publish a routine with
          notes about how you use it, or explore community routines for ideas.
        </p>
        <p>
          Whether you use three products or ten, the goal is the same: make your
          routine easier to understand and share.
        </p>
        <p>
          <Link href="/builder">Build a routine</Link> or{" "}
          <Link href="/routines">explore community routines</Link>.
        </p>
      </section>
      <section>
        <h2>How product information is prepared</h2>
        <p>
          Product details, images, and listed prices come from third-party
          retailers. A locally run language model helps infer some product
          attributes, including skin-type labels, from ingredients and product
          characteristics. These labels may also be manually adjusted. This was 
          for consistency and products data across platforms state different things.
        </p>
        <p>
          This automated inferences can be wrong and a skin-type label does not
          guarantee that a product will suit you. Check the manufacturer&apos;s
          current ingredient list and the retailer&apos;s price before buying.
          Clearup and community routines provide information, not medical advice.
        </p>
      </section>
      <section>
        <h2>Built independently, growing together</h2>
        <p>
          I&apos;m building Clearup as a solo developer, with room to keep learning
          and improving it alongside the community. If something is confusing or
          a product detail looks wrong, I&apos;d like to hear about it.
        </p>
        <p>
          Get in touch at <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </InfoArticle>
  );
}
