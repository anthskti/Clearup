# Product skin-type enrichment

The product initialization CSV is the source of truth for catalog fields. Every successful row must include `skinTypeSource` as `inferred` or `manual`; missing or invalid values are rejected. Reimporting a product replaces its catalog fields, including `skinType` and `skinTypeSource`, regardless of the values currently stored in the database. Blank optional fields clear the stored value.

`skinTypeSource` is operational provenance and is not displayed in the shopper UI. Admin edits that change `skinType` mark the database value `manual`; copy that edit into the master CSV to keep it on the next import. Merchant offer prices and stock remain managed by their separate import flows.

Public-facing product information should explain that skin types are inferred from product ingredients and characteristics, and may be manually adjusted.
