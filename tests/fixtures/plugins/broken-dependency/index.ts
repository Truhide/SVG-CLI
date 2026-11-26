// The module exists, but evaluating it fails: this must be reported as a load
// failure, not as "plugin not found".
import { missing } from './module-that-does-not-exist';

export default {
  name: '@fixture/plugin-broken-dependency',
  activate: (): void => {
    void missing;
  },
};
