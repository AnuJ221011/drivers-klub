import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../ui/Button";
import MediaGallery from "./MediaGallary";
import AuditTrail from "./AuditTrail";
import AssignVehicleModal from "./AssignVehicleModal";

const mockCheckin = {
  id: "CHK_1021",
  driver: {
    name: "Rohit Kumar",
    phone: "9876543210",
  },
  fleet: {
    name: "Delhi Fleet",
  },
  checkinTime: "06:30 AM",
  remarks: "Vehicle condition looks fine. No visible issues.",
};

export default function DriverCheckinDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignedVehicle, setAssignedVehicle] = useState<{
    number: string;
    model: string;
  } | null>(null);

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

      {/* Summary Card */}
      <div className="rounded-lg border border-black/10 bg-white p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-black/60">Driver</p>
            <p className="font-medium">{mockCheckin.driver.name}</p>
            <p className="text-xs text-black/50">
              {mockCheckin.driver.phone}
            </p>
          </div>

          <div>
            <p className="text-black/60">Fleet</p>
            <p className="font-medium">{mockCheckin.fleet.name}</p>
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
            <p className="font-medium">{mockCheckin.checkinTime}</p>
          </div>
        </div>
      </div>

      {/* Media */}
      <MediaGallery
        title="Selfie"
        images={[
          "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=800",
        ]}
      />

      <MediaGallery
        title="Vehicle Images"
        images={[
          "https://images.unsplash.com/photo-1549924231-f129b911e442?w=800",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
        ]}
      />

      <MediaGallery
        title="Odometer"
        images={[
          "https://images.unsplash.com/photo-1581091215367-59ab6b0f5c44?w=800",
        ]}
      />

      {/* Remarks */}
      <div className="rounded-lg border border-black/10 bg-white p-4">
        <h3 className="font-medium mb-2">Driver Remarks</h3>
        <p className="text-sm text-black/70">
          {mockCheckin.remarks}
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
          disabled={!assignedVehicle}
        >
          Approve
        </Button>

        <Button variant="secondary" className="text-red-600">
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
      <AuditTrail
        logs={[
          { action: "Check-in submitted", by: "Driver", at: "06:30 AM" },
          { action: "Viewed by Admin", by: "Admin", at: "06:45 AM" },
        ]}
      />
    </div>
  );
}