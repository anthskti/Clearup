import type { Metadata } from "next";
import Link from "next/link";
import { InfoArticle } from "@/components/info/InfoArticle";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/constants/mail";

export const metadata: Metadata = {
  title: "Privacy policy | Clearup",
  description: "How Clearup handles account information, public routines, and profile photos.",
};

const sections = [
  { id: "information-we-collect", title: "Information we collect" },
  { id: "how-we-use-information", title: "How we use information" },
  { id: "public-content", title: "Public routines" },
  { id: "profile-photos", title: "Profile photos" },
  { id: "service-providers", title: "Service providers" },
  { id: "retention-and-security", title: "Retention and security" },
  { id: "your-account-and-choices", title: "Your account and choices" },
];

export default function PrivacyPage() {
  return (
    <InfoArticle
      currentPage="/privacy"
      title="Privacy policy"
      description="What information Clearup uses, what you share publicly, and the choices you have."
      updated={{ date: "2026-11-06", label: "November 6, 2026" }}
      sections={sections}
    >
      <section id="information-we-collect">
        <h2>Information we collect</h2>
        <p>
          We collect information you provide when you create an account, use
          Clearup, or contact us. This includes:
        </p>
        <ul>
          <li>
            <strong>Account information:</strong> Your display name, email
            address, and information needed to authenticate your account. If you
            sign in with Google, we receive account information such as your
            name, email address, and profile photo URL.
          </li>
          <li>
            <strong>Content you create:</strong> Routine titles, descriptions,
            product selections, notes, and any profile photo you upload.
          </li>
          <li>
            <strong>Technical and usage information:</strong> Information about
            visits and performance, such as pages viewed, browser and device
            characteristics, and loading times. Infrastructure providers may
            also process request information such as IP addresses to deliver
            and secure the service.
          </li>
        </ul>
      </section>
      <section id="how-we-use-information">
        <h2>How we use information</h2>
        <p>We use this information to:</p>
        <ul>
          <li>Create your account, sign you in, and keep your session secure.</li>
          <li>Let you build, publish, and manage your skincare routines.</li>
          <li>Display your chosen name and profile photo within Clearup.</li>
          <li>Send account emails, including verification and password-reset links.</li>
          <li>Respond to support requests and improve the service&apos;s usability and performance.</li>
        </ul>
        <p>
          Clearup uses cookies required for account sessions. We do not send
          marketing newsletters or sell or rent your email address to marketers
          or data brokers.
        </p>
      </section>
      <section id="public-content">
        <h2>Public routines</h2>
        <p>
          Routines you publish are visible to other visitors. This includes
          their titles, descriptions, selected products, notes, and your author
          display name. Do not include information in a public routine that you
          do not want others to see.
        </p>
      </section>
      <section id="profile-photos">
        <h2>Profile photos</h2>
        <p>
          Custom profile photos are processed into a smaller image and stored on
          Cloudflare R2. These images are served through public URLs and can be
          accessed by anyone with the image URL. Product images are also hosted
          on Cloudflare R2.
        </p>
        <p>
          If you sign in with Google, Clearup can display your Google-provided
          photo URL directly instead of uploading a copy to R2. Loading that
          image requires your browser to request it from the image provider.
        </p>
        <p>
          Replacing or removing your photo updates the URL associated with your
          account. Previously uploaded files are currently retained in R2;
          removing a photo or deleting your account does not automatically delete
          those stored files. Contact us if you need help with a stored photo.
        </p>
      </section>
      <section id="service-providers">
        <h2>Service providers and sharing</h2>
        <p>
          We use service providers to operate Clearup, including hosting,
          database management, authentication, email delivery, and image storage.
          They process information needed to provide those services. We may also
          share information with your consent, to comply with legal obligations,
          or to protect the service and its users.
        </p>
        <ul>
          <li>
            <strong>Cloudflare R2</strong> stores and serves product images and
            uploaded profile photos, as described above.
          </li>
          <li>
            <strong>Google</strong> provides optional account sign-in and may
            host the profile photo associated with your Google account.
          </li>
          <li>
            <strong>Vercel Web Analytics and Speed Insights</strong> help us
            understand page usage, browser and device characteristics, and site
            performance. Read the provider&apos;s{" "}
            <a href="https://vercel.com/docs/analytics/privacy-policy">Web Analytics privacy information</a>{" "}
            and{" "}
            <a href="https://vercel.com/docs/speed-insights/privacy-policy">Speed Insights privacy information</a>.
          </li>
        </ul>
      </section>
      <section id="retention-and-security">
        <h2>Retention and security</h2>
        <p>
          We retain personal information for as long as needed to provide the
          service and for the purposes described in this policy, unless a longer
          period is required or permitted by law. The current retention of
          uploaded images is explained in the Profile photos section.
        </p>
        <p>
          We use technical and organizational safeguards to protect information.
          However, no internet transmission or storage system can be guaranteed
          to be completely secure.
        </p>
      </section>
      <section id="your-account-and-choices">
        <h2>Your account and choices</h2>
        <p>
          You can change your display name and profile photo in{" "}
          <Link href="/profile/preferences">Preferences</Link>. You can also
          permanently delete your account there. The confirmation explains the
          loss of access to your account and routines; uploaded image retention
          is described above.
        </p>
        <p>
          If you have a privacy question or a request about your information,
          contact <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </InfoArticle>
  );
}
