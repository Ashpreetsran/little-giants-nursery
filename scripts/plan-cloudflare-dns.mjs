import { resolveNs } from "node:dns/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";
import {
  assertCondition,
  assertPrivateDnsPath,
  buildDnsPlan,
  createPlanDocument,
  fetchCloudflareDnsState,
  loadContractInputs,
  projectRoot,
  readDnsApiToken,
} from "./lib/dns-contract.mjs";

async function main() {
  assertCondition(process.argv.length === 2, "Usage: npm run dns:plan");

  const inputs = await loadContractInputs();
  const token = readDnsApiToken();
  const publicNameservers = await resolveNs(inputs.contract.domain);
  const cloudflare = await fetchCloudflareDnsState(token, inputs.contract);
  const core = buildDnsPlan({
    ...inputs,
    ...cloudflare,
    publicNameservers,
  });
  const document = createPlanDocument(core);
  const planPath = await assertPrivateDnsPath(inputs.contract.privatePlanPath);

  await mkdir(dirname(planPath), { recursive: true });
  await writeFile(planPath, `${JSON.stringify(document, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });

  console.log(`Cloudflare DNS plan written to ${relative(projectRoot, planPath)}`);
  console.log(`Plan SHA-256: ${document.planSha256}`);
  console.log(
    `${core.summary.scanAcceptCount} scan accepts, ${core.summary.postCount} additive posts, 0 rejects, 0 deletes, 0 patches, and 0 puts`,
  );
  console.log("Public nameservers remain on the four pre-cutover NS1 servers");
}

try {
  await main();
} catch (error) {
  console.error(`DNS plan blocked: ${error instanceof Error ? error.message : "Unknown error"}`);
  process.exitCode = 1;
}
