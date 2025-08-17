export class PageParser {
  constructor(totalPages) {
    this.totalPages = totalPages;
  }

  parse(pageSpec) {
    if (!pageSpec || typeof pageSpec !== 'string') {
      throw new Error('Invalid page specification');
    }

    const spec = pageSpec.trim();
    if (!spec) {
      throw new Error('Empty page specification');
    }

    const pages = new Set();
    const excludePages = new Set();
    const parts = spec.split(',').map(p => p.trim()).filter(p => p);

    for (const part of parts) {
      if (part.startsWith('!')) {
        const excludePart = part.substring(1);
        const excludeSet = this.parsePart(excludePart);
        excludeSet.forEach(page => excludePages.add(page));
      } else {
        const includeSet = this.parsePart(part);
        includeSet.forEach(page => pages.add(page));
      }
    }

    excludePages.forEach(page => pages.delete(page));

    const result = Array.from(pages).sort((a, b) => {
      const aIndex = this.getOriginalOrder(pageSpec, a);
      const bIndex = this.getOriginalOrder(pageSpec, b);
      return aIndex - bIndex;
    });

    if (result.length === 0) {
      throw new Error('No pages selected');
    }

    return result;
  }

  parsePart(part) {
    const pages = new Set();

    if (part === 'all') {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.add(i);
      }
    } else if (part === 'odd') {
      for (let i = 1; i <= this.totalPages; i += 2) {
        pages.add(i);
      }
    } else if (part === 'even') {
      for (let i = 2; i <= this.totalPages; i += 2) {
        pages.add(i);
      }
    } else if (part === 'first') {
      pages.add(1);
    } else if (part === 'last') {
      pages.add(this.totalPages);
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(p => parseInt(p.trim()));
      if (isNaN(start) || isNaN(end)) {
        throw new Error(`Invalid range: ${part}`);
      }
      if (start > end) {
        throw new Error(`Invalid range: start (${start}) is greater than end (${end})`);
      }
      for (let i = Math.max(1, start); i <= Math.min(this.totalPages, end); i++) {
        pages.add(i);
      }
    } else {
      const pageNum = parseInt(part);
      if (isNaN(pageNum)) {
        throw new Error(`Invalid page number: ${part}`);
      }
      if (pageNum >= 1 && pageNum <= this.totalPages) {
        pages.add(pageNum);
      }
    }

    return pages;
  }

  getOriginalOrder(pageSpec, pageNum) {
    const parts = pageSpec.split(',').map(p => p.trim()).filter(p => p && !p.startsWith('!'));
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const partPages = this.parsePart(part);
      if (partPages.has(pageNum)) {
        if (part.includes('-')) {
          const [start] = part.split('-').map(p => parseInt(p.trim()));
          return i * 10000 + (pageNum - start);
        } else if (['odd', 'even', 'all'].includes(part)) {
          return i * 10000 + pageNum;
        } else {
          return i * 10000;
        }
      }
    }
    
    return pageNum;
  }

  static getPresets(totalPages) {
    return {
      all: 'all',
      odd: 'odd',
      even: 'even',
      first10: totalPages >= 10 ? '1-10' : `1-${totalPages}`,
      excludeFirst: totalPages > 1 ? `2-${totalPages}` : '',
      excludeLast: totalPages > 1 ? `1-${totalPages - 1}` : '',
      middle: totalPages > 2 ? `2-${totalPages - 1}` : ''
    };
  }
}