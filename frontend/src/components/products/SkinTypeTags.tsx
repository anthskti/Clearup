import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SkinTypeTagsProps {
  skinTypes: string[];
  variant?: "desktop" | "mobile";
}

const tagClassName =
  "rounded-md border border-teal-100 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700";

export const SkinTypeTags = ({ skinTypes, variant = "desktop" }: SkinTypeTagsProps) => {
  if (!skinTypes || skinTypes.length === 0)
    return <span className="text-zinc-400 text-sm">-</span>;

  if (variant === "mobile") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {skinTypes.map((skinType) => (
          <span key={skinType} className={tagClassName}>
            {skinType}
          </span>
        ))}
      </div>
    );
  }

  const firstType = skinTypes[0];
  const remainingCount = skinTypes.length - 1;

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`${tagClassName} whitespace-nowrap`}>
        {firstType}
      </span>

      {remainingCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label={`${remainingCount} more skin types: ${skinTypes.slice(1).join(", ")}`}
                className="rounded-md border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
              >
                +{remainingCount}
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="border border-[#0e4a84] bg-[#0a345c] text-white shadow-md"
              arrowClassName="!bg-[#0a345c] !fill-[#0a345c]"
            >
              <p className="text-xs">{skinTypes.slice(1).join(", ")}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
