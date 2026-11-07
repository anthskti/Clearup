"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductCategory } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddToRoutineButtonProps {
  product: Product;
  category: string;
  className?: string;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  compact?: boolean;
}

function AddToRoutineButton({
  product,
  category,
  className = "",
  variant = "secondary",
  size = "default",
  compact = false,
}: AddToRoutineButtonProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorId = useId();

  const handleAddToRoutine = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    setError(null);

    // Store product in localStorage for builder page to pick up
    const addToRoutineData = {
      product,
      category: category as ProductCategory,
      timestamp: Date.now(),
    };

    // Store in localStorage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "pending-routine-add",
          JSON.stringify(addToRoutineData)
        );

        // Dispatch a custom event in case builder page is already open
        window.dispatchEvent(
          new CustomEvent("addToRoutine", {
            detail: addToRoutineData,
          })
        );

        // Redirect to builder page
        router.push("/builder");
      } catch (error) {
        console.error("Failed to add product to routine:", error);
        setError("Couldn't add this product. Allow site storage, then try again.");
        setIsAdding(false);
      }
    }
  };

  return (
    <>
    <Button
      onClick={handleAddToRoutine}
      disabled={isAdding}
      aria-busy={isAdding}
      aria-describedby={error ? errorId : undefined}
      variant={variant}
      size={size}
      className={className}
    >
      {isAdding ? "Adding…" : compact ? (
          "Add"
        ) : (
          <>
            <Plus size={18} />
            Add to routine
          </>
        )
      }
    </Button>
    {error && <span id={errorId} role="alert" className="mt-1 block max-w-56 whitespace-normal text-xs text-red-700">{error}</span>}
    </>
  );
}

export default AddToRoutineButton;
