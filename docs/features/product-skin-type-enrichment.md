# Product skin-type enrichment

The datascraper product import stores `skinTypeSource` (`inferred` or `manual`) internally. A missing or blank source defaults to `manual`; invalid nonblank source values are rejected. Inferred imports replace prior inferred values, including clearing them when the inference is empty. An inferred import never replaces skin types already marked manual.

The source is operational provenance only and is not displayed in the shopper UI. Admin product edits that include `skinType` mark the source `manual`, so later inferred imports preserve the manual correction.

Public-facing product information should explain that skin types are inferred from product ingredients and characteristics, and may be manually adjusted.
