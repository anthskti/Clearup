# Product skin-type enrichment

The upcoming datascraper product import will replace legacy scraper-derived skin types with local model inferences based on product name, category, and ingredients. The values will be constrained to ClearUp's existing skin-type options; products without sufficient evidence may have no inferred skin types.

The import will include an internal `skinTypeSource` value (`inferred` or `manual`). It is operational provenance only and will not be displayed in the shopper UI. Admins can continue to correct a product's skin types manually; manual corrections must be marked `manual` so later enrichment runs preserve them. The initial enrichment pass is intended to reprocess all existing products once; subsequent runs will skip products already marked `inferred` or `manual`.

Public-facing product information should explain that skin types are inferred from product ingredients and characteristics, and may be manually adjusted.
