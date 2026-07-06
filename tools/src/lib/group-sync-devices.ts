import type {
  AliasesConfig,
  ParsedPartslistDeviceWithId,
  RawExampleUrls,
  SyncDeviceEntry,
} from "./types.js";

function mergeRawExampleUrls(
  ...sources: RawExampleUrls[]
): RawExampleUrls {
  const merged: RawExampleUrls = {};
  for (const source of sources) {
    if (source.chirimen) merged.chirimen = source.chirimen;
    if (source.microbit) merged.microbit = source.microbit;
    if (source.piZero) merged.piZero = source.piZero;
  }
  return merged;
}

function getCompositeComponentModels(aliases: AliasesConfig): Set<string> {
  const models = new Set<string>();
  for (const composite of Object.values(aliases.compositeDevices ?? {})) {
    for (const model of composite.models) {
      models.add(model);
    }
  }
  return models;
}

function findDeviceByModel(
  devices: ParsedPartslistDeviceWithId[],
  model: string,
): ParsedPartslistDeviceWithId | undefined {
  return devices.find((device) => device.model === model);
}

function buildCompositeEntry(
  compositeId: string,
  composite: { models: string[]; description: string },
  devices: ParsedPartslistDeviceWithId[],
): SyncDeviceEntry | null {
  const componentRows = composite.models
    .map((model) => findDeviceByModel(devices, model))
    .filter((row): row is ParsedPartslistDeviceWithId => row !== undefined);

  if (componentRows.length === 0) return null;

  const primary = componentRows[0];
  const rawExampleUrls = mergeRawExampleUrls(
    ...componentRows.map((row) => row.rawExampleUrls),
  );

  return {
    id: compositeId,
    model: compositeId,
    kind: "composite",
    tag: primary.tag,
    category: primary.category,
    description: composite.description || primary.description,
    imagePath: primary.imagePath,
    productUrl: primary.productUrl,
    circuitUrl: componentRows.find((row) => row.circuitUrl)?.circuitUrl,
    datasheetUrl: componentRows.find((row) => row.datasheetUrl)?.datasheetUrl,
    referenceUrl: componentRows.find((row) => row.referenceUrl)?.referenceUrl,
    noteUrl: componentRows.find((row) => row.noteUrl)?.noteUrl,
    specUrl: componentRows.find((row) => row.specUrl)?.specUrl,
    instructionsUrl: componentRows.find((row) => row.instructionsUrl)
      ?.instructionsUrl,
    guideUrl: componentRows.find((row) => row.guideUrl)?.guideUrl,
    rawExampleUrls,
  };
}

function buildRemoteEntry(
  remoteId: string,
  remote: { baseModel: string; models?: string[]; description: string },
  devices: ParsedPartslistDeviceWithId[],
  composites: SyncDeviceEntry[],
): SyncDeviceEntry | null {
  const compositeBase = composites.find((entry) => entry.id === remote.baseModel);
  const baseRow = compositeBase ?? findDeviceByModel(devices, remote.baseModel);

  if (!baseRow) return null;

  return {
    id: remoteId,
    model: remoteId.replace(/^remote_/, ""),
    kind: "remote",
    tag: baseRow.tag,
    category: baseRow.category,
    description: remote.description || baseRow.description,
    imagePath: baseRow.imagePath,
    productUrl: baseRow.productUrl,
    circuitUrl: baseRow.circuitUrl,
    datasheetUrl: baseRow.datasheetUrl,
    referenceUrl: baseRow.referenceUrl,
    noteUrl: baseRow.noteUrl,
    specUrl: baseRow.specUrl,
    instructionsUrl: baseRow.instructionsUrl,
    guideUrl: baseRow.guideUrl,
    rawExampleUrls: { ...baseRow.rawExampleUrls },
  };
}

export function groupSyncDevices(
  devices: ParsedPartslistDeviceWithId[],
  aliases: AliasesConfig = {},
): SyncDeviceEntry[] {
  const compositeComponentModels = getCompositeComponentModels(aliases);
  const entries: SyncDeviceEntry[] = [];

  for (const device of devices) {
    if (compositeComponentModels.has(device.model)) continue;
    entries.push({ ...device, kind: "single" });
  }

  for (const [compositeId, composite] of Object.entries(
    aliases.compositeDevices ?? {},
  )) {
    const entry = buildCompositeEntry(compositeId, composite, devices);
    if (entry) entries.push(entry);
  }

  const composites = entries.filter((entry) => entry.kind === "composite");

  for (const [remoteId, remote] of Object.entries(aliases.remoteDevices ?? {})) {
    const entry = buildRemoteEntry(remoteId, remote, devices, composites);
    if (entry) entries.push(entry);
  }

  return entries;
}
