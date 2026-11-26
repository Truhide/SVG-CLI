import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LineIndex,
  SvgOutlineNode,
  SvgOutlineParser,
  decodeEntities,
  svgOutlineLabel,
} from '../src/SvgOutlineParser';

const EXAMPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <g id="flowchart">
    <rect id="start" x="20" y="20" width="120" height="60" fill="#4a90d9"/>
    <text x="40" y="60">开始</text>
    <g id="inner">
      <circle id="dot" cx="200" cy="50" r="10"/>
    </g>
  </g>
</svg>
`;

/** Depth first labels, e.g. `svg > g#flowchart > rect#start`. */
function paths(nodes: readonly SvgOutlineNode[], prefix = ''): string[] {
  const result: string[] = [];
  for (const node of nodes) {
    const path = prefix === '' ? node.label : `${prefix} > ${node.label}`;
    result.push(path);
    result.push(...paths(node.children, path));
  }
  return result;
}

function find(nodes: readonly SvgOutlineNode[], label: string): SvgOutlineNode | undefined {
  for (const node of nodes) {
    if (node.label === label) {
      return node;
    }
    const nested = find(node.children, label);
    if (nested !== undefined) {
      return nested;
    }
  }
  return undefined;
}

test('嵌套分组: example.svg produces the expected hierarchy', () => {
  const tree = SvgOutlineParser.parse(EXAMPLE_SVG);
  assert.equal(tree.length, 1, 'exactly one root element');

  const root = tree[0];
  assert.equal(root.tagName, 'svg');
  assert.equal(root.children.length, 1);

  const group = root.children[0];
  assert.equal(group.label, 'g#flowchart');
  assert.deepEqual(
    group.children.map((child) => child.label),
    ['rect#start', 'text', 'g#inner'],
  );

  const inner = group.children[2];
  assert.deepEqual(
    inner.children.map((child) => child.label),
    ['circle#dot'],
  );

  assert.deepEqual(paths(tree), [
    'svg',
    'svg > g#flowchart',
    'svg > g#flowchart > rect#start',
    'svg > g#flowchart > text',
    'svg > g#flowchart > g#inner',
    'svg > g#flowchart > g#inner > circle#dot',
  ]);
});

test('无 id 元素: label stays the bare tag name, id is undefined', () => {
  const tree = SvgOutlineParser.parse(EXAMPLE_SVG);
  const text = find(tree, 'text');
  assert.ok(text !== undefined);
  assert.equal(text.tagName, 'text');
  assert.equal(text.id, undefined);
  assert.equal(text.label.includes('#'), false);
});

test('标签名#id: id attribute is picked up, decoded and rendered', () => {
  assert.equal(svgOutlineLabel('rect', 'start'), 'rect#start');
  assert.equal(svgOutlineLabel('rect', undefined), 'rect');
  assert.equal(svgOutlineLabel('rect', ''), 'rect');
  assert.equal(decodeEntities('a&amp;b'), 'a&b');
  assert.equal(decodeEntities('a&#65;b'), 'aAb');

  const tree = SvgOutlineParser.parse('<svg><rect id="a&amp;b"/></svg>');
  assert.equal(tree[0].children[0].id, 'a&b');
  assert.equal(tree[0].children[0].label, 'rect#a&b');
});

