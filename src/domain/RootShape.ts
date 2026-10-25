import { GroupShape } from './GroupShape';

/**
 * The document root (`<svg>`).
 *
 * It is a container so that "root level" and "inside a group" share one
 * insertion algorithm, but it is not addressable: `Document` keeps it out of
 * the id index, so `delete svg` answers `no such shape: svg` and the id
 * `svg` stays reserved.
 */
export class RootShape extends GroupShape {
  override readonly typeName = 'svg';

  constructor() {
    super('svg');
  }

  override label(): string {
    return 'svg';
  }
}
