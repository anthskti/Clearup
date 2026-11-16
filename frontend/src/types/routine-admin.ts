import type { SkinType } from "@/types/product";

export type AdminDashboardStats = {
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

export type FeaturedRoutineCandidate = {
  routineId: number;
  name: string;
  authorLabel: string;
  skinTypeTags: SkinType[];
  previewImageUrls: string[];
  estimatedTotalPrice: number;
};
