import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import SchedulerSection from "@/components/SchedulerSection";

const mutation = vi.hoisted(() => ({ isPending: false, mutate: vi.fn() }));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => mutation,
  useQuery: () => ({
    data: {
      slots: [
        {
          id: 7,
          slot_date: "2030-01-02",
          start_time: "10:00:00",
          end_time: "11:00:00",
          remaining: 2,
        },
      ],
    },
    isLoading: false,
  }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

describe("SchedulerSection accessibility", () => {
  beforeEach(() => { cleanup(); mutation.isPending = false; mutation.mutate.mockClear(); });

  it("disables a selected booking and announces pending submission", () => {
    mutation.isPending = true;
    render(<SchedulerSection />);
    fireEvent.click(screen.getByRole("button", { name: /10:00 - 11:00.*2 left/i }));
    const submit = screen.getByRole("button", { name: "Booking..." });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(mutation.mutate).not.toHaveBeenCalled();
  });
  it("uses the same empty scheduler shell during server rendering", () => {
    const markup = renderToString(<SchedulerSection />);

    expect(markup).toContain("available days");
    expect(markup).not.toMatch(/>(Mon|Tue|Wed|Thu|Fri)</);
  });

  it("connects every booking input to a label and exposes the selected time", () => {
    render(<SchedulerSection />);

    expect(screen.getByLabelText("Full name")).toHaveAttribute("required");
    expect(screen.getByLabelText("Email (or Phone)")).toHaveAttribute(
      "name",
      "email",
    );
    expect(screen.getByLabelText("Phone (or Email)")).toHaveAttribute(
      "name",
      "tel",
    );
    expect(screen.getByLabelText("Meeting address")).toHaveAttribute(
      "required",
    );
    expect(screen.getByLabelText("Notes (optional)")).toHaveAttribute(
      "name",
      "notes",
    );

    const time = screen.getByRole("button", { name: /10:00 - 11:00.*2 left/i });
    expect(time).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(time);

    expect(time).toHaveAttribute("aria-pressed", "true");
  });
});
