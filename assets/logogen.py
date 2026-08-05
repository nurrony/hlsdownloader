light_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 120" width="720" height="120">
    <defs>
        <style>
            .text-hls { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; font-size: 72px; fill: #0f172a; }
            .text-dl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 300; font-size: 72px; fill: #475569; }
        </style>
    </defs>
    <g transform="translate(10, 10) scale(1.1)">
        <rect x="25" y="10" width="50" height="16" rx="4" fill="#60a5fa" />
        <rect x="25" y="34" width="50" height="16" rx="4" fill="#3b82f6" />
        <path d="M15 60 L85 60 L50 90 Z" fill="#1d4ed8" stroke="#1d4ed8" stroke-width="8" stroke-linejoin="round" />
    </g>
    <text x="135" y="90">
        <tspan class="text-hls">hls</tspan><tspan class="text-dl">downloader</tspan>
    </text>
</svg>"""

dark_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 120" width="720" height="120">
    <defs>
        <style>
            .text-hls { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; font-size: 72px; fill: #f8fafc; }
            .text-dl { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 300; font-size: 72px; fill: #94a3b8; }
        </style>
    </defs>
    <g transform="translate(10, 10) scale(1.1)">
        <rect x="25" y="10" width="50" height="16" rx="4" fill="#60a5fa" />
        <rect x="25" y="34" width="50" height="16" rx="4" fill="#3b82f6" />
        <path d="M15 60 L85 60 L50 90 Z" fill="#1d4ed8" stroke="#1d4ed8" stroke-width="8" stroke-linejoin="round" />
    </g>
    <text x="135" y="90">
        <tspan class="text-hls">hls</tspan><tspan class="text-dl">downloader</tspan>
    </text>
</svg>"""

favicon_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <rect x="25" y="10" width="50" height="16" rx="4" fill="#60a5fa" />
    <rect x="25" y="34" width="50" height="16" rx="4" fill="#3b82f6" />
    <path d="M15 60 L85 60 L50 90 Z" fill="#1d4ed8" stroke="#1d4ed8" stroke-width="8" stroke-linejoin="round" />
</svg>"""

with open("hlsdownloader-light.svg", "w") as f:
    f.write(light_svg)

with open("hlsdownloader-dark.svg", "w") as f:
    f.write(dark_svg)

with open("favicon.svg", "w") as f:
    f.write(favicon_svg)

print("Files generated successfully.")
