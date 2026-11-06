# Profile avatars

Avatars use the existing Better Auth `user.image` URL. Google-provided URLs are displayed directly. Custom uploads go through the API, which stores a small WebP in the existing R2 bucket. No schema migration is needed.

## Backend configuration

Set these variables in the backend environment; keep credentials out of frontend configuration:

```dotenv
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-existing-bucket
R2_PUBLIC_URL=https://images.example.com
```

`R2_PUBLIC_URL` is the public root of that bucket, without a product-folder suffix. The frontend does not need additional R2 variables. Uploads pass through the backend, so browser-to-R2 upload CORS configuration is not needed.

The backend's `NODE_ENV` selects the object prefix:

| Runtime | Object key |
| --- | --- |
| `production` | `profilephotos/production/<hash>.webp` |
| Any other value | `profilephotos/staging/<hash>.webp` |

The filename is a SHA-256 hash of the resized image. Existing product objects are unchanged. Replacement images get a different URL when their normalized contents change. Removing a profile photo clears the account's image URL; it does not delete stored R2 objects.

## Upload and save

1. Preferences previews a selected JPEG, PNG, or WebP before saving.
2. `POST /api/users/me/avatar` accepts the raw file body with its image content type, session cookies, and `x-clearup-client: 1`.
3. The backend accepts at most 5 MiB, rejects corrupt/unsupported/animated images and images over 16,777,216 pixels, then resizes to a 256px square WebP and uploads it to R2.
4. The response contains `{ imageUrl }`. The frontend saves that URL through `authClient.updateUser`, then refreshes the session so the account menu uses the same photo.

The existing avatar remains selected when uploading or saving fails. Missing or broken image URLs show the shared fallback. Changing the display name has its own save action and inline feedback.

## Live verification

The user configured the real R2 variables and confirmed that live avatar uploads work. The avatar and Preferences cleanup pass is complete for this iteration.

For future changes, use a staging account to recheck upload, reload persistence, replacement, removal, and Google-image display. Verify that a failed upload preserves the existing photo and that invalid or oversized files show inline feedback. Do not test account deletion as part of avatar verification.

## Implementation checks

Backend build and frontend lint/build passed. Offline image-processing checks used a stubbed S3 client and covered output dimensions/format, stable hashing, environment prefixes, configuration errors, unsupported/corrupt/animated images, pixel limits, and the upload body limit. Chrome checks at desktop and phone widths used intercepted upload/account mutations to verify preview/cancel, save/remove, validation errors, failure recovery, display-name saving, and header avatar updates. Agent checks did not perform real R2 uploads or account updates; live upload verification was subsequently confirmed by the user.
