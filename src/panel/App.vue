<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { isArray, isBoolean, isNull, isNumber, isObject, isString, isUnDef } from './utils/is';

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
      break;
  }
})

function parseStorage(s: any) {
  Object.keys(s).forEach(k => {
    try {
      let data = JSON.parse(s[k]);
      if (!isString(data)) s[k] = data;
    } catch (error) {}
  })
  return s;
}

const localTree = computed(() => 
  Object.keys(storage.value.local).map(k => dataToTree(storage.value.local[k], k, 'local'))
)
const sessionTree = computed(() => 
  Object.keys(storage.value.session).map(k => dataToTree(storage.value.session[k], k, 'session'))
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
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="data-tree-node">
            <b>{{ data.key }}</b> : 
            <span v-if="data.type">{{ data.type }}</span> 
            <span v-else-if="isString(data.data)" class="data-string">"{{ data.data }}"</span>
            <span v-else-if="isNumber(data.data)" class="data-number">{{ data.data }}</span>
            <span v-else-if="isBoolean(data.data)" class="data-boolean">{{ data.data }}</span>
            <span v-else-if="isNull(data.data)" class="data-null">null</span>
            <span v-else-if="isUnDef(data.data)" class="data-undefined">undefined</span>
            <span v-else class="data-empty">{{ data.data }}</span>
          </span>
        </template>
      </el-tree>
    </el-tab-pane>
    <el-tab-pane label="Session Storage" name="session">
      <el-tree
        :data="sessionTree"
        node-key="id"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="data-tree-node">
            <b>{{ data.key }}</b> : 
            <span v-if="data.type">{{ data.type }}</span> 
            <span v-else-if="isString(data.data)" class="data-string">"{{ data.data }}"</span>
            <span v-else-if="isNumber(data.data)" class="data-number">{{ data.data }}</span>
            <span v-else-if="isBoolean(data.data)" class="data-boolean">{{ data.data }}</span>
            <span v-else-if="isNull(data.data)" class="data-null">null</span>
            <span v-else-if="isUnDef(data.data)" class="data-undefined">undefined</span>
            <span v-else class="data-empty">{{ data.data }}</span>
          </span>
        </template>
      </el-tree>
    </el-tab-pane>
  </el-tabs>
</template>

<style>
body {
  background-color: var(--el-bg-color);
}
.el-tabs__content {
  overflow: auto;
}

::-webkit-scrollbar-track-piece {
    background: 0 0;
}
::-webkit-scrollbar-thumb {
    background-color: #b6c6ce;
    border: 3px solid transparent;
    background-clip: padding-box;
    border-radius: 5px;
}
.dark ::-webkit-scrollbar-thumb {
    background-color: #2c3e50;
}
::-webkit-scrollbar {
    width: 10px;
    height: 10px;
}
.data-tree-node {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
