<script setup lang="ts">
import { computed, ref } from 'vue';
import { useDark, useToggle } from '@vueuse/core'
import { isArray, isBoolean, isNull, isNumber, isObject, isString, isUnDef } from './utils/is';
import { Edit, CircleClose, Check, RefreshLeft, Remove } from '@element-plus/icons-vue';

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

  historyStorage.value[type] = data;
}

function parseStorage(s: string) {
  try {
    let data = JSON.parse(s);
    if (!isString(data)) s = data;
  } catch (error) {}
  return s;
}

const localTree = computed(() => 
  Object.keys(storage.value.local)
    .map(k => Object.assign({ parent: storage.value.local }, dataToTree(storage.value.local[k], k, 'local', k)))
)
const sessionTree = computed(() => 
  Object.keys(storage.value.session)
    .map(k => Object.assign({ parent: storage.value.session }, dataToTree(storage.value.session[k], k, 'session', k)))
)
function dataToTree(data: any, key: string, path: string, root: string): any {
  path = path + '.' + key;
  if (isObject(data)) return { 
    key, type: 'Object', root, path, data, children: Object.keys(data)
      .map(k => Object.assign({ parent: data }, dataToTree(data[k], k, path + '.' + k, root))) 
  };
  else if (isArray(data)) return {
    key, type: 'Array', path, root, data, children: data
      .map((d, i) => Object.assign({ parent: data }, dataToTree(d, i + '', path + '.' + i, root)))
  }
  else return { key, path, data, children: [], root } 
}
function toView(data: any) {
  return JSON.stringify(data);
}
function toData(data:any) {
  return isString(data) ? data : toView(data)
}

const editPath = ref<any>({})
const editValue = ref<any>({})
const editKey = ref<any>({})
const pushData = ref<any>({})
function refresh() {
  window.postMessage({
    message: 'send'
  }, '*')
}
function edit(node: any) {
  editValue.value[node.path] = toView(node.data)
  editKey.value[node.path] = node.key
  editPath.value[node.path] = true;
}
function remove(node: any) {
  let type = node.path.split('.')[0];
  if (node.path.replace(/^\w+\./, '') == node.key) {
    delete storage.value[type][node.root];
    removeEmit(type, node.root);
  } else {
    delete node.parent[node.key];
    updateEmit(type, node.root, toData(storage.value[type][node.root]))
  }
}
function push(node: any) {

}
function confirm(node: any) {
  try {
    if (editKey.value[node.path] != node.key) delete node.parent[node.key];
    let data = JSON.parse(editValue.value[node.path]);
    node.parent[editKey.value[node.path]] = data;
  } catch (error) {
    node.parent[node.key] = editValue.value[node.path];
  }
  editPath.value[node.path] = false;
  let type = node.path.split('.')[0];
  updateEmit(type, node.root, toData(storage.value[type][node.root]))
}
function updateEmit(type: string, key: string, data: string) {
  historyStorage.value[type][key] = data
  window.postMessage({
    message: 'setItem', data: { type, key, data }
  }, '*')
}
function removeEmit(type: string, key: string) {
  delete historyStorage.value[type][key];
  window.postMessage({
    message: 'removeItem', data: { type, key }
  }, '*')
}
const defaultExpandIds = ref<any>([])
function handleNodeExpand(data: any) {
  let flag = false
  defaultExpandIds.value.some((item: any) => {
    if (item === data.path) {
      flag = true
      return true
    }
  })
  if (!flag) {
    defaultExpandIds.value.push(data.path)
  }
}
function handleNodeCollapse(data: any) {
  defaultExpandIds.value.some((item: any, i: number) => {
    if (item === data.path) {
      defaultExpandIds.value.splice(i, 1)
    }
  })
  removeChildrenIds(data)
}
function removeChildrenIds(data: any) {
  if (data.children) {
    data.children.forEach(function(item: any) {
      const index = defaultExpandIds.value.indexOf(item.path)
      if (index > 0) {
        defaultExpandIds.value.splice(index, 1)
      }
      removeChildrenIds(item)
    })
  }
}

</script>

