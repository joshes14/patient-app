/** @type {import('next').NextConfig} */
const outputMode = process.env.NEXT_OUTPUT_MODE;

const nextConfig = {
  output:
    outputMode === "export"
      ? "export"
      : outputMode === "standalone"
        ? "standalone"
        : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
