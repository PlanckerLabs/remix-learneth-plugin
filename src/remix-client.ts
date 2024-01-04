import { PluginClient } from '@remixproject/plugin';
import { createClient } from '@remixproject/plugin-webview';
import { store } from './redux/store';

class RemixClient extends PluginClient {
  constructor() {
    super();
    createClient(this);
  }

  startTutorial(name: any, branch: any, dataId: any): void {
    console.log('start tutorial', name, branch, dataId);
    store.dispatch({
      type: 'remixide/startTutorial',
      payload: {
        name,
        branch,
        dataId,
      },
    });
  }

  addRepository(name: any, branch: any) {
    console.log('add repo', name, branch);
    store.dispatch({
      type: 'remixide/startTutorial',
      payload: {
        name,
        branch,
      },
    });
  }
}

export default new RemixClient();
