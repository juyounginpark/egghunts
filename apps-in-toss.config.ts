import { defineConfig } from "@apps-in-toss/web-framework/config";
export default defineConfig({
  appName: "alkong-expedition",
  brand: { primaryColor: "#648547" },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: false,
    transparentBackground: true,
    theme: "light",
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsBackForwardNavigationGestures: false,
  },
  webBundleDir: "dist",
});
