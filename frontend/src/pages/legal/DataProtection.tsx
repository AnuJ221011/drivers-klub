import React from "react";

export default function DataProtectionPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-12">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm md:p-10">
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          Data Protection Policy
        </h1>
        <p className="text-sm text-gray-600">
          Official Platform: Driver’s Klub (Tribore Technologies Pvt Ltd)
        </p>
        <p className="mb-6 text-sm text-gray-500">
          Effective Date: January 23, 2026
        </p>

        <section className="space-y-6 text-gray-800">
          <p>
            This Data Protection Policy explains how the Driver’s Klub platform,
            owned and operated by Tribore Technologies Pvt Ltd, collects, uses,
            and protects personal data in compliance with the Digital Personal
            Data Protection (DPDP) Act, 2023 and other applicable Indian laws.
          </p>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              1. Data Collection Principles
            </h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Lawful & Transparent:</strong> Personal data is collected
                only for specified, lawful, and legitimate purposes.
              </li>
              <li>
                <strong>Purpose Limitation:</strong> Data is processed strictly
                for the purposes for which it was collected.
              </li>
              <li>
                <strong>Data Minimization:</strong> Only the minimum necessary
                data required for operations is collected.
              </li>
              <li>
                <strong>Accuracy:</strong> Reasonable steps are taken to ensure
                personal data is accurate and kept up to date.
              </li>
              <li>
                <strong>Storage Limitation:</strong> Data is retained only for as
                long as necessary to meet operational or legal requirements.
              </li>
              <li>
                <strong>Security Safeguards:</strong> Appropriate technical and
                organizational safeguards are implemented to protect data.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">2. Security Measures</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Encryption:</strong> Personal data is encrypted both in
                transit and at rest.
              </li>
              <li>
                <strong>Access Control:</strong> Role-based access controls limit
                data access to authorized personnel only.
              </li>
              <li>
                <strong>Audit Logs:</strong> All access to personal data is
                logged and monitored.
              </li>
              <li>
                <strong>Regular Security Assessments:</strong> Periodic
                vulnerability assessments and security reviews are conducted.
              </li>
              <li>
                <strong>Employee Training:</strong> Employees undergo regular
                training on data protection and privacy practices.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              3. Data Protection Officer
            </h2>
            <p>
              The designated Grievance Officer for data protection and privacy
              matters can be contacted at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <span className="font-medium">grievance@driversklub.in</span>
            </p>
            <p>
              <strong>Response Time:</strong> Within 48 hours for data-related
              queries or grievances.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">4. Incident Response</h2>
            <p className="mb-2">In the event of a personal data breach, we will:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Contain and assess the breach within 24 hours.</li>
              <li>
                Notify affected users and relevant authorities as required by
                applicable law.
              </li>
              <li>
                Implement corrective and preventive measures to reduce the risk
                of future incidents.
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="font-medium">For questions about this policy or your data rights:</p>
            <p className="mt-1">📧 grievance@driversklub.in</p>
          </div>
        </section>
      </div>
    </div>
  );
}
