import type { Document } from '../../domain/Document';
import { Numbers } from '../../domain/Numbers';
import { SvgNodeEmitter } from './SvgNodeEmitter';

/** Document -> SVG text, 2 space indent, one element per line. */
export class SvgWriter {
  write(document: Document): string {
    const width = Numbers.format(document.width);
    const height = Numbers.format(document.height);
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    ];
    const emitter = new SvgNodeEmitter(lines, 1);
    for (const child of document.root.children) {
      child.accept(emitter);
    }
    lines.push('</svg>');
    return `${lines.join('\n')}\n`;
  }
}
