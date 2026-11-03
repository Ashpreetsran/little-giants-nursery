import { resolve4, resolve6, resolveCaa, resolveCname, resolveMx, resolveNs, resolveTxt } from "node:dns/promises";
import baseline from "../config/precutover-dns-baseline.json" with { type: "json" };

function normalize(values) {
  return values.map((value) => value.toLowerCase().replace(/\.$/, "")).sort();
}

function assertEqual(label, actual, expected) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);
  if (actualJson !== expectedJson) {
    throw new Error(`${label} changed. Expected ${expectedJson}, received ${actualJson}`);
  }
}

async function resolveOptional(resolver, hostname) {
  try {
    return await resolver(hostname);
  } catch (error) {
    if (error?.code === "ENODATA" || error?.code === "ENOTFOUND") return [];
    throw error;
  }
}

function normalizeTxt(records) {
  return records.map((chunks) => chunks.join("")).sort();
}

const [nameservers, apexA, apexAaaa, caa, wwwCname, domainConnectCname, apexTxt, dmarcTxt, mx] = await Promise.all([
  resolveNs(baseline.domain),
  resolve4(baseline.domain),
  resolveOptional(resolve6, baseline.domain),
  resolveOptional(resolveCaa, baseline.domain),
  resolveCname(`www.${baseline.domain}`),
  resolveCname(`_domainconnect.${baseline.domain}`),
  resolveOptional(resolveTxt, baseline.domain),
  resolveOptional(resolveTxt, `_dmarc.${baseline.domain}`),
  resolveMx(baseline.domain),
]);

assertEqual("Nameservers", normalize(nameservers), normalize(baseline.nameservers));
assertEqual("Apex A records", [...apexA].sort(), [...baseline.apexA].sort());
assertEqual("Apex AAAA records", [...apexAaaa].sort(), [...baseline.apexAaaa].sort());
assertEqual("CAA records", caa, baseline.caa);
assertEqual("www CNAME", normalize(wwwCname), normalize(baseline.wwwCname));
assertEqual("Domain Connect CNAME", normalize(domainConnectCname), normalize(baseline.domainConnectCname));
assertEqual("Apex TXT records", normalizeTxt(apexTxt), [...baseline.apexTxt].sort());
assertEqual("DMARC TXT records", normalizeTxt(dmarcTxt), [...baseline.dmarcTxt].sort());
assertEqual(
  "Google Workspace MX records",
  mx.map(({ priority, exchange }) => `${priority} ${exchange.toLowerCase().replace(/\.$/, "")}`).sort(),
  baseline.mx.map(({ priority, exchange }) => `${priority} ${exchange.toLowerCase().replace(/\.$/, "")}`).sort(),
);

console.log(`Pre-cutover DNS still matches the ${baseline.capturedAt} baseline`);
console.log(
  `${baseline.nameservers.length} nameservers, web A and AAAA state, CAA state, 2 CNAMEs, apex and DMARC TXT state, and ${baseline.mx.length} Google Workspace MX records verified`,
);
console.log(`Registry expiry recorded as ${baseline.registryExpiry}`);
