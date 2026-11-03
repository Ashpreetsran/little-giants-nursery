import { expect, test } from "@playwright/test";
import {
  edgeRedirectFor,
  isPreviewHostname,
  stagingHostname,
  workersDevPreviewHostname,
} from "../src/lib/edge-redirect";

test("both review hostnames are treated as noindex preview hosts", () => {
  expect(isPreviewHostname(stagingHostname)).toBe(true);
  expect(isPreviewHostname(workersDevPreviewHostname)).toBe(true);
  expect(isPreviewHostname("www.littlegiantsnursery.org")).toBe(false);
  expect(isPreviewHostname("littlegiantsnursery.org")).toBe(false);
});

test("preview legacy redirects stay on the noindex review host", () => {
  for (const hostname of [stagingHostname, workersDevPreviewHostname]) {
    expect(edgeRedirectFor(`https://${hostname}/about-us?q=a%2Bb`)).toEqual({
      location: "/nurseries/uxbridge/about?q=a%2Bb",
      status: 301,
    });
  }
});

test("staging is never canonicalized to the production host", () => {
  expect(edgeRedirectFor(`https://${stagingHostname}/`)).toBeNull();
  expect(edgeRedirectFor(`https://${stagingHostname}/nurseries/woodley`)).toBeNull();
});

test("production legacy redirects reach the canonical destination in one response", () => {
  expect(edgeRedirectFor("http://www.littlegiantsnursery.org/about-us?q=a%2Bb")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/uxbridge/about?q=a%2Bb",
    status: 301,
  });
  expect(edgeRedirectFor("https://littlegiantsnursery.org/about-us?q=a%2Bb")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/uxbridge/about?q=a%2Bb",
    status: 301,
  });
  expect(edgeRedirectFor("http://littlegiantsnursery.org/about-us/?q=a%26b")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/uxbridge/about?q=a%26b",
    status: 301,
  });
});

test("moved uxbridge pages redirect in a single hop", () => {
  expect(edgeRedirectFor("https://www.littlegiantsnursery.org/rooms/babies?q=a%2Bb")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/uxbridge/rooms/babies?q=a%2Bb",
    status: 301,
  });
  expect(edgeRedirectFor("https://www.littlegiantsnursery.org/contact")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/uxbridge/contact",
    status: 301,
  });
  // The Squarespace-era aliases jump straight to the final URL rather than
  // chaining through the path the page used to live at.
  expect(edgeRedirectFor("https://www.littlegiantsnursery.org/get-in-touch")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/uxbridge/contact",
    status: 301,
  });
});

test("production apex and HTTP requests canonicalize without changing path or query", () => {
  expect(edgeRedirectFor("https://littlegiantsnursery.org/nurseries/woodley?utm_source=cutover")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/woodley?utm_source=cutover",
    status: 301,
  });
  expect(edgeRedirectFor("http://www.littlegiantsnursery.org/nurseries/uxbridge/rooms/babies?q=a%2Bb")).toEqual({
    location: "https://www.littlegiantsnursery.org/nurseries/uxbridge/rooms/babies?q=a%2Bb",
    status: 301,
  });
  expect(edgeRedirectFor("https://www.littlegiantsnursery.org/nurseries/uxbridge/rooms/babies?q=a%2Bb")).toBeNull();
});
