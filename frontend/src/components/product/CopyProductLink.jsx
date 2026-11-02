import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyProductLink({ product }) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = async () => {
        try {
            const productUrl = `${window.location.origin}/product/${product.slug}`;

            await navigator.clipboard.writeText(productUrl);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 2000);
        } catch (error) {
            console.error("Failed to copy product link:", error);
        }
    };

    return (
        <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition"
        >
            {copied ? (
                <>
                    <Check size={18} />
                    Copied!
                </>
            ) : (
                <>
                    <Copy size={18} />
                    Copy Link
                </>
            )}
        </button>
    );
}