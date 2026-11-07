import type { Metadata } from "next";
import { InfoArticle } from "@/components/info/InfoArticle";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/constants/mail";

export const metadata: Metadata = {
  title: "Terms of service | Clearup",
  description: "Terms for using Clearup, sharing routines, and browsing product information.",
};

const sections = [
  { id: "the-service", title: "1. The Clearup service" },
  { id: "medical-disclaimer", title: "2. Medical disclaimer" },
  { id: "products-and-pricing", title: "3. Products and pricing" },
  { id: "accounts-and-content", title: "4. Accounts and content" },
  { id: "limitation-of-liability", title: "5. Limitation of liability" },
  { id: "changes-to-terms", title: "6. Changes to terms" },
  { id: "contact", title: "7. Contact" },
];

export default function TermsOfServicePage() {
  return (
    <InfoArticle
      currentPage="/tos"
      title="Terms of service"
      description="The terms that apply when you use Clearup."
      updated={{ date: "2026-11-06", label: "November 6, 2026" }}
      sections={sections}
    >
      <p>
        By accessing or using Clearup, you agree to these Terms of Service.
        If you do not agree, please do not use the platform.
      </p>
      <section id="the-service">
        <h2>1. The Clearup service</h2>
        <p>
          Clearup helps users build, organize, and share skincare routines, as
          well as discover product information and marketplace pricing. We
          reserve the right to modify, suspend, or discontinue any part of the
          service at any time without notice.
        </p>
      </section>
      <section id="medical-disclaimer">
        <h2>2. Medical disclaimer</h2>
        <p>
          Information on Clearup, including product descriptions, skin-type
          labels, and community routines, is for informational and educational
          purposes only. Clearup is not a substitute for professional medical
          advice, diagnosis, or treatment.
        </p>
        <p>
          Always seek the advice of a qualified dermatologist or healthcare
          provider with questions about a skin condition or product reaction.
          Never disregard professional advice or delay seeking it because of
          something you have read on Clearup.
        </p>
      </section>
      <section id="products-and-pricing">
        <h2>3. Products, intellectual property, and pricing</h2>
        <p>
          Clearup obtains product information, images, prices, and availability
          from third-party retailers and marketplaces. Purchases take place on
          the retailer&apos;s website, under that retailer&apos;s terms.
        </p>
        <ul>
          <li>
            <strong>Accuracy:</strong> Product details, formulations, prices,
            and availability may change. The retailer&apos;s current price and
            availability apply to your purchase. Check the manufacturer&apos;s
            current ingredient list before buying or using a product.
          </li>
          <li>
            <strong>Inferred attributes:</strong> A locally run language model
            helps infer some product attributes, including skin-type labels,
            from ingredients and product characteristics. These may be manually
            adjusted. Inferences can be incorrect and do not guarantee safety,
            suitability, or results for any individual.
          </li>
          <li>
            <strong>Intellectual property:</strong> Product names, brand logos,
            and marketing images belong to their respective owners. Clearup is
            an independent aggregator and is not affiliated with, endorsed by,
            or sponsored by those brands or retailers.
          </li>
          <li>
            <strong>Affiliate links:</strong> Clearup may participate in affiliate
            programs in the future. If affiliate links are introduced, we will
            identify them and explain that a purchase may earn us a commission.
          </li>
        </ul>
      </section>
      <section id="accounts-and-content">
        <h2>4. Accounts and content</h2>
        <p>
          An account is required to publish and manage your routines. You are
          responsible for safeguarding your sign-in credentials and for activity
          under your account.
        </p>
        <p>
          By publishing routine descriptions, notes, or other content on Clearup,
          you grant us a non-exclusive, royalty-free license to use, display, and
          distribute that content within the service. We reserve the right to
          remove content that violates these Terms or is inappropriate, spam,
          or abusive.
        </p>
      </section>
      <section id="limitation-of-liability">
        <h2>5. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, Clearup shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages, or any loss of profits or revenues, whether incurred directly
          or indirectly, or any loss of data, use, goodwill, or other intangible
          losses, resulting from (a) your access to or use of or inability to
          access or use the service; (b) any conduct or content of any third
          party on the service; or (c) any adverse physical reactions to
          products discovered or tracked through the service.
        </p>
      </section>
      <section id="changes-to-terms">
        <h2>6. Changes to terms</h2>
        <p>
          We may update these Terms from time to time. We will notify you of
          changes by posting the updated Terms on this page. Your continued use
          of the service after those changes constitutes acceptance of the
          updated Terms.
        </p>
      </section>
      <section id="contact">
        <h2>7. Contact</h2>
        <p>
          If you have questions about these Terms, contact{" "}
          <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </InfoArticle>
  );
}
