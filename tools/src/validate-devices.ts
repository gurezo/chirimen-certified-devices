async function main(): Promise<void> {
  console.warn("validate-devices: stub — see issue #10");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