test('源码定位: element range and tag-name selectionRange stay in sync', () => {
  const tree = SvgOutlineParser.parse(EXAMPLE_SVG);
  const rect = find(tree, 'rect#start');
  assert.ok(rect !== undefined);

  // selectionRange covers exactly the tag name.
  assert.equal(EXAMPLE_SVG.slice(rect.nameStart, rect.nameEnd), 'rect');
  // range covers the whole element, including the `<` and the closing `/>`.
  assert.equal(EXAMPLE_SVG.slice(rect.start, rect.start + 1), '<');
  assert.equal(EXAMPLE_SVG.slice(rect.start, rect.end), '<rect id="start" x="20" y="20" width="120" height="60" fill="#4a90d9"/>');
  // the tag name sits directly after `<`.
  assert.equal(rect.nameStart, rect.start + 1);

  const index = new LineIndex(EXAMPLE_SVG);
  assert.deepEqual(index.positionAt(rect.nameStart), { line: 2, character: 5 });
  // `<circle .../>` is on line 5 and is 42 characters long after 6 spaces.
  assert.deepEqual(index.positionAt(find(tree, 'circle#dot')!.end), { line: 5, character: 48 });
  // `\r\n` counts as one line break, exactly like VSCode's Position model.
  assert.deepEqual(new LineIndex('a\r\nb\r\nc').positionAt(6), { line: 2, character: 0 });
});

test('编辑后重新解析: the outline follows inserted / renamed / removed elements', () => {
  const before = SvgOutlineParser.parse(EXAMPLE_SVG);
  assert.equal(find(before, 'circle#dot') !== undefined, true);
  assert.equal(find(before, 'polygon#tri') !== undefined, false);

  const edited = EXAMPLE_SVG.replace('<g id="inner">', '<g id="inner" data-step="2">').replace(
    '<circle id="dot" cx="200" cy="50" r="10"/>',
    '<polygon id="tri" points="0,0 10,0 5,10"/>',
  );
  const after = SvgOutlineParser.parse(edited);

  assert.equal(find(after, 'circle#dot'), undefined, 'removed element disappears');
  assert.ok(find(after, 'polygon#tri') !== undefined, 'renamed element appears');
  // labels of untouched siblings are unchanged, offsets are not.
  assert.deepEqual(
    after[0].children[0].children.map((child) => child.label),
    ['rect#start', 'text', 'g#inner'],
  );
  assert.equal(
    find(after, 'rect#start')!.start,
    find(before, 'rect#start')!.start,
    'elements before the edit keep their offsets',
  );

  // inserting an element shifts every following element right.
  const inserted = EXAMPLE_SVG.replace(
    '<text x="40" y="60">',
    '<rect id="mid" x="0" y="0" width="1" height="1"/>\n    <text x="40" y="60">',
  );
  const shifted = SvgOutlineParser.parse(inserted);
  assert.ok(find(shifted, 'rect#mid') !== undefined);
  assert.ok(
    find(shifted, 'text')!.start > find(before, 'text')!.start,
    'a longer prefix shifted the following offsets',
  );
  assert.equal(inserted.slice(find(shifted, 'text')!.nameStart, find(shifted, 'text')!.nameEnd), 'text');
});

test('不完整 XML: partial input yields a prefix of the tree and never throws', () => {
  const truncated = '<svg xmlns="http://www.w3.org/2000/svg"><g id="a"><rect id="b"';
  const tree = SvgOutlineParser.parse(truncated);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].label, 'svg');
  assert.equal(tree[0].children[0].label, 'g#a');
  assert.equal(tree[0].children[0].children[0].label, 'rect#b');
  // unclosed elements simply extend to the end of the document.
  assert.equal(tree[0].children[0].children[0].end, truncated.length);

  assert.deepEqual(SvgOutlineParser.parse(''), []);
  assert.deepEqual(SvgOutlineParser.parse('not xml at all'), []);
  assert.deepEqual(SvgOutlineParser.parse('<'), []);
  assert.deepEqual(SvgOutlineParser.parse('<>'), []);
  assert.deepEqual(SvgOutlineParser.parse('<svg><g id="x"'), [
    {
      tagName: 'svg',
      id: undefined,
      label: 'svg',
      start: 0,
      nameStart: 1,
      nameEnd: 4,
      end: '<svg><g id="x"'.length,
      children: [
        {
          tagName: 'g',
          id: 'x',
          label: 'g#x',
          start: 5,
          nameStart: 6,
          nameEnd: 7,
          end: '<svg><g id="x"'.length,
          children: [],
        },
      ],
    },
  ]);
});

