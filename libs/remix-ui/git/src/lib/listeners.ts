
import { ViewPlugin } from "@remixproject/engine-web";
import React from "react";
import { setCanUseApp, setLoading, setRepoName, setGItHubToken, setLog } from "../state/gitpayload";
import { gitActionDispatch } from "../types";
import { currentBranch, diffFiles, getBranches, getFileStatusMatrix, getGitHubUser, getRemotes, gitlog, setPlugin, showCurrentBranch } from "./gitactions";

let plugin: ViewPlugin, gitDispatch: React.Dispatch<gitActionDispatch>, loaderDispatch: React.Dispatch<any>, loadFileQueue: AsyncDebouncedQueue
let callBackEnabled: boolean = false
let syncTimer: NodeJS.Timer = null

type AsyncCallback = () => Promise<void>;

class AsyncDebouncedQueue {
  private queues: Map<AsyncCallback, { timer: any, lastCall: number }>;

  constructor(private delay: number = 300) {
    this.queues = new Map();
  }

  enqueue(callback: AsyncCallback, customDelay?: number): void {
    if (this.queues.has(callback)) {
      clearTimeout(this.queues.get(callback)!.timer);
    }

    let timer = setTimeout(async () => {
      await callback();  // Await the asynchronous operation
      this.queues.delete(callback);
    }, customDelay || this.delay);

    this.queues.set(callback, { timer, lastCall: Date.now() });
  }
}



export const setCallBacks = (viewPlugin: ViewPlugin, gitDispatcher: React.Dispatch<gitActionDispatch>, loaderDispatcher: React.Dispatch<any>) => {
  plugin = viewPlugin
  gitDispatch = gitDispatcher
  loaderDispatch = loaderDispatcher
  loadFileQueue = new AsyncDebouncedQueue()

  setPlugin(viewPlugin, gitDispatcher)

  plugin.on("fileManager", "fileSaved", async (file: string) => {
    console.log(file)
    loadFileQueue.enqueue(async () => {
      await loadFiles()
    }, 10)
  });

  plugin.on('dGitProvider', 'branch' as any, async () => {
    //await synTimerStart();
  })

  plugin.on("fileManager", "fileAdded", async (e) => {
    loadFileQueue.enqueue(async () => {
      await loadFiles()
    }, 10)
  });

  plugin.on("fileManager", "fileRemoved", async (e) => {
    //await synTimerStart();
  });

  plugin.on("fileManager", "currentFileChanged", async (e) => {
    console.log('current file change', e)
    //await synTimerStart();
  });

  plugin.on("fileManager", "fileRenamed", async (oldfile, newfile) => {
    //await synTimerStart();
  });

  plugin.on("filePanel", "setWorkspace", async (x: any) => {
    loadFileQueue.enqueue(async () => {
      await loadFiles()
    }, 10)
    loadFileQueue.enqueue(async () => {
      await gitlog()
    })
    loadFileQueue.enqueue(async () => {
      await getBranches()
    })
    loadFileQueue.enqueue(async () => {
      await getRemotes()
    })
  });

  plugin.on("filePanel", "deleteWorkspace" as any, async (x: any) => {
    //await synTimerStart();
  });

  plugin.on("filePanel", "renameWorkspace" as any, async (x: any) => {
    //await synTimerStart();
  });

  plugin.on('dGitProvider', 'checkout', async () => {
    loadFileQueue.enqueue(async () => {
      await loadFiles()
    }, 10)
    loadFileQueue.enqueue(async () => {
      await getBranches()
    }, 10)
    loadFileQueue.enqueue(async () => {
      await showCurrentBranch()
    }, 10)
    loadFileQueue.enqueue(async () => {
      await gitlog()
    })
  })
  plugin.on('dGitProvider', 'init', async () => {

  })
  plugin.on('dGitProvider', 'add', async () => {
    loadFileQueue.enqueue(async () => {
      await loadFiles()
    }, 10)
  })
  plugin.on('dGitProvider', 'rm', async () => {
    loadFileQueue.enqueue(async () => {
      await loadFiles()
    }, 10)
  })
  plugin.on('dGitProvider', 'commit', async () => {
    loadFileQueue.enqueue(async () => {
      gitlog()
    }, 10)
    gitDispatch(setLog({
      message: 'Committed changes...',
      type: 'success'
    }))
  })
  plugin.on('dGitProvider', 'branch', async () => {
    gitDispatch(setLog({
      message: "Created Branch",
      type: "success"
    }))
  })
  plugin.on('dGitProvider', 'clone', async () => {
    gitDispatch(setLog({
      message: "Cloned Repository",
      type: "success"
    }))
    loadFileQueue.enqueue(async () => {
      await loadFiles()
    }, 10)
  })
  plugin.on('manager', 'pluginActivated', async (p: Plugin) => {
    if (p.name === 'dGitProvider') {
      getGitHubUser();
      plugin.off('manager', 'pluginActivated');
    }
  })

  plugin.on('config', 'configChanged', async () => {
    await getGitConfig()
  })
  plugin.on('settings', 'configChanged', async () => {
    await getGitConfig()
  })

  callBackEnabled = true;
}

export const getGitConfig = async () => {
  const username = await plugin.call('settings', 'get', 'settings/github-user-name')
  const email = await plugin.call('settings', 'get', 'settings/github-email')
  const token = await plugin.call('settings', 'get', 'settings/gist-access-token')
  const config = { username, email, token }
  gitDispatch(setGItHubToken(config.token))
  return config
}

const syncFromWorkspace = async (callback: Function, isLocalhost = false) => {
  //gitDispatch(setLoading(true));
  await disableCallBacks();
  if (isLocalhost) {
    gitDispatch(setCanUseApp(false));
    gitDispatch(setLoading(false));
    await enableCallBacks();
    return;
  }
  try {
    const workspace = await plugin.call(
      "filePanel",
      "getCurrentWorkspace"
    );
    if (workspace.isLocalhost) {
      gitDispatch(setCanUseApp(false));
      await enableCallBacks();
      return
    }

    gitDispatch(setRepoName(workspace.name));
    gitDispatch(setCanUseApp(true));
  } catch (e) {
    gitDispatch(setCanUseApp(false));
  }
  await callback();
  await enableCallBacks();
}

export const loadFiles = async (filepaths: string[] = null) => {
  try {
    await getFileStatusMatrix(filepaths);
  } catch (e) {
    // TODO: handle error
    console.error(e);
  }
}

const getStorageUsed = async () => {
  try {
    const storageUsed = await plugin.call("storage" as any, "getStorage" as any);
  } catch (e) {
    const storage: string = await plugin.call("dGitProvider", "localStorageUsed" as any);
    const storageUsed = {
      usage: parseFloat(storage) * 1000,
      quota: 10000000,
    };
  }
}

export const disableCallBacks = async () => {
  callBackEnabled = false;
}
export const enableCallBacks = async () => {
  callBackEnabled = true;
}

