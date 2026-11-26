import type {
  AttributeEdit,
  AttributeHandler,
} from '../../src/application/extension/AttributeHandler';
import { EditorError } from '../../src/domain/errors/EditorError';
import type { Shape } from '../../src/domain/Shape';
import { BoxShape } from './BoxShape';

/**
 * Domain semantics of `set` on a box.
 *
 * `fill` keeps the Phase 1 attribute name but means "the inner rectangle";
 * `label` is a new convenience attribute that the kernel whitelist never
 * learns about.  Both produce one reversible edit, so a single `set` is one
 * undo unit even though it may touch a different shape than the addressed one.
 */
export class BoxAttributeHandler implements AttributeHandler {
  readonly name = 'box-attributes';

  handles(shape: Shape, attr: string): boolean {
    return shape instanceof BoxShape && (attr === 'fill' || attr === 'label');
  }

  read(shape: Shape, attr: string): string | null {
    const box = shape as BoxShape;
    if (attr === 'fill') {
      return box.rectPart?.readAttribute('fill') ?? null;
    }
    return box.labelPart?.readAttribute('text') ?? null;
  }

  createEdit(shape: Shape, attr: string, value: string): AttributeEdit {
    const box = shape as BoxShape;
    if (attr === 'fill') {
      return BoxAttributeHandler.fillEdit(box, value);
    }
    return BoxAttributeHandler.labelEdit(box, value);
  }

  private static fillEdit(box: BoxShape, value: string): AttributeEdit {
    const rect = box.rectPart;
    if (rect === null) {
      throw new EditorError(`box ${box.id} has no <rect> part`);
    }
    const previous = rect.readAttribute('fill');
    return {
      apply: () => rect.setAttribute('fill', value),
      revert: () => {
        if (previous === null) {
          rect.removeAttribute('fill');
        } else {
          rect.setAttribute('fill', previous);
        }
      },
    };
  }

  private static labelEdit(box: BoxShape, value: string): AttributeEdit {
    const label = box.labelPart;
    if (label === null) {
      throw new EditorError(`box ${box.id} has no <text> part`);
    }
    const previous = label.readAttribute('text');
    if (previous === null) {
      throw new EditorError(`box ${box.id} label has no text`);
    }
    return {
      apply: () => label.setAttribute('text', value),
      revert: () => label.setAttribute('text', previous),
    };
  }
}
