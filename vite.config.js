import tailwindcss from "@tailwindcss/vite"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

const htmlFiles = [
  "index.html",
  "terms.html", 
  "privacy.html",
  "data-deletion.html",
  "support-policy.html",
  "help.html"
]

export default {
  plugins: [tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(
        htmlFiles.map((file) => [
          file.replace(".html", ""),
          resolve(__dirname, file),
        ])
      ),
    },
  },
}
