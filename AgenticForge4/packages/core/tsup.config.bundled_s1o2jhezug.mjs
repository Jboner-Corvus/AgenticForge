// tsup.config.ts
import { defineConfig } from "tsup";
import * as fs from "fs-extra";
import { statSync } from "fs";
var tsup_config_default = defineConfig({
  clean: true,
  dts: {
    resolve: true,
    entry: "src/index.ts"
  },
  entry: ["src/index.ts", "src/webServer.ts", "src/worker.ts"],
  external: ["path", "playwright", "playwright-core", "@modelcontextprotocol/inspector"],
  format: ["esm"],
  outDir: "dist",
  sourcemap: true,
  splitting: false,
  async onSuccess() {
    console.log("Copying additional files...");
    await fs.copy("src/modules/tools", "dist/tools", {
      filter: (src) => {
        if (statSync(src).isDirectory()) {
          return true;
        }
        return !src.endsWith(".ts");
      }
    });
    console.log("Additional files copied.");
  }
});
export {
  tsup_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidHN1cC5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9faW5qZWN0ZWRfZmlsZW5hbWVfXyA9IFwiL2hvbWUvZGVtb24vYWdlbnRmb3JnZS9BZ2VudGljRm9yZ2UyL0FnZW50aWNGb3JnZTQvcGFja2FnZXMvY29yZS90c3VwLmNvbmZpZy50c1wiO2NvbnN0IF9faW5qZWN0ZWRfZGlybmFtZV9fID0gXCIvaG9tZS9kZW1vbi9hZ2VudGZvcmdlL0FnZW50aWNGb3JnZTIvQWdlbnRpY0ZvcmdlNC9wYWNrYWdlcy9jb3JlXCI7Y29uc3QgX19pbmplY3RlZF9pbXBvcnRfbWV0YV91cmxfXyA9IFwiZmlsZTovLy9ob21lL2RlbW9uL2FnZW50Zm9yZ2UvQWdlbnRpY0ZvcmdlMi9BZ2VudGljRm9yZ2U0L3BhY2thZ2VzL2NvcmUvdHN1cC5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd0c3VwJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWV4dHJhJztcbmltcG9ydCB7IHN0YXRTeW5jIH0gZnJvbSAnZnMnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBjbGVhbjogdHJ1ZSxcbiAgZHRzOiB7XG4gICAgcmVzb2x2ZTogdHJ1ZSxcbiAgICBlbnRyeTogJ3NyYy9pbmRleC50cycsXG4gIH0sXG4gIGVudHJ5OiBbJ3NyYy9pbmRleC50cycsICdzcmMvd2ViU2VydmVyLnRzJywgJ3NyYy93b3JrZXIudHMnXSxcbiAgZXh0ZXJuYWw6IFsncGF0aCcsICdwbGF5d3JpZ2h0JywgJ3BsYXl3cmlnaHQtY29yZScsICdAbW9kZWxjb250ZXh0cHJvdG9jb2wvaW5zcGVjdG9yJ10sXG4gIGZvcm1hdDogWydlc20nXSxcbiAgb3V0RGlyOiAnZGlzdCcsXG4gIHNvdXJjZW1hcDogdHJ1ZSxcbiAgc3BsaXR0aW5nOiBmYWxzZSxcbiAgYXN5bmMgb25TdWNjZXNzKCkge1xuICAgIGNvbnNvbGUubG9nKCdDb3B5aW5nIGFkZGl0aW9uYWwgZmlsZXMuLi4nKTtcbiAgICBhd2FpdCBmcy5jb3B5KCdzcmMvbW9kdWxlcy90b29scycsICdkaXN0L3Rvb2xzJywge1xuICAgICAgZmlsdGVyOiAoc3JjKSA9PiB7XG4gICAgICAgIGlmIChzdGF0U3luYyhzcmMpLmlzRGlyZWN0b3J5KCkpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gIXNyYy5lbmRzV2l0aCgnLnRzJyk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCdBZGRpdGlvbmFsIGZpbGVzIGNvcGllZC4nKTtcbiAgfSxcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFUsU0FBUyxvQkFBb0I7QUFDM1csWUFBWSxRQUFRO0FBQ3BCLFNBQVMsZ0JBQWdCO0FBRXpCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxFQUNQLEtBQUs7QUFBQSxJQUNILFNBQVM7QUFBQSxJQUNULE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxPQUFPLENBQUMsZ0JBQWdCLG9CQUFvQixlQUFlO0FBQUEsRUFDM0QsVUFBVSxDQUFDLFFBQVEsY0FBYyxtQkFBbUIsaUNBQWlDO0FBQUEsRUFDckYsUUFBUSxDQUFDLEtBQUs7QUFBQSxFQUNkLFFBQVE7QUFBQSxFQUNSLFdBQVc7QUFBQSxFQUNYLFdBQVc7QUFBQSxFQUNYLE1BQU0sWUFBWTtBQUNoQixZQUFRLElBQUksNkJBQTZCO0FBQ3pDLFVBQVMsUUFBSyxxQkFBcUIsY0FBYztBQUFBLE1BQy9DLFFBQVEsQ0FBQyxRQUFRO0FBQ2YsWUFBSSxTQUFTLEdBQUcsRUFBRSxZQUFZLEdBQUc7QUFDL0IsaUJBQU87QUFBQSxRQUNUO0FBQ0EsZUFBTyxDQUFDLElBQUksU0FBUyxLQUFLO0FBQUEsTUFDNUI7QUFBQSxJQUNGLENBQUM7QUFDRCxZQUFRLElBQUksMEJBQTBCO0FBQUEsRUFDeEM7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
