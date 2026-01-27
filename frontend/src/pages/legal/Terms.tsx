import React from "react";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-12">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm md:p-10">
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          Platform Terms of Use
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Last Updated: 23rd January, 2026
        </p>

        <section className="space-y-6 text-gray-800">
          <p>
            This document constitutes a legally binding agreement between you
            ("User", "Fleet Operator", or "Driver") and Tribore
            Technologies Pvt Ltd ("Company", "Platform", or "We"). By
            accessing or using the Driver’s Klub web application and mobile
            interfaces (collectively, the "Platform"), you agree to comply
            with and be bound by these Terms of Use ("Terms").
          </p>

          <div>
            <h2 className="mb-2 text-xl font-semibold">1. Platform Overview</h2>
            <p className="mb-2">
              The Platform is an asset-light SaaS solution designed for the
              electric vehicle (EV) rental ecosystem. It serves as a two-sided
              marketplace providing:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>For Fleet Operators:</strong> Tools for vehicle listing,
                driver management, real-time trip tracking, and automated payment
                processing.
              </li>
              <li>
                <strong>For Drivers:</strong> A portal to manage bookings, track
                earnings, pay rentals, and receive incentives.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              2. Registration and Account Security
            </h2>
            <p>
              <strong>2.1 Eligibility:</strong> Fleet Operators must be legally
              incorporated entities or registered proprietorships. Drivers must
              possess a valid Indian driving license and meet all regulatory
              requirements for operating commercial vehicles.
            </p>
            <p>
              <strong>2.2 Account Responsibility:</strong> Users are responsible
              for maintaining the confidentiality of their login credentials.
              Any activity occurring under an account is deemed the
              responsibility of the account holder.
            </p>
            <p>
              <strong>2.3 Verification:</strong> All Drivers must undergo a
              Background Verification (BGV) process as prescribed by the
              Platform or the Fleet Operator before being granted access to
              vehicles.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              3. Obligations of Fleet Operators
            </h2>
            <p>
              <strong>3.1 Inventory Accuracy:</strong> Fleet Operators must
              ensure that vehicle status (Active, Maintenance, or Booked) is
              updated in real-time. Failure to maintain accurate status may
              result in Platform penalties or account suspension.
            </p>
            <p>
              <strong>3.2 Compliance:</strong> Operators must maintain all
              vehicles in roadworthy condition and ensure all necessary permits,
              insurance, and fitness certificates are current and valid.
            </p>
            <p>
              <strong>3.3 Platform Exclusivity:</strong> Operators agree to
              process all bookings, rentals, and Driver payments through the
              Platform to ensure transaction transparency and capital
              protection.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              4. Obligations of Drivers
            </h2>
            <p>
              <strong>4.1 Safe Operation:</strong> Drivers must operate vehicles
              in strict compliance with all traffic laws and safety
              regulations.
            </p>
            <p>
              <strong>4.2 Vehicle Care:</strong> Drivers are responsible for
              daily vehicle checks and must report any damages immediately.
              Tyre punctures and damages resulting from negligence are the sole
              liability of the Driver.
            </p>
            <p>
              <strong>4.3 Return Timelines:</strong> Vehicles must be returned to
              designated hubs by the agreed checkout time (e.g., 11:00 PM). Late
              returns will incur an automated penalty of ₹200/hour.
            </p>
            <p>
              <strong>4.4 Usage Limits:</strong> Drivers must adhere to the
              kilometer (KM) capping (e.g., 220 km/day) as specified in their
              respective rental plans.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              5. Payments, Fraud, and Chargebacks
            </h2>
            <p>
              <strong>5.1 Automated Deductions:</strong> The Platform is
              authorized to deduct daily/weekly rentals, FASTag charges, and
              traffic challans (fines) from the Driver’s digital wallet or
              earnings.
            </p>
            <p>
              <strong>5.2 Fraudulent Activity:</strong> Any attempt to
              manipulate trip data, bypass Platform payment systems, or provide
              false verification documents will result in immediate account
              termination and potential legal action.
            </p>
            <p>
              <strong>5.3 Chargeback Liability:</strong> In instances of
              fraudulent customer payments or chargebacks, the Fleet Operator
              remains liable for the transaction amount if Platform
              verification protocols were bypassed.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">6. Prohibited Conduct</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>Use the Platform for any unlawful, harassing, or fraudulent purpose.</li>
              <li>Interfere with the operation of the Platform or access restricted data.</li>
              <li>
                Directly or indirectly solicit customers discovered through the
                Platform to transact outside of the Platform (Disintermediation).
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">7. Termination</h2>
            <p>
              The Platform reserves the right to suspend or terminate access for
              any User who violates these Terms, fails to pay Platform fees, or
              engages in conduct that harms the integrity of the EV ecosystem.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              8. Limitation of Liability
            </h2>
            <p>
              The Platform provides technology services on an "as-is" and
              "as-available" basis. Tribore Technologies Pvt Ltd is not liable
              for mechanical failures, road accidents, or third-party criminal
              acts. Capital protection for unpaid rentals is strictly limited to
              the thresholds defined in the Capital Protection Schedule.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
