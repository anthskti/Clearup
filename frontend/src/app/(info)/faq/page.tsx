import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { InfoArticle } from "@/components/info/InfoArticle";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/constants/mail";

export const metadata: Metadata = {
  title: "Frequently asked questions | Clearup",
  description: "Help with Clearup routines, accounts, profile photos, and product information.",
};

const sections = [
  { id: "using-clearup", title: "Using Clearup" },
  { id: "accounts-and-photos", title: "Accounts and photos" },
  { id: "product-information", title: "Product information" },
];

function Question({ question, children }: { question: string; children: ReactNode }) {
  return (
    <details className="group border-b border-zinc-200">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-zinc-900 outline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
        <span>{question}</span>
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-zinc-500 group-open:rotate-180" />
      </summary>
      <div className="space-y-3 pb-5 pr-4">{children}</div>
    </details>
  );
}

export default function FAQPage() {
  return (
    <InfoArticle
      currentPage="/faq"
      title="Frequently asked questions"
      description="A little help with routines, your account, and the information you see on Clearup."
      sections={sections}
    >
      <section id="using-clearup">
        <h2>Using Clearup</h2>
        <div className="border-t border-zinc-200">
          <Question question="What is Clearup?">
            <p>
              Clearup is a skincare product catalog and routine builder. Browse
              products, compare listed merchant prices, organize morning and
              evening steps, and explore routines shared by the community.
            </p>
          </Question>
          <Question question="Do I need an account?">
            <p>
              You can browse products, explore public routines, and use the
              builder without an account. Sign in to publish routines, find the
              routines you&apos;ve created, and edit their descriptions and notes.
            </p>
          </Question>
          <Question question="Can a community routine tell me what will work for my skin?">
            <p>
              Community routines describe other people&apos;s experiences. They can
              offer ideas, but they do not guarantee the same results for you or
              replace advice from a qualified healthcare professional.
            </p>
          </Question>
        </div>
      </section>
      <section id="accounts-and-photos">
        <h2>Accounts and photos</h2>
        <div className="border-t border-zinc-200">
          <Question question="What emails will Clearup send me?">
            <p>
              Clearup sends account emails such as email verification and
              password-reset links. We do not send marketing newsletters or
              promotional email blasts.
            </p>
          </Question>
          <Question question="Will you sell my email address?">
            <p>
              We do not sell or rent your email address to marketers or data
              brokers. Service providers help us operate Clearup, including
              account sign-in, hosting, and email delivery. Our{" "}
              <Link href="/privacy">Privacy policy</Link> explains how information
              is used and shared.
            </p>
          </Question>
          <Question question="Where are profile photos stored?">
            <p>
              Custom profile photos are resized and stored on Cloudflare R2,
              then served through a public image URL. If you sign in with Google,
              Clearup can display the photo URL supplied by Google instead.
            </p>
            <p>
              Replacing or removing a photo changes the image linked to your
              account. Previously uploaded files are currently retained in
              storage. See <Link href="/privacy#profile-photos">Profile photos</Link>{" "}
              for details.
            </p>
          </Question>
          <Question question="How do I delete my account?">
            <p>
              Open <Link href="/profile/preferences">Preferences</Link>, choose
              Delete account, and review the confirmation. Accounts with a
              password must enter it. Accounts that only use Google do not have
              a password field. You may be asked to sign in again first.
            </p>
            <p>
              Deletion is permanent and removes your access to the account and
              its routines. Uploaded photo files are currently retained in
              storage; deleting an account does not automatically erase those files.
            </p>
          </Question>
          <Question question="I received an email I didn't request. What should I do?">
            <p>
              Someone may have entered your email address by mistake. If you did
              not request the verification or password-reset link, you can ignore
              it. The link will expire. Contact{" "}
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> if you have concerns.
            </p>
          </Question>
        </div>
      </section>
      <section id="product-information">
        <h2>Product information</h2>
        <div className="border-t border-zinc-200">
          <Question question="Where does product information come from?">
            <p>
              Product details, images, and prices come from third-party
              retailers. Clearup organizes this information to help you compare
              products and plan a routine. The retailer handles your purchase.
            </p>
          </Question>
          <Question question="How are skin-type labels determined?">
            <p>
              A locally run language model helps infer skin-type labels from
              product ingredients and characteristics. Labels may also be
              manually adjusted. They are a guide, can be incorrect, and do not
              guarantee that a product will suit your skin.
            </p>
          </Question>
          <Question question="Are prices and ingredients always up to date?">
            <p>
              Prices, availability, and formulations can change. Check the
              retailer&apos;s current price and the manufacturer&apos;s ingredient
              list before buying. If you spot an error, email{" "}
              <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a> with the product link.
            </p>
          </Question>
        </div>
      </section>
    </InfoArticle>
  );
}
