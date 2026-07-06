async function main(): Promise<void> {
  console.warn("sync-devices: stub — see issue #9");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
