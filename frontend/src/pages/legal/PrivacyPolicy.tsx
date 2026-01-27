import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-12">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm md:p-10">
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          🔒 Privacy Policy for Driver’s Klub
        </h1>
        <p className="text-sm text-gray-600">Official Entity: Tribore Technologies Pvt Ltd</p>
        <p className="mb-6 text-sm text-gray-500">Effective Date: January 23, 2026</p>

        <section className="space-y-6 text-gray-800">
          <p>
            At Driver’s Klub, we respect the hustle of our drivers and fleet
            operators. Protecting your digital personal data isn’t just a legal
            checkbox; it’s how we build a reliable community. This Privacy Policy
            explains how we collect, use, share, and protect your data in
            accordance with the Digital Personal Data Protection (DPDP) Act,
            2023.
          </p>

          <div>
            <h2 className="mb-2 text-xl font-semibold">1. Data We Collect</h2>
            <p className="mb-2">
              We collect only what is essential to keep your wheels turning and
              your operations organized:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Identity & Professional Data:</strong> Name, contact
                details, profile photo, and government-mandated KYC (Aadhaar,
                PAN). For drivers, this includes Driving Licenses and vehicle
                documentation such as RC, insurance, and permits.
              </li>
              <li>
                <strong>Operational & Location Data:</strong> Real-time GPS
                location, trip history, mileage, and vehicle performance data to
                enable trip management and dispatch.
              </li>
              <li>
                <strong>Financial Data:</strong> Bank account details for
                payouts, settlement history, and commission data. We do not
                store sensitive card information such as PINs or CVVs.
              </li>
              <li>
                <strong>Device & Usage Data:</strong> IP address, device model,
                application interaction logs, and crash reports to improve
                stability and performance.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">2. Purpose of Processing</h2>
            <p className="mb-2">Your data is processed only for defined operational needs:</p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-200 p-2 text-left">Purpose</th>
                    <th className="border border-gray-200 p-2 text-left">Type of Data Used</th>
                    <th className="border border-gray-200 p-2 text-left">Legal Basis (DPDP)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">Trip & Fleet Management</td>
                    <td className="border p-2">Location, Identity, Vehicle Docs</td>
                    <td className="border p-2">Performance of a Contract</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Payouts & Settlements</td>
                    <td className="border p-2">Financial, Identity, Trip History</td>
                    <td className="border p-2">Performance of a Contract</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Safety & Verification</td>
                    <td className="border p-2">KYC, Live Location, Identity</td>
                    <td className="border p-2">Legitimate Interests / Safety</td>
                  </tr>
                  <tr>
                    <td className="border p-2">Regulatory Compliance</td>
                    <td className="border p-2">KYC, Transaction Logs</td>
                    <td className="border p-2">Legal Obligation</td>
                  </tr>
                  <tr>
                    <td className="border p-2">App Optimization</td>
                    <td className="border p-2">Usage Data, Device Info</td>
                    <td className="border p-2">Legitimate Interests</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">3. Who We Share Data With</h2>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Fleet Operators:</strong> If you operate under a fleet,
                your trip and performance data is shared for operational
                management.
              </li>
              <li>
                <strong>Riders / End-Users:</strong> Limited identity details
                (name, photo) and real-time location are shared to facilitate
                successful trips.
              </li>
              <li>
                <strong>Payment Partners:</strong> For secure processing of
                payouts and settlements.
              </li>
              <li>
                <strong>Authorities:</strong> When required by Indian law,
                transport authorities, or law enforcement agencies.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">4. Security and Data Longevity</h2>
            <p>
              <strong>Security:</strong> We use industry-standard encryption,
              monitoring, and access controls. Your data is protected with the
              same seriousness as financial infrastructure.
            </p>
            <p>
              <strong>Retention:</strong> Data is retained only while you remain
              active on Driver’s Klub. Certain records such as tax or trip data
              may be retained longer to meet legal and regulatory obligations.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">5. Your Rights as a Data Principal</h2>
            <p className="mb-2">Under the DPDP Act, 2023, you have the following rights:</p>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Right to Access:</strong> Request details of the personal
                data we hold about you.
              </li>
              <li>
                <strong>Right to Correction:</strong> Correct inaccurate or
                outdated personal data.
              </li>
              <li>
                <strong>Right to Erasure:</strong> Request account deletion,
                subject to pending settlements or legal requirements.
              </li>
              <li>
                <strong>Right to Withdraw Consent:</strong> Withdraw consent for
                certain data uses, such as location tracking (this may limit
                platform functionality).
              </li>
              <li>
                <strong>Grievance Redressal:</strong> Contact our Grievance
                Officer at <span className="font-medium">grievance@driversklub.in</span>. If
                unresolved, you may approach the Data Protection Board of India.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
