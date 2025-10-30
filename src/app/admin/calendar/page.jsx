"use client";

import { useState } from "react";
import {
  useAppointments,
  useProjects,
  useTeamMembers,
  useAvailabilityWindow,
  useTeamAvailability,
  useAvailabilityByDate,
  useRescheduleProject,
  useCreateAvailability,
  useUpdateAvailability,
  useDeleteAvailability,
} from "@/hooks/useCalendarData";
import { CalendarHeader } from "@/components/admin/calendar/CalendarHeader";
import { AppointmentsList } from "@/components/admin/calendar/AppointmentsList";
import { ProjectsList } from "@/components/admin/calendar/ProjectsList";

export default function CalendarPage() {
  const [view, setView] = useState("appointments");
  const [showAvailability, setShowAvailability] = useState(true);

  const {
    data: apptData,
    isLoading: apptLoading,
    error: apptError,
    refetch: refetchAppts,
  } = useAppointments();

  const {
    data: projData,
    isLoading: projLoading,
    error: projError,
    refetch: refetchProjects,
  } = useProjects();

  const { startDateISO, endDateISO } = useAvailabilityWindow(
    apptData,
    projData,
  );

  const {
    data: availData,
    isLoading: availLoading,
    error: availError,
    refetch: refetchAvail,
  } = useTeamAvailability(startDateISO, endDateISO, showAvailability);

  const availabilityByDate = useAvailabilityByDate(availData);

  const {
    data: teamMembersData,
    isLoading: teamMembersLoading,
    error: teamMembersError,
  } = useTeamMembers(showAvailability);

  const rescheduleMutation = useRescheduleProject();
  const createAvailability = useCreateAvailability(startDateISO, endDateISO);
  const updateAvailability = useUpdateAvailability(startDateISO, endDateISO);
  const deleteAvailability = useDeleteAvailability(startDateISO, endDateISO);

  const appointments = apptData?.appointments || [];
  const projects = projData?.projects || [];

  const handleRefresh = () => {
    if (view === "appointments") {
      refetchAppts();
    } else {
      refetchProjects();
    }
    if (showAvailability) {
      refetchAvail();
    }
  };

  const handleReschedule = async (project) => {
    const start = prompt(
      "New start date (YYYY-MM-DD)",
      project.start_date || "",
    );
    if (start === null) return;
    const end = prompt("New end date (YYYY-MM-DD)", project.end_date || "");
    if (end === null) return;
    try {
      await rescheduleMutation.mutateAsync({
        id: project.id,
        start_date: start || null,
        end_date: end || null,
      });
    } catch (e) {
      console.error(e);
      alert("Failed to update dates");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <CalendarHeader
          view={view}
          onViewChange={setView}
          showAvailability={showAvailability}
          onToggleAvailability={() => setShowAvailability((s) => !s)}
          onRefresh={handleRefresh}
        />

        {view === "appointments" ? (
          <AppointmentsList
            appointments={appointments}
            isLoading={apptLoading}
            error={apptError}
            availabilityByDate={availabilityByDate}
            availLoading={availLoading}
            availError={availError}
            teamMembersData={teamMembersData}
            teamMembersLoading={teamMembersLoading}
            teamMembersError={teamMembersError}
            startDateISO={startDateISO}
            endDateISO={endDateISO}
            createAvailability={createAvailability}
            updateAvailability={updateAvailability}
            deleteAvailability={deleteAvailability}
          />
        ) : (
          <ProjectsList
            projects={projects}
            isLoading={projLoading}
            error={projError}
            onReschedule={handleReschedule}
            availabilityByDate={availabilityByDate}
            availLoading={availLoading}
            availError={availError}
            teamMembersData={teamMembersData}
            teamMembersLoading={teamMembersLoading}
            teamMembersError={teamMembersError}
            startDateISO={startDateISO}
            endDateISO={endDateISO}
            createAvailability={createAvailability}
            updateAvailability={updateAvailability}
            deleteAvailability={deleteAvailability}
          />
        )}
      </div>
    </div>
  );
}
