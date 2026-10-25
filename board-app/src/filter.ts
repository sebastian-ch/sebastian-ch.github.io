export function cardMatches(searchText: string, tags: string[], query: string, tag: string): boolean {
  return (tag === 'all' || tags.includes(tag)) && searchText.toLowerCase().includes(query.trim().toLowerCase());
}
