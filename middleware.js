export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/api/schedule/:path*", "/api/stats/:path*", "/api/submit/:path*"],
};
