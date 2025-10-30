import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toISODate } from "@/utils/calendarUtils";

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const res = await fetch("/api/appointments");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/appointments, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects-calendar"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/projects, the response was [${res.status}] ${res.statusText}`,
        );
      }
      const json = await res.json();
      // show only scheduled/in_progress
      const projects = (json.projects || []).filter((p) =>
        ["scheduled", "in_progress"].includes(p.status),
      );
      return { projects };
    },
  });
}

export function useTeamMembers(enabled = true) {
  return useQuery({
    queryKey: ["team-members"],
    enabled,
    queryFn: async () => {
      const res = await fetch("/api/team-members");
      if (!res.ok) {
        throw new Error(
          `When fetching /api/team-members, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });
}

export function useAvailabilityWindow(apptData, projData) {
  return useMemo(() => {
    const apptDates = (apptData?.appointments || []).map((a) => a.slot_date);
    const projDates = (projData?.projects || [])
      .map((p) => p.start_date)
      .filter(Boolean);
    const allDates = [...apptDates, ...projDates].filter(Boolean);
    if (allDates.length === 0) {
      const today = toISODate(new Date());
      const in30 = toISODate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      return { startDateISO: today, endDateISO: in30 };
    }
    const min = allDates.reduce((m, d) => (d < m ? d : m), allDates[0]);
    const max = allDates.reduce((m, d) => (d > m ? d : m), allDates[0]);
    return { startDateISO: min, endDateISO: max };
  }, [apptData, projData]);
}

export function useTeamAvailability(startDateISO, endDateISO, enabled = true) {
  return useQuery({
    queryKey: ["team-availability", startDateISO, endDateISO],
    enabled: !!startDateISO && !!endDateISO && enabled,
    queryFn: async () => {
      const url = `/api/team-availability?start_date=${startDateISO}&end_date=${endDateISO}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(
          `When fetching ${url}, the response was [${res.status}] ${res.statusText}`,
        );
      }
      return res.json();
    },
  });
}

export function useAvailabilityByDate(availData) {
  return useMemo(() => {
    const map = new Map();
    const items = availData?.availability || [];
    for (const a of items) {
      const key = a.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return map;
  }, [availData]);
}

export function useRescheduleProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, start_date, end_date }) => {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, start_date, end_date }),
      });
      if (!res.ok)
        throw new Error(`Failed to update project dates (${res.status})`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects-calendar"] });
    },
  });
}

export function useCreateAvailability(startDateISO, endDateISO) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/team-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to create availability (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["team-availability", startDateISO, endDateISO],
      });
    },
  });
}

export function useUpdateAvailability(startDateISO, endDateISO) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/team-availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to update availability (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["team-availability", startDateISO, endDateISO],
      });
    },
  });
}

export function useDeleteAvailability(startDateISO, endDateISO) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/team-availability?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error(`Failed to delete availability (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["team-availability", startDateISO, endDateISO],
      });
    },
  });
}
