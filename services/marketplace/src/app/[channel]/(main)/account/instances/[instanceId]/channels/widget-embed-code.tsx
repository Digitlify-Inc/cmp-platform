"use client";

import { useState } from "react";

interface WidgetEmbedCodeProps {
  instanceId: string;
  instanceName: string;
  gatewayUrl: string;
}

export function WidgetEmbedCode({ instanceId, instanceName, gatewayUrl }: WidgetEmbedCodeProps) {
  const [copied, setCopied] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [position, setPosition] = useState<"bottom-right" | "bottom-left">("bottom-right");

  const embedCode = `<!-- Digitlify Chat Widget -->
<script>
  window.digitlifyConfig = {
    instanceId: "${instanceId}",
    apiUrl: "${gatewayUrl}",
    theme: {
      primaryColor: "${primaryColor}",
      position: "${position}"
    },
    welcomeMessage: "Hello! How can I help you today?"
  };
</script>
<script src="${gatewayUrl}/widget/v1/embed.js" async></script>`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {/* Customization Options */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Primary Color</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-gray-300"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as "bottom-right" | "bottom-left")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm"
          >
            <option value="bottom-right">Bottom Right</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </div>
      </div>

      {/* Embed Code */}
      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Embed Code</label>
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
          <code>{embedCode}</code>
        </pre>
      </div>

      {/* Instructions */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h4 className="font-medium text-blue-800">Installation Instructions</h4>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-700">
          <li>Copy the embed code above</li>
          <li>Paste it into your website&apos;s HTML, just before the closing <code className="rounded bg-blue-100 px-1">&lt;/body&gt;</code> tag</li>
          <li>The widget will appear automatically on your site</li>
          <li>Make sure to use your API key for authentication</li>
        </ol>
      </div>

      {/* Allowed Origins (Coming Soon) */}
      <div className="rounded-lg border bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Allowed Origins</h4>
            <p className="text-sm text-gray-500">
              Restrict which domains can use your widget (security feature)
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
            Coming Soon
          </span>
        </div>
      </div>

      {/* Preview */}
      <div>
        <h4 className="mb-2 font-medium text-gray-900">Preview</h4>
        <div className="relative h-48 rounded-lg border bg-gray-100">
          <div
            className={`absolute ${position === "bottom-right" ? "right-4" : "left-4"} bottom-4`}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            Widget will appear here on your website
          </div>
        </div>
      </div>
    </div>
  );
}
