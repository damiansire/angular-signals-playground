import {
  isTag,
  spliteInTags,
  HtmlHelper,
  HtmlIdGeneratorService,
  generateLinks,
  generateNodes,
} from './code-parser'; // Ajusta la ruta si es necesario

describe('isTag', () => {
  // Definición de objetos para los casos de prueba
  const validTagCases = [
    { tag: '<h1>', description: 'Failed for opening h1 tag' },
    { tag: '</h1>', description: 'Failed for closing h1 tag' },
    { tag: '<div>', description: 'Failed for opening div tag' },
    { tag: '<span>', description: 'Failed for opening span tag' },
    { tag: '</span>', description: 'Failed for closing span tag' },
    { tag: '<img />', description: 'Failed for self-closing img tag' },
    { tag: '<input>', description: 'Failed for input tag' },
    { tag: '<my-custom-element>', description: 'Failed for custom element' },
    {
      tag: '<my-element-with-dash>',
      description: 'Failed for element with dash',
    },
    {
      tag: '<div >',
      description: 'Failed for tag with space before closing bracket',
    },
    {
      tag: '</div  >',
      description: 'Failed for closing tag with extra spaces',
    },
  ];

  const invalidTagCases = [
    { tag: '<1h1>', description: 'Failed for tag starting with number' },
    { tag: '< h1>', description: 'Failed for tag with leading space' },
    { tag: '<>', description: 'Failed for empty tag' },
    { tag: '<div', description: 'Failed for unclosed div tag' },
    { tag: 'div>', description: 'Failed for tag without opening bracket' },
    { tag: '</div', description: 'Failed for closing tag without opening' },
    { tag: '<di$v>', description: 'Failed for tag with invalid characters' },
    {
      tag: '</di$v>',
      description: 'Failed for closing tag with invalid characters',
    },
  ];

  const tagsWithAttributes = [
    {
      tag: '<div id="myDiv">',
      description: 'Failed for div with id attribute',
    },
    {
      tag: '<img src="image.jpg" alt="Image">',
      description: 'Failed for img with src and alt attributes',
    },
    {
      tag: '<custom-element data-info="value">',
      description: 'Failed for custom element with data attribute',
    },
    {
      tag: '<button class="btn btn-primary" disabled>',
      description:
        'Failed for button with multiple attributes and text content',
    },
    {
      tag: '<button (click)="increment()">',
      description: 'Failed for angular example - click event with funciton',
    },
  ];

  const caseInsensitiveTags = [
    { tag: '<DIV>', description: 'Failed for uppercase opening DIV tag' },
    { tag: '</DIV>', description: 'Failed for uppercase closing DIV tag' },
  ];

  // Pruebas utilizando los objetos
  it('should identify valid HTML tags', () => {
    validTagCases.forEach((testCase) => {
      expect(isTag(testCase.tag)).withContext(testCase.description).toBeTrue();
    });
  });

  it('should identify invalid HTML tags', () => {
    invalidTagCases.forEach((testCase) => {
      expect(isTag(testCase.tag)).withContext(testCase.description).toBeFalse();
    });
  });

  it('should handle tags with attributes', () => {
    tagsWithAttributes.forEach((testCase) => {
      expect(isTag(testCase.tag)).withContext(testCase.description).toBeTrue();
    });
  });

  it('should be case-insensitive', () => {
    caseInsensitiveTags.forEach((testCase) => {
      expect(isTag(testCase.tag)).withContext(testCase.description).toBeTrue();
    });
  });

  it('should handle empty strings', () => {
    expect(isTag('')).withContext('Failed for empty string').toBeFalse();
  });
});

describe('spliteInTags', () => {
  // Casos de prueba
  it('should split a simple HTML string into tags and content', () => {
    const htmlString = '<div><p>Hello</p></div>';
    const expectedResult = ['<div>', '<p>', 'Hello', '</p>', '</div>'];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should handle self-closing tags', () => {
    const htmlString = '<div><img src="image.jpg" /></div>';
    const expectedResult = ['<div>', '<img src="image.jpg" />', '</div>'];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should handle tags with attributes', () => {
    const htmlString =
      '<div class="container"><p id="my-paragraph">Content</p></div>';
    const expectedResult = [
      '<div class="container">',
      '<p id="my-paragraph">',
      'Content',
      '</p>',
      '</div>',
    ];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should handle nested tags', () => {
    const htmlString =
      '<div><p>Hello <b>world</b>!</p><span> hello word2 </span></div>';
    const expectedResult = [
      '<div>',
      '<p>',
      'Hello',
      '<b>',
      'world',
      '</b>',
      '!',
      '</p>',
      '<span>',
      'hello word2',
      '</span>',
      '</div>',
    ];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should ignore whitespace around tags', () => {
    const htmlString = '  <div>  \n\t<p>Text</p>  </div>  ';
    const expectedResult = ['<div>', '<p>', 'Text', '</p>', '</div>'];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should handle empty tags', () => {
    const htmlString = '<div></div><br /><hr />';
    const expectedResult = ['<div>', '</div>', '<br />', '<hr />'];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should handle tags with forward slashes in attributes', () => {
    const htmlString = '<img src="/images/logo.png" alt="Logo" />';
    const expectedResult = ['<img src="/images/logo.png" alt="Logo" />'];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should handle CDATA sections', () => {
    const htmlString = '<div><![CDATA[This is CDATA content]]></div>';
    const expectedResult = [
      '<div>',
      '<![CDATA[This is CDATA content]]>',
      '</div>',
    ];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });

  it('should return an empty array for an empty string', () => {
    expect(spliteInTags('')).toEqual([]);
  });

  it('return the string for a string', () => {
    expect(spliteInTags('This is just plain text')).toEqual([
      'This is just plain text',
    ]);
  });

  it('should split angular tags', () => {
    const htmlString = '<button (click)="increment()"> Increment </button>';
    const expectedResult = [
      '<button (click)="increment()">',
      ' Increment ',
      '</button>',
    ];

    expect(spliteInTags(htmlString)).toEqual(expectedResult);
  });
});

