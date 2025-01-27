"use client";

import { useState, useEffect } from "react";

const HoverPopupLink = ({ url }) => {
    const [hovered, setHovered] = useState(false);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (hovered) {
            setMounted(true);
        } else {
            // Delay unmounting to allow animation to complete
            const timer = setTimeout(() => setMounted(false), 300);
            return () => clearTimeout(timer);
        }
    }, [hovered]);

    useEffect(() => {
        const fetchMetadata = async () => {
            if (metadata || loading) return;
            setLoading(true);

            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);

                if (response.ok) {
                    const data = await response.json();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(data.contents, 'text/html');

                    const extractedMetadata = {
                        title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                            doc.querySelector('title')?.textContent ||
                            'No Title Available',

                        description: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                            doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                            'No Description Available',

                        image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                            doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
                            null
                    };

                    setMetadata(extractedMetadata);
                }
            } catch (error) {
                console.error("Error fetching metadata:", error);
                setMetadata({
                    title: 'Failed to load preview',
                    description: 'Could not fetch page metadata',
                    image: null
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMetadata();
    }, [url]);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 underline"
            >
                {url}
            </a>
            {mounted && (
                <div
                    className={`
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            bg-white border border-gray-200 rounded-lg p-4 shadow-lg w-64 z-50
            transition-all duration-300 ease-in-out
            ${hovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
                    style={{
                        pointerEvents: hovered ? "auto" : "none", // Ensure no interaction when hidden
                    }}
                >
                    {loading && <p className="text-sm text-gray-500">Loading preview...</p>}
                    {metadata && (
                        <div className="space-y-2">
                            {metadata.image && (
                                <img
                                    src={metadata.image}
                                    alt={metadata.title || "Preview"}
                                    className="w-full rounded-md object-cover"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            )}
                            <p className="text-sm font-medium text-gray-800">
                                {metadata.title}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-3">
                                {metadata.description}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default HoverPopupLink;