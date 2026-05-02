import { Node } from '../store/useMindMapStore';

export function sampleMap() {
  const nodes: Record<string, Node> = {
    n_root: { 
      id: 'n_root', 
      text: 'Mind Mapp', 
      x: 320, 
      y: 180, 
      parentId: null, 
      children: ['n_1', 'n_2', 'n_3'],
      tags: ['project']
    },
    n_1: { 
      id: 'n_1', 
      text: 'Ideas', 
      x: 520, 
      y: 100, 
      parentId: 'n_root', 
      children: ['n_4'],
      tags: ['brainstorm']
    },
    n_2: { 
      id: 'n_2', 
      text: 'Tasks', 
      x: 520, 
      y: 180, 
      parentId: 'n_root', 
      children: ['n_5', 'n_6'],
      tags: ['work']
    },
    n_3: { 
      id: 'n_3', 
      text: 'Notes', 
      x: 520, 
      y: 260, 
      parentId: 'n_root', 
      children: [],
      tags: ['reference']
    },
    n_4: { 
      id: 'n_4', 
      text: 'Research', 
      x: 720, 
      y: 100, 
      parentId: 'n_1', 
      children: [],
      tags: ['brainstorm', 'high-priority']
    },
    n_5: { 
      id: 'n_5', 
      text: 'Build MVP', 
      x: 720, 
      y: 160, 
      parentId: 'n_2', 
      children: [],
      tags: ['work', 'dev', 'high-priority']
    },
    n_6: { 
      id: 'n_6', 
      text: 'Ship', 
      x: 720, 
      y: 220, 
      parentId: 'n_2', 
      children: [],
      tags: ['work', 'release']
    }
  };
  return nodes;
}