describe('HtmlHelper', () => {
  describe('getTagFromId', () => {
    it('returns the tag name before the first dash', () => {
      expect(HtmlHelper.getTagFromId('div-1')).toBe('div');
      expect(HtmlHelper.getTagFromId('span-closed-2')).toBe('span');
      expect(HtmlHelper.getTagFromId('space-3')).toBe('space');
    });
  });

  describe('isSpaceElement', () => {
    it('matches only space-<number> ids', () => {
      expect(HtmlHelper.isSpaceElement('space-1')).toBeTrue();
      expect(HtmlHelper.isSpaceElement('space-42')).toBeTrue();
    });

    it('rejects non-space ids', () => {
      expect(HtmlHelper.isSpaceElement('div-1')).toBeFalse();
      expect(HtmlHelper.isSpaceElement('space')).toBeFalse();
      expect(HtmlHelper.isSpaceElement('space-')).toBeFalse();
      expect(HtmlHelper.isSpaceElement('space-1-2')).toBeFalse();
    });
  });

  describe('getElementType', () => {
    it('detects an opening tag (lowercased element, not closing)', () => {
      expect(HtmlHelper.getElementType('<DIV class="x">')).toEqual({
        element: 'div',
        isClosingTag: false,
      });
    });

    it('detects a closing tag', () => {
      expect(HtmlHelper.getElementType('</span>')).toEqual({
        element: 'span',
        isClosingTag: true,
      });
    });

    it('classifies an empty string as a space element', () => {
      expect(HtmlHelper.getElementType('   ')).toEqual({
        element: 'space',
        isClosingTag: false,
      });
    });

    it('classifies plain content as text', () => {
      expect(HtmlHelper.getElementType('Hello world')).toEqual({
        element: 'text',
        isClosingTag: false,
      });
    });
  });
});

describe('HtmlIdGeneratorService', () => {
  it('generates incremental ids per opening tag name', () => {
    const gen = new HtmlIdGeneratorService();
    expect(gen.generateId('<div>')).toBe('div-1');
    expect(gen.generateId('<div>')).toBe('div-2');
    expect(gen.generateId('<span>')).toBe('span-1');
    expect(gen.generateId('<div>')).toBe('div-3');
  });

  it('uses a separate counter for closing tags', () => {
    const gen = new HtmlIdGeneratorService();
    expect(gen.generateId('<div>')).toBe('div-1');
    expect(gen.generateId('</div>')).toBe('div-closed-1');
    expect(gen.generateId('</div>')).toBe('div-closed-2');
  });

  it('produces stable ids for the same input sequence across instances', () => {
    const a = new HtmlIdGeneratorService();
    const b = new HtmlIdGeneratorService();
    const seq = ['<ul>', '<li>', '</li>', '<li>', '</li>', '</ul>'];
    expect(seq.map((t) => a.generateId(t))).toEqual(
      seq.map((t) => b.generateId(t)),
    );
  });
});

describe('generateLinks', () => {
  it('returns no links for a single root element', () => {
    expect(generateLinks('<div></div>')).toEqual([]);
  });

  it('links a parent to its direct child', () => {
    const links = generateLinks('<div><p></p></div>');
    expect(links).toEqual([{ source: 'div-1', target: 'p-1' }]);
  });

  it('builds parent/child links following the tag stack on nesting', () => {
    const html = '<div><p></p><span></span></div>';
    const links = generateLinks(html);
    expect(links).toEqual([
      { source: 'div-1', target: 'p-1' },
      { source: 'div-1', target: 'span-1' },
    ]);
  });

  it('handles deeper nesting (grandchildren link to their parent)', () => {
    const html = '<ul><li><a></a></li></ul>';
    const links = generateLinks(html);
    expect(links).toEqual([
      { source: 'ul-1', target: 'li-1' },
      { source: 'li-1', target: 'a-1' },
    ]);
  });
});

describe('generateNodes', () => {
  it('creates one node per opening tag with its nesting level', () => {
    const nodes = generateNodes('<div><p></p></div>');
    expect(nodes.length).toBe(2);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    expect(byId.get('div-1')?.level).toBe(1);
    expect(byId.get('p-1')?.level).toBe(2);
  });

  it('ignores closing tags and text when counting nodes', () => {
    const nodes = generateNodes('<div><p>Hello</p></div>');
    expect(nodes.map((n) => n.id)).toEqual(['div-1', 'p-1']);
  });

  it('keeps a single sibling centered (x = 0)', () => {
    const nodes = generateNodes('<div><p></p></div>');
    const p = nodes.find((n) => n.id === 'p-1');
    expect(p?.x).toBe(0);
  });

  it('spreads two siblings on the same level to opposite sides', () => {
    const nodes = generateNodes('<div><p></p><span></span></div>');
    const xs = nodes
      .filter((n) => n.level === 2)
      .map((n) => n.x)
      .sort((a, b) => a - b);
    expect(xs).toEqual([-100, 100]);
  });

  it('assigns y growing with the nesting depth', () => {
    const nodes = generateNodes('<div><p></p></div>');
    const div = nodes.find((n) => n.id === 'div-1')!;
    const p = nodes.find((n) => n.id === 'p-1')!;
    expect(p.y).toBeGreaterThan(div.y);
  });
});