<template>
  <section class="wrapper">
    <div class="refresh">
      <el-button type="primary" size="large" :icon="RefreshLeft" link @click="refresh" />
    </div>
    <el-tabs
      v-model="activeName"
      type="card"
    >
      <el-tab-pane label="Local Storage" name="local">
        <el-tree
          :data="localTree"
          node-key="path"
          :expand-on-click-node="false"
          :default-expanded-keys="defaultExpandIds"
          @node-expand="handleNodeExpand"
          @node-collapse="handleNodeCollapse"
        >
          <template #default="{ node, data }">
            <span class="data-tree-node" :data-path="data.path" :data-key="data.key">
              <b class="key" v-if="!editPath[data.path]">{{ data.key }}</b>
              <el-input class="key" type="text" v-model="editKey[data.path]" v-if="editPath[data.path]" size="small"/>
              <span class="sp">: </span>
              <span v-if="data.type && editPath[data.path]">{{ data.type }}</span> 
              <span v-else class="value" v-if="!editPath[data.path]">
                <span v-if="isString(data.data)" class="data-string">"{{ data.data }}"</span>
                <span v-else-if="isNumber(data.data)" class="data-number">{{ data.data }}</span>
                <span v-else-if="isBoolean(data.data)" class="data-boolean">{{ data.data }}</span>
                <span v-else-if="isNull(data.data)" class="data-null">null</span>
                <span v-else-if="isUnDef(data.data)" class="data-undefined">undefined</span>
                <span v-else class="data-empty">{{ data.data }}</span>
              </span>
              <el-input type="text" v-model="editValue[data.path]" v-if="editPath[data.path]" size="small"/>
              <span class="action" v-if="!editPath[data.path]">
                <el-button type="primary" size="small" link @click="edit(data)">
                  <font-awesome-icon icon="fa-solid fa-pen" />
                </el-button>
                <el-button type="primary" size="small" link @click="remove(data)">
                  <font-awesome-icon icon="fa-solid fa-trash" />
                </el-button>
                <el-button type="primary" size="small" link @click="push(data)" v-if="data.type">
                  <font-awesome-icon icon="fa-solid fa-circle-plus" />
                </el-button>
              </span>
              <span class="confirm" v-if="editPath[data.path]">
                <el-button type="primary" size="small" link @click="editPath[data.path] = false">
                  <font-awesome-icon icon="fa-solid fa-circle-xmark" />
                </el-button>
                <el-button type="primary" size="small" link @click="confirm(data)">
                  <font-awesome-icon icon="fa-solid fa-floppy-disk" />
                </el-button>
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
              <b class="key" v-if="!editPath[data.path]">{{ data.key }}</b>
              <el-input class="key" type="text" v-model="editKey[data.path]" v-if="editPath[data.path]" size="small"/>
              <span class="sp">: </span>
              <span v-if="data.type">{{ data.type }}</span> 
              <span v-else class="value" v-if="!editPath[data.path]">
                <span v-if="isString(data.data)" class="data-string">"{{ data.data }}"</span>
                <span v-else-if="isNumber(data.data)" class="data-number">{{ data.data }}</span>
                <span v-else-if="isBoolean(data.data)" class="data-boolean">{{ data.data }}</span>
                <span v-else-if="isNull(data.data)" class="data-null">null</span>
                <span v-else-if="isUnDef(data.data)" class="data-undefined">undefined</span>
                <span v-else class="data-empty">{{ data.data }}</span>
              </span>
              <el-input type="text" v-model="editValue[data.path]" v-if="editPath[data.path]" size="small"/>
              <span class="action" v-if="!editPath[data.path]">
                <el-button type="primary" size="small" link :icon="Edit" @click="edit(data)"/>
                <el-button type="primary" size="small" link :icon="Remove" @click="edit(data)"/>
              </span>
              <span class="confirm" v-if="editPath[data.path]">
                <span><el-button type="primary" :icon="CircleClose" size="small" link @click="editPath[data.path] = false" /></span>
                <span><el-button type="primary" :icon="Check" size="small" link @click="confirm(data)" /></span>
              </span>
            </span>
          </template>
        </el-tree>
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<style lang="scss" scoped>
.data-tree-node {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  .key {
    color: #8128e8;
  }
  .sp {
    margin-right: .5em;
  }
  .action {
    display: none;
  }
  &:hover {
    .action {
      display: inline-block;
    }
  }
  .confirm {
    margin-left: 5px;
  }
}
.wrapper {
  position: relative;
}
.refresh {
  position: absolute;
  top: .5em;
  right: 1em;
  z-index: 100;
}
.refresh .el-button--large {
  font-size: 1.8em;
}
.dark {
  .data-tree-node {
    .key {
      color: #cea3f9;
    }
  }
}
</style>
