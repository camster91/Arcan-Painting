import SwipeableProjectCard from "@/components/SwipeableProjectCard";

export default function MobileProjectsList({
  projects,
  onStatusUpdate,
  onViewDetails,
  onViewProgress,
  onViewWorkflows,
}) {
  return (
    <div className="lg:hidden space-y-3">
      {projects.map((project) => (
        <SwipeableProjectCard
          key={project.id}
          project={project}
          onStatusUpdate={onStatusUpdate}
          onViewDetails={() => onViewDetails(project)}
          onViewProgress={() => onViewProgress?.(project)}
          onViewWorkflows={() => onViewWorkflows?.(project)}
        />
      ))}
    </div>
  );
}
