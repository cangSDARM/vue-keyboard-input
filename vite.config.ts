import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import Vuetify from "vite-plugin-vuetify";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Vuetify({
      autoImport: true,
    }),
  ],
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
      scss: {
        api: "modern-compiler",
      },
    },
  },
});
