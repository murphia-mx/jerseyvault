import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import imgProxy from "./netlify/edge-functions/img-proxy.ts";

/**
 * Locally (`vite` and `vite preview`), serve /img-proxy/* with the same handler
 * as the Netlify edge function, so every environment shares the Referer
 * injection and the detection of Yupoo's "image unavailable" placeholder.
 */
const serveImgProxy: Connect.NextHandleFunction = async (req, res) => {
  try {
    const response = await imgProxy(new Request(`http://localhost${req.originalUrl ?? req.url}`, {
      headers: { "User-Agent": req.headers["user-agent"] ?? "" },
    }));
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.statusCode = 502;
    res.end(String(error));
  }
};

function imgProxyLocal(): Plugin {
  return {
    name: "img-proxy-local",
    configureServer(server) {
      server.middlewares.use("/img-proxy", serveImgProxy);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/img-proxy", serveImgProxy);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), imgProxyLocal()],
});
