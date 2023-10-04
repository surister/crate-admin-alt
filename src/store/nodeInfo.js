// Store that keeps the node info from CrateDB instances.

import {defineStore} from "pinia";
import {reactive, toRefs} from "vue";
import {requestCrate} from "@/store/http/requests";
import queries from "@/store/http/queries";
import {CrateNodes} from "@/store/crate_api/node";

const REFRESH_EVERY_MS = 5000 // milliseconds

// We need the emptyNodeResult as a 'default' value when the initial requests to populate data
// hasn't yet been completed, will usually only be on screen for .1-.2 seconds.
// Ideally we would have some 'loading' https://vuetifyjs.com/en/components/skeleton-loaders/
// or some initial general loading screen (since it'd only appear for .1s-.2s it'd be fine)
// But honestly, it's way easier to just create an empty json, the return for the effort is
// the most optimal FOR NOW.
const emptyNodeResult = [
  "load",
  {
    "1": 'load',
    "15": 'load',
    "5": 'load',
    "probe_timestamp": 'load'
  }, {
    "disks": [{
      "available": 0,
      "used": 0,
      "dev": "load",
      "size": 0
    }],
    "data": [{"dev": "load", "path": "load"}],
    "total": {
      "bytes_written": 0,
      "size": 0,
      "available": 0,
      "reads": 0,
      "bytes_read": 0,
      "used": 0,
      "writes": 0
    }
  },
  {
    "used": 0,
    "free": 0,
    "max": 0,
    "probe_timestamp": 0
  }, "load"]

export const useNodeInfoStore = defineStore('nodeInfo',  () => {
  const state = reactive({
    nodes: new CrateNodes([emptyNodeResult,], 1),
    load1: 'nan',
    load5: 'nan',
    load15: 'nan',
    data: [],
    nodeCount: '0'
  })

  async function updateNodeInfo() {
    const _response = await requestCrate(queries.NODE_INFO)
    const nodeInfo = await _response.json()
    state.nodes = new CrateNodes(nodeInfo.rows, nodeInfo.rowcount)
  }

  // We update it non-asynchronously
  updateNodeInfo()
  setInterval(async () => {
    await updateNodeInfo()
  }, REFRESH_EVERY_MS);
  return {
    ...toRefs(state), updateNodeInfo
  }
})
