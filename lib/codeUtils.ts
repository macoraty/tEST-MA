import { CatalogItem } from './types';

/**
 * Returns a clean 5-letter uppercase abbreviation for a given group name.
 * Removes accents, special symbols, spaces and pads with 'X' if shorter than 5 chars.
 * Examples:
 * - "PERFIS ESTRUTURAIS" -> "PERFI"
 * - "INSUMOS GERAIS" -> "INSUM"
 * - "MATÉRIA PRIMA" -> "MATER"
 * - "PNEUMÁTICA" -> "PNEUM"
 * - "AÇO" -> "ACOXX"
 */
export function getGroupPrefix(groupName: string): string {
  if (!groupName || typeof groupName !== 'string') {
    return 'GERAL';
  }

  // Remove accents / diacritics
  const normalized = groupName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Keep only uppercase alphanumeric characters (A-Z, 0-9)
  const clean = normalized.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  if (clean.length === 0) {
    return 'GERAL';
  }

  if (clean.length < 5) {
    return clean.padEnd(5, 'X').slice(0, 5);
  }

  return clean.slice(0, 5);
}

/**
 * Formats a code with 5-letter prefix and 4-digit number.
 * Example: ("PERFI", 1) -> "PERFI0001"
 */
export function formatItemCode(prefix: string, sequenceNumber: number): string {
  const cleanPrefix = (prefix || 'GERAL').padEnd(5, 'X').slice(0, 5).toUpperCase();
  const cleanNum = Math.max(1, Math.min(9999, Math.floor(sequenceNumber || 1)));
  return `${cleanPrefix}${String(cleanNum).padStart(4, '0')}`;
}

/**
 * Calculates the next available sequential code for a selected group.
 * Gathers all currently used numbers in that group and finds the lowest
 * unused number starting from 1 (reusing numbers if items were deleted).
 */
export function getNextCodeForGroup(groupName: string, catalog: CatalogItem[]): string {
  const prefix = getGroupPrefix(groupName);
  const usedNumbers = new Set<number>();

  catalog.forEach((item) => {
    if (!item.code) return;
    const itemCode = item.code.trim().toUpperCase();

    // If the code matches PREFIX + 4 digits
    if (itemCode.startsWith(prefix)) {
      const numPart = itemCode.slice(prefix.length);
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed) && parsed > 0) {
        usedNumbers.add(parsed);
      }
    } else if (item.group === groupName) {
      // If code in the same group has numeric suffix
      const match = itemCode.match(/(\d{1,4})$/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
          usedNumbers.add(parsed);
        }
      }
    }
  });

  // Find lowest positive integer not in usedNumbers
  let seq = 1;
  while (usedNumbers.has(seq)) {
    seq++;
  }

  return formatItemCode(prefix, seq);
}

/**
 * Checks if a code is unique within the catalog (case-insensitive).
 */
export function isCodeUnique(code: string, catalog: CatalogItem[], ignoreItemId?: string): boolean {
  const target = code.trim().toUpperCase();
  if (!target) return false;
  return !catalog.some(
    (item) => item.id !== ignoreItemId && item.code?.trim().toUpperCase() === target
  );
}

/**
 * Regenerates and renumbers all catalog item codes sequentially by group.
 * Code format: [5-LETTER GROUP PREFIX] + [4 DIGITS] (e.g. INSUM0001, INSUM0002, PERFI0001).
 * Items are ordered alphabetically within each group so the sequence is deterministic.
 */
export function regenerateAllCatalogCodes(catalog: CatalogItem[]): {
  updatedCatalog: CatalogItem[];
  totalUpdated: number;
} {
  // Group items by group name
  const itemsByGroup: { [group: string]: CatalogItem[] } = {};

  catalog.forEach((item) => {
    const grp = (item.group || 'INSUMOS GERAIS').trim();
    if (!itemsByGroup[grp]) {
      itemsByGroup[grp] = [];
    }
    itemsByGroup[grp].push({ ...item });
  });

  const updatedCatalog: CatalogItem[] = [];
  let totalUpdated = 0;

  // Process groups in alphabetical order
  const sortedGroupNames = Object.keys(itemsByGroup).sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  sortedGroupNames.forEach((groupName) => {
    const groupItems = itemsByGroup[groupName];
    const prefix = getGroupPrefix(groupName);

    // Sort items inside group alphabetically by description for clean deterministic ordering
    groupItems.sort((a, b) =>
      (a.description || '').localeCompare(b.description || '', 'pt-BR')
    );

    groupItems.forEach((item, index) => {
      const newCode = formatItemCode(prefix, index + 1);
      if (item.code !== newCode) {
        totalUpdated++;
      }
      item.code = newCode;
      updatedCatalog.push(item);
    });
  });

  return {
    updatedCatalog,
    totalUpdated,
  };
}
