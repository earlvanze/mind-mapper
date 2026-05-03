import type { Node } from '../store/useMindMapStore';
import {
  type KanbanBoard,
  type KanbanCard,
  type KanbanTransformTemplate,
  transformKanbanToMindMap,
} from './kanbanTransforms.js';

interface TrelloList {
  id: string;
  name: string;
  closed?: boolean;
}

interface TrelloLabel {
  name?: string;
  color?: string;
}

interface TrelloCard {
  id: string;
  name: string;
  idList: string;
  labels?: TrelloLabel[];
  desc?: string;
  due?: string | null;
  url?: string;
  closed?: boolean;
}

interface TrelloExport {
  id?: string;
  name?: string;
  lists: TrelloList[];
  cards: TrelloCard[];
}

function assertTrelloExport(value: unknown): asserts value is TrelloExport {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid Trello JSON: expected an object');
  }

  const maybe = value as Partial<TrelloExport>;
  if (!Array.isArray(maybe.lists) || !Array.isArray(maybe.cards)) {
    throw new Error('Invalid Trello JSON: expected lists and cards arrays');
  }
}

function labelName(label: TrelloLabel): string | undefined {
  const name = label.name?.trim();
  if (name) return name;
  return label.color?.trim();
}

export function parseTrelloBoard(input: string | unknown): KanbanBoard {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  assertTrelloExport(parsed);

  const lists = parsed.lists.filter(list => !list.closed);
  const listNames = new Map(lists.map(list => [list.id, list.name]));
  const cardsByList = new Map<string, KanbanCard[]>();

  for (const list of lists) {
    cardsByList.set(list.id, []);
  }

  for (const card of parsed.cards) {
    if (card.closed || !listNames.has(card.idList)) continue;

    cardsByList.get(card.idList)!.push({
      id: card.id,
      title: card.name || 'Untitled card',
      status: listNames.get(card.idList)!,
      labels: (card.labels ?? []).map(labelName).filter((label): label is string => !!label),
      ...(card.desc ? { description: card.desc } : {}),
      ...(card.due ? { due: card.due } : {}),
      ...(card.url ? { url: card.url } : {}),
    });
  }

  return {
    ...(parsed.id ? { id: parsed.id } : {}),
    name: parsed.name || 'Trello Board',
    columns: lists.map(list => ({
      id: list.id,
      name: list.name,
      cards: cardsByList.get(list.id) ?? [],
    })),
  };
}

export function parseTrello(
  input: string | unknown,
  template: KanbanTransformTemplate = 'by-status',
): Record<string, Node> {
  return transformKanbanToMindMap(parseTrelloBoard(input), template);
}

export function isTrelloJsonContent(content: string): boolean {
  try {
    const parsed = JSON.parse(content);
    assertTrelloExport(parsed);
    return parsed.lists.every(list => typeof list.id === 'string' && typeof list.name === 'string') &&
      parsed.cards.every(card => typeof card.id === 'string' && typeof card.name === 'string' && typeof card.idList === 'string');
  } catch {
    return false;
  }
}
