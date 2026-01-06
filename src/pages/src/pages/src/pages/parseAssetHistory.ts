export interface AssetHistoryRecord {
  createdDate: string;
  assetName: string;
  assetCode: string;
  oldValue: string;
  newValue: string;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getUniqueAssets(records: AssetHistoryRecord[]): string[] {
  const assets = new Set<string>();
  records.forEach((record) => {
    if (record.assetName) {
      assets.add(record.assetName);
    }
  });
  return Array.from(assets).sort();
}

export function getUniqueUsers(records: AssetHistoryRecord[]): string[] {
  const users = new Set<string>();
  records.forEach((record) => {
    if (record.oldValue) users.add(record.oldValue);
    if (record.newValue) users.add(record.newValue);
  });
  return Array.from(users).sort();
}
