import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "../ui/Button";
import MediaGallery from "./MediaGallary";
import AuditTrail from "./AuditTrail";
import AssignVehicleModal from "./AssignVehicleModal";
import { approveAttendance, attendanceEntityToDriverCheckin, getAttendanceById, rejectAttendance } from "../../api/attendance.api";
import { useAuth } from "../../context/AuthContext";

export default function DriverCheckinDetail() {
  // Route param from `/admin/driver-checkins/:id`
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useAuth();

  // Vehicle assignment in this UI is currently front-end-only (demo flow).
  // The modal uses mocked vehicles and calls `onAssign()` with the selection.
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignedVehicle, setAssignedVehicle] = useState<{
    number: string;
    model: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  // We store the raw attendance entity returned by the API layer
  const [attendance, setAttendance] = useState<Awaited<ReturnType<typeof getAttendanceById>> | null>(null);

  useEffect(() => {
    if (!id) return;
    // Load the check-in detail record.
    let mounted = true;
    void (async () => {
      setLoading(true);
      try {
        const data = await getAttendanceById(id);
        if (!mounted) return;
        setAttendance(data);
      } catch (err: unknown) {
        const maybeAny = err as { response?: { data?: unknown } };
        const data = maybeAny.response?.data;
        const msg =
          data && typeof data === "object" && "message" in data
            ? String((data as Record<string, unknown>).message)
            : "Failed to load check-in";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Convert the raw attendance entity into the UI-friendly `DriverCheckin` model.
  const ui = useMemo(() => (attendance ? attendanceEntityToDriverCheckin(attendance) : null), [attendance]);

  const checkinTimeLabel = useMemo(() => {
    const raw = attendance?.checkInTime;
    if (!raw) return "-";
    const dt = new Date(raw);
    if (Number.isNaN(dt.getTime())) return String(raw);
    return dt.toLocaleString();
  }, [attendance?.checkInTime]);

  const auditLogs = useMemo(() => {
    if (!attendance) return [];
    const logs: Array<{ action: string; by: string; at: string }> = [
      { action: "Check-in submitted", by: "Driver", at: checkinTimeLabel },
    ];

    const updatedAt = attendance.updatedAt ? new Date(attendance.updatedAt).toLocaleString() : "-";
    const actor = attendance.approvedBy || "Admin";

    if (attendance.status === "APPROVED") {
      logs.push({ action: "Check-in approved", by: actor, at: updatedAt });
    }
    if (attendance.status === "REJECTED") {
      logs.push({ action: "Check-in rejected", by: actor, at: updatedAt });
    }
    return logs;
  }, [attendance, checkinTimeLabel]);

  // "Can act" means we have the route id and a logged-in admin user.
  const canAct = Boolean(id && userId);

  const onApprove = async () => {
    if (!id || !userId) return;
    try {
      const updated = await approveAttendance({ id, adminId: userId });
      setAttendance(updated);
      toast.success("Check-in approved");
    } catch {
      toast.error("Failed to approve");
    }
  };

  const onReject = async () => {
    if (!id || !userId) return;
    try {
      const updated = await rejectAttendance({ id, adminId: userId });
      setAttendance(updated);
      toast.success("Check-in rejected");
    } catch {
      toast.error("Failed to reject");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Driver Check-in #{id}
        </h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {loading && <div className="text-sm text-black/60">Loading…</div>}

      {/* Summary Card */}
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-black/60">Driver</p>
            <p className="font-medium">{ui?.driverName || "-"}</p>
            <p className="text-xs text-black/50">
              {ui?.driverPhone || "-"}
            </p>
          </div>

          <div>
            <p className="text-black/60">Fleet</p>
            <p className="font-medium">{ui?.fleetName || "-"}</p>
          </div>

          <div>
            <p className="text-black/60">Assigned Vehicle</p>
            {assignedVehicle ? (
              <>
                <p className="font-medium">{assignedVehicle.number}</p>
                <p className="text-xs text-black/50">
                  {assignedVehicle.model}
                </p>
              </>
            ) : (
              <p className="text-xs text-red-600">Not assigned</p>
            )}
          </div>

          <div>
            <p className="text-black/60">Check-in Time</p>
            <p className="font-medium">{checkinTimeLabel}</p>
          </div>
        </div>
      </div>

      {/* Media */}
      <MediaGallery
        title="Selfie"
        images={ui?.selfieUrl ? [ui.selfieUrl] : []}
      />

      {/* Remarks (in current API mapping this comes from `adminRemarks`) */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h3 className="font-medium mb-2">Remarks</h3>
        <p className="text-sm text-black/70">
          {ui?.remarks || "—"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => setAssignOpen(true)}
        >
          Assign Vehicle
        </Button>

        <Button
          className="bg-green-500 hover:bg-green-600"
          disabled={!assignedVehicle || !canAct}
          onClick={() => void onApprove()}
        >
          Approve
        </Button>

        <Button
          variant="secondary"
          className="text-red-600"
          disabled={!canAct}
          onClick={() => void onReject()}
        >
          Reject
        </Button>
      </div>

      {/* Assign Vehicle Modal */}
      <AssignVehicleModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssign={setAssignedVehicle}
      />

      {/* Audit Trail */}
      <AuditTrail logs={auditLogs} />
    </div>
  );
}