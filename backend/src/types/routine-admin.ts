import type { RoutineAuthor } from "./routine";
import type { SkinType } from "./product";

export type AdminStats = {
  totals: {
    users: number;
    routines: number;
    routineProductLinks: number;
    featuredRoutines: number;
  };
  series: {
    date: string;
    users: number;
    routines: number;
  }[];
  period: {
    startDate: string;
    endDate: string;
    users: number;
    routines: number;
    previousUsers: number;
    previousRoutines: number;
  };
  topAuthors: {
    userId: string;
    name: string;
    email: string;
    count: number;
  }[];
};

export type FeaturedRoutineView = {
  routineId: number;
  name: string;
  description?: string;
  userId: string;
  pinnedBy: string;
  author?: RoutineAuthor;
  skinTypeTags: SkinType[];
  /** First images from up to 4 routine products (URLs only; browser loads from origin CDN). */
  previewImageUrls: string[];
  estimatedTotalPrice: number;
};

export type RoutineDailyCountRow = {
  /** UTC calendar day formatted as YYYY-MM-DD by the repository query. */
  day: string;
  count: string | number;
};

export type TopAuthorCountRow = {
  userId: string;
  count: string | number;
};

export type FeaturedRoutineEntryRow = {
  routineId: number;
  pinnedBy: string;
  createdAt?: string | Date;
};
