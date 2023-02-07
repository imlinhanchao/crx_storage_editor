<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { isArray, isObject } from './utils/is';

const isDark = useDark()
useToggle(isDark)

const activeName = ref('local');
const storage = ref<any>({
  local: {} as any,
  session: {} as any,
});

window.addEventListener('message', (ev) => {
  let request = ev.data;
  if (request.from != '__devtools_storage_editor') return;
  switch(request.message) {
    case 'update':
      storage.value[request.type] = parseStorage(request.data);
      console.log('storage', storage.value)
      console.log('localTree', localTree.value)
      break;
  }
})

function parseStorage(s: any) {
  Object.keys(s).forEach(k => {
    s[k] = s[k] !== '' ? JSON.parse(s[k]) : '';
  })
  return s;
}

const localTree = computed(() => 
  Object.keys(storage.value.local).map(k => dataToTree(storage.value.local[k], k, 'local'))
)
const sessionTree = computed(() => 
  Object.keys(storage.value.local).map(k => dataToTree(storage.value.session[k], k, 'session'))
)
function dataToTree(data: any, key: string, path: string): any {
  if (isObject(data)) return { 
    key, type: 'Object', path, children: Object.keys(data).map(k => dataToTree(data[k], k, path + '.' + k)) 
  };
  else if (isArray(data)) return {
    key, type: 'Array', path, children: data.map((d, i) => dataToTree(d, i + '', path + '.' + i)) 
  }
  else return { key, path, data, children: [] } 
}
</script>

<template>
  <el-tabs
    v-model="activeName"
    type="card"
  >
    <el-tab-pane label="Local Storage" name="local">
      <el-tree
        :data="localTree"
        show-checkbox
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <b>{{ data.key }}</b> : 
            <span v-if="data.type">{{ data.type }}</span> 
            <span v-if="data.data">{{ data.data }}</span>
          </span>
        </template>
      </el-tree>
    </el-tab-pane>
    <el-tab-pane label="Session Storage" name="session">
      
    </el-tab-pane>
  </el-tabs>
</template>

<style>
body {
  background-color: var(--el-bg-color);
}
</style>
