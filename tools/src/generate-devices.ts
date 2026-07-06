async function main(): Promise<void> {
  console.warn("generate-devices: stub — see issue #11");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
