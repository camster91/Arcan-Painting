import { useMemo } from "react";

export function useFollowUpFilters(followUps, searchTerm) {
  const filteredFollowUps = useMemo(() => {
    return followUps.filter(
      (followUp) =>
        followUp.lead_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.lead_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        followUp.follow_up_type
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        followUp.notes?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [followUps, searchTerm]);

  const overdueFollowUps = useMemo(() => {
    return filteredFollowUps.filter((followUp) => {
      const followUpDate = new Date(followUp.follow_up_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return followUpDate < today && followUp.status === "pending";
    });
  }, [filteredFollowUps]);

  const todayFollowUps = useMemo(() => {
    return filteredFollowUps.filter((followUp) => {
      const followUpDate = new Date(followUp.follow_up_date);
      const today = new Date();
      return (
        followUpDate.toDateString() === today.toDateString() &&
        followUp.status === "pending"
      );
    });
  }, [filteredFollowUps]);

  const upcomingFollowUps = useMemo(() => {
    return filteredFollowUps.filter((followUp) => {
      const followUpDate = new Date(followUp.follow_up_date);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return (
        followUpDate > today &&
        followUpDate <= nextWeek &&
        followUp.status === "pending"
      );
    });
  }, [filteredFollowUps]);

  return {
    filteredFollowUps,
    overdueFollowUps,
    todayFollowUps,
    upcomingFollowUps,
  };
}
