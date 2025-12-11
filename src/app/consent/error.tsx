"use client";

import Link from "next/link";

export default function ConsentErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm space-y-6 border p-6 rounded-lg shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-red-600">Consent Error</h1>
          <p className="text-gray-500">
            Failed to process consent request. This may be due to an invalid or expired challenge.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm space-y-2">
          <p className="font-semibold text-yellow-800">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1 text-yellow-700 text-xs">
            <li>Ensure Hydra is running and accessible</li>
            <li>Check that the login process completed successfully</li>
            <li>Try logging in again from the beginning</li>
            <li>Check browser console for detailed error messages</li>
          </ul>
        </div>

        <Link
          href="/"
          className="inline-block w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 text-center"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
