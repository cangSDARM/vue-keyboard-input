import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Vuetify, { transformAssetUrls } from "vite-plugin-vuetify";
import Unfonts from "unplugin-fonts/vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/vue-keyboard-input/",
  worker: {
    format: "es",
  },
  build: {
    ssrEmitAssets: true,
  },
  plugins: [
    Unfonts({
      custom: {
        families: {
          SourceHanSans: {
            local: "SourceHanSans",
            src: "./assets/fonts/SourceHanSansSC*",
          },
          Plangothic: {
            local: "Plangothic",
            src: "./assets/fonts/PlangothicP1*",
          },
        },
        preload: true,
        prefetch: true,
      },
    }),
    vue({
      template: { transformAssetUrls },
    }),
    Vuetify({
      autoImport: true,
    }),
  ],
  optimizeDeps: {
    exclude: ["vuetify"],
  },
  css: {
    preprocessorOptions: {
      sass: {
        // @ts-ignore
        api: "modern-compiler",
      },
      scss: {
        // @ts-ignore
        api: "modern-compiler",
      },
    },
  },
});
