<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { isArray, isBoolean, isNull, isNumber, isObject, isString, isUnDef } from './utils/is';
import { EditPen } from '@element-plus/icons-vue';

const isDark = useDark()
useToggle(isDark)

const activeName = ref('local');
const storage = ref<any>({
  local: {} as any,
  session: {} as any,
});
const historyStorage = ref<any>({
  local: {} as any,
  session: {} as any,
});

window.addEventListener('message', (ev) => {
  let request = ev.data;
  if (request.from != '__devtools_storage_editor') return;
  switch(request.message) {
    case 'update':
      updateStorage(request);
      break;
  }
})

function updateStorage({type, data}: { type: string, data: any }) {
  let oldStorageValue = historyStorage.value[type];
  let oldStorage = storage.value[type];

  let newKeys = Object.keys(data);
  let oldKeys = Object.keys(oldStorage);
  oldKeys.forEach(k => {
    if (!newKeys.includes(k)) delete oldStorage[k];
    else if (oldStorageValue[k] != data[k]) oldStorage[k] = parseStorage(data[k]);
  })

  newKeys.forEach(k => {
    if (!oldKeys.includes(k)) oldStorage[k] = parseStorage(data[k]);
  })

  oldStorageValue = data;
}

function parseStorage(s: string) {
  try {
    let data = JSON.parse(s);
    if (!isString(data)) s = data;
  } catch (error) {}
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
    key, type: 'Object', path, children: Object.keys(data)
      .map(k => Object.assign({ parent: data }, dataToTree(data[k], k, path + '.' + k))) 
  };
  else if (isArray(data)) return {
    key, type: 'Array', path, children: data.map((d, i) => dataToTree(d, i + '', path + '.' + i)) 
  }
  else return { key, __key: key, path, data, view: toView(data), children: [] } 
}
function toView(data: any) {
  return JSON.stringify(data);
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
        node-key="path"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span class="data-tree-node">
            <b class="key" v-if="!data.edit">{{ data.key }}</b>
            <el-input class="key" type="text" v-model="data.key" v-if="data.edit" size="small"/>
            <span class="sp">: </span>
            <span v-if="data.type">{{ data.type }}</span> 
            <span v-else class="value" v-if="!data.edit">
              <span v-if="isString(data.data)" class="data-string">"{{ data.data }}"</span>
              <span v-else-if="isNumber(data.data)" class="data-number">{{ data.data }}</span>
              <span v-else-if="isBoolean(data.data)" class="data-boolean">{{ data.data }}</span>
              <span v-else-if="isNull(data.data)" class="data-null">null</span>
              <span v-else-if="isUnDef(data.data)" class="data-undefined">undefined</span>
              <span v-else class="data-empty">{{ data.data }}</span>
            </span>
            <el-input type="text" v-model="data.view" v-if="data.edit" size="small"/>
            <span class="action" v-if="!data.type">
              <el-button type="primary" :icon="EditPen" size="small" link @click="data.edit = true" />
            </span>
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
            <b class="key">{{ data.key }}</b> : 
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
  font-family: 'Roboto Mono', Menlo, Consolas, monospace;
}
* {
  font-family: inherit;
}
.el-input__inner {
  color: inherit;
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
  display: flex;
  align-items: center;
}
.data-tree-node .key {
  color: #cea3f9;
}
.data-tree-node .sp {
  margin-right: .5em;
}
.action {
  display: none;
}
.data-tree-node:hover .action {
  display: inline-block;
}
</style>