test('容错: stray and mismatched end tags never throw and close sensibly', () => {
  const tree = SvgOutlineParser.parse('<svg><g id="a"></g></svg></svg><rect/>');
  assert.deepEqual(paths(tree), ['svg', 'svg > g#a', 'rect']);

  const mismatched = '<svg><g id="a"><rect id="b"></g></svg>';
  const inner = SvgOutlineParser.parse(mismatched);
  // `rect` is closed implicitly where `</g>` appears.
  assert.equal(inner[0].children[0].children[0].end, mismatched.indexOf('</g>'));
});

test('容错: `>` and quotes inside attribute values do not end the tag', () => {
  const source = '<svg data-note="a > b" data-alt=\'say "hi"\'><rect id="r" data-js="if (a<b)" /></svg>';
  const tree = SvgOutlineParser.parse(source);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].children.length, 1);

  const rect = tree[0].children[0];
  assert.equal(rect.label, 'rect#r');
  assert.equal(source.slice(rect.start, rect.end), '<rect id="r" data-js="if (a<b)" />');
  // the outer element still ends after its own closing tag, not at the `>` inside an attribute.
  assert.equal(source.slice(tree[0].start, tree[0].end), source);

  // an unterminated quoted value degrades to "rest of the document", no throw.
  const broken = SvgOutlineParser.parse('<svg><rect id="r" data-x="unterminated');
  assert.equal(broken.length, 1);
  assert.equal(broken[0].children[0].label, 'rect#r');
});

test('容错: comments, CDATA, prolog and DOCTYPE are not elements', () => {
  const source = [
    '<?xml version="1.0"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [',
    '  <!ENTITY foo "bar">',
    ']>',
    '<svg><!-- <g id="ghost"> --><text><![CDATA[ <g id="cdata-ghost"> ]]></text></svg>',
  ].join('\n');
  const tree = SvgOutlineParser.parse(source);
  assert.deepEqual(paths(tree), ['svg', 'svg > text']);
});

test('鲁棒性: pathological inputs never throw', () => {
  const cases = [
    '',
    '<',
    '</',
    '<!',
    '<!--',
    '<![CDATA[',
    '<svg',
    '<svg/',
    '<svg>',
    '<svg></svg></svg></svg>',
    '<svg><g><g><g><g id="deep"></svg>',
    '<svg a=>\n<g b="c>',
    '<svg><![CDATA[ <g> ]]></svg>',
    '<?xml?>',
    '<svg><g id="a"id="b">text</g></svg>',
    '</svg>',
    '<svg>\u0000<g/></svg>',
    '<svg><g id="x"/></svg><svg><g id="y"/></svg>',
    '< a',
    '<svg><g id="未闭合">',
  ];
  for (const source of cases) {
    assert.doesNotThrow(() => SvgOutlineParser.parse(source), `input: ${JSON.stringify(source)}`);
  }
  // multiple roots are kept, in document order
  assert.deepEqual(paths(SvgOutlineParser.parse('<svg><g id="x"/></svg><svg><g id="y"/></svg>')), [
    'svg',
    'svg > g#x',
    'svg',
    'svg > g#y',
  ]);
});

test('offsets: every node range is inside the document and ordered', () => {
  const tree = SvgOutlineParser.parse(EXAMPLE_SVG);
  const walk = (nodes: readonly SvgOutlineNode[]): void => {
    for (const node of nodes) {
      assert.ok(node.start >= 0 && node.end <= EXAMPLE_SVG.length);
      assert.ok(node.start < node.nameStart && node.nameStart <= node.nameEnd && node.nameEnd <= node.end);
      for (const child of node.children) {
        assert.ok(child.start >= node.start && child.end <= node.end, 'child range inside parent');
      }
      walk(node.children);
    }
  };
  walk(tree);
});
