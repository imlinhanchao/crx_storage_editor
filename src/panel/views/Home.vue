<script lang="ts" setup>
import { ElTree } from 'element-plus';
import { computed, nextTick, ref, watch } from 'vue';
import { isArray, isBoolean, isNull, isNumber, isObject, isString, isUnDef } from '../utils/is';

const typeName = ref('local');
const storage = ref<any>({
  local: {} as any,
  session: {} as any,
});
const historyStorage = ref<any>({
  local: {} as any,
  session: {} as any,
});

document.getElementsByTagName('html')[0].classList.add('full')
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
    .map(k => Object.assign(
      { parent: storage.value.local, parentPath: 'local' }, 
      dataToTree(storage.value.local[k], k, 'local.' + k, k)
    )
  )
)
const sessionTree = computed(() => 
  Object.keys(storage.value.session)
    .map(k => Object.assign(
      { parent: storage.value.session, parentPath: 'session' }, 
      dataToTree(storage.value.session[k], k, 'session.' + k, k)
    )
  )
)
function dataToTree(data: any, key: string, path: string, root: string): any {
  if (isObject(data)) return { 
    key, type: 'Object', root, path, data, children: Object.keys(data)
      .map(k => Object.assign({ parent: data, parentPath: path }, dataToTree(data[k], k, path + '.' + k, root))) 
  };
  else if (isArray(data)) return {
    key, type: 'Array', path, root, data, children: data
      .map((d: any, i: number) => Object.assign({ parent: data, parentPath: path }, dataToTree(d, i + '', path + '.' + i, root)))
  }
  else return { key, path, data, children: [], root } 
}
function toView(data: any) {
  if (data === undefined) return '';
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
function clear(type: string) {
  Object.keys(storage.value[type]).forEach(k => {
    delete storage.value[type][k];
    removeEmit(type, k);
  })
}
function getProps(obj: any) {
  let i = 1;
  while (obj[`prop${i}`]) i++;
  return `prop${i}`;
}
function isRoot(node: any) {
  return node.parent == storage.value.local || node.parent == storage.value.session;
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
  let key: any, path: any;
  if (isArray(node.data)) {
    key = node.data.length;
    node.data.push('');
  } else if (isObject(node.data)) {
    key = getProps(node.data) 
    node.data[key] = '';
  }
  path = node.path + '.' + key
  if (!defaultExpandIds.value.includes(path)) defaultExpandIds.value.push(node.path);
  pushData.value[path] = true;
  edit({ path, key });
}
function cancel(node:any) {
  editPath.value[node.path] = false;
  if (pushData.value[node.path]) {
    delete node.parent[node.key];
    delete pushData.value[node.path]
  }
}
function confirm(node: any) {
  let type = node.path.split('.')[0];
  if (editKey.value[node.path] != node.key) delete node.parent[node.key];
  if (isRoot(node)) {
    removeEmit(type, node.root);
    node.root = editKey.value[node.path];
  }
  try {
    let data = JSON.parse(editValue.value[node.path]);
    node.parent[editKey.value[node.path]] = data;
  } catch (error) {
    node.parent[node.key] = editValue.value[node.path];
  }
  editPath.value[node.path] = false;
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
function expandOrCollapse(data: any) {
  const expandIndex = defaultExpandIds.value.findIndex((item: any) => item === data.path)
  if (expandIndex < 0) defaultExpandIds.value.push(data.path)
  else {
    defaultExpandIds.value.splice(expandIndex, 1);
    collapseChildren(data)
  }
}

function collapseChildren(data: any) {
  if (data.children) {
    data.children.forEach(function(item: any) {
      const index = defaultExpandIds.value.indexOf(item.path)
      if (index > 0) {
        defaultExpandIds.value.splice(index, 1)
      }
      collapseChildren(item)
    })
  }
}

const searchValue = ref<any>({
  local: '',
  session: ''
})
const search = (value: string, node: any) => {
  if (!value) return true
  return node.key.includes(value) || node.data?.toString().includes(value)
}
const tabData = [
  {
    name: 'local',
    label: 'Local Storage',
    data: localTree,
  },
  {
    name: 'session',
    label: 'Session Storage',
    data: sessionTree,
  }
]

const treeRef = ref<{ [key: string]: InstanceType<typeof ElTree> }>({});
function setTreeRef(el: InstanceType<typeof ElTree>, key: string) {
  if (el) treeRef.value[key] = el;
}
watch(() => searchValue.value.local, (val) => {
  treeRef.value.local?.filter(val)
})
watch(() => searchValue.value.session, (val) => {
  treeRef.value.session?.filter(val)
})

</script>
<template>
  <section class="wrapper">
    <div class="toolbar">
      <img src="/logo.png" />
      <span>
        <el-button type="primary" size="large" link @click="clear(typeName)">
          <font-awesome-icon icon="fa-solid fa-ban" />
        </el-button>
        <el-button type="primary" size="large" link @click="push({ data: storage[typeName], path: typeName })">
          <font-awesome-icon icon="fa-solid fa-circle-plus" />
        </el-button>
        <el-button class="transform" type="primary" size="large" link @click="refresh">
          <font-awesome-icon icon="fa-solid fa-rotate-right" />
        </el-button>
      </span>
    </div>
    <el-tabs
      v-model="typeName"
      type="card"
    >
      <el-tab-pane v-for="t in tabData" :key="t.name" :label="t.label" :name="t.name">
        <el-input v-model="searchValue[typeName]" placeholder="Search" />
        <el-tree
          :ref="(el) => setTreeRef(el as InstanceType<typeof ElTree>, t.name)"
          :data="t.data.value"
          node-key="path"
          :expand-on-click-node="true"
          :default-expanded-keys="defaultExpandIds"
          @node-expand="expandOrCollapse"
          @node-collapse="expandOrCollapse"
          :filter-node-method="search"
        >
          <template #default="{ node, data }">
            <span class="data-tree-node" :data-path="data.path" :data-key="data.key">
              <b class="key" v-if="!editPath[data.path] || isArray(data.parent)">{{ data.key }}</b>
              <el-input
                class="key"
                type="text"
                @click.stop="(e: Event) => e.stopPropagation()"
                @keydown.esc="cancel(data)"
                @keydown.enter="confirm(data)"
                v-model="editKey[data.path]"
                v-if="!isArray(data.parent) && editPath[data.path]"
                size="small"
              />
              <span class="sp">: </span>
              <span v-if="data.type && !editPath[data.path]">{{ data.type }}</span> 
              <span v-else class="value" v-if="!editPath[data.path]" :title="toView(data.data)">
                <span v-if="isString(data.data)" class="data-string">"{{ data.data }}"</span>
                <span v-else-if="isNumber(data.data)" class="data-number">{{ data.data }}</span>
                <span v-else-if="isBoolean(data.data)" class="data-boolean">{{ data.data }}</span>
                <span v-else-if="isNull(data.data)" class="data-null">null</span>
                <span v-else-if="isUnDef(data.data)" class="data-undefined">undefined</span>
                <span v-else class="data-empty">{{ data.data }}</span>
              </span>
              <el-input
                type="text"
                v-model="editValue[data.path]"
                @click.stop="(e: Event) => e.stopPropagation()"
                @keydown.esc="cancel(data)"
                @keydown.enter="confirm(data)"
                v-if="editPath[data.path]"
                size="small"
              />
              <span class="action" v-if="!editPath[data.path]" @click.stop="(e: Event) => e.stopPropagation()">
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
              <span class="confirm" v-if="editPath[data.path]" @click.stop="(e: Event) => e.stopPropagation()">
                <el-button type="primary" size="small" link @click="cancel(data)">
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
    </el-tabs>
  </section>
</template>
<style lang="scss" scoped>
.data-tree-node {
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  .key {
    color: #42b983; //#8128e8;
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
  .value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.wrapper {
  position: relative;
  height: 100%;
}
.toolbar {
  position: absolute;
  top: .5em;
  left: 1em;
  right: 1em;
  display: flex;
  justify-content: space-between;
  justify-items: center;
  img {
    width: 25px;
    height: 25px;
  }
  span {
    z-index: 100;
  }
 .el-button--large {
    font-size: 1.8em;
    transition: all .3s;
    &:hover, &:focus {
      background-color: transparent;
    }
    &:hover, &:active {
      color: var(--el-color-primary);
    }
    &.transform {
      &:active {
        --tw-translate-x: 0;
        --tw-translate-y: 0;
        --tw-rotate: 360deg;
        --tw-skew-x: 0;
        --tw-skew-y: 0;
        --tw-scale-x: 1;
        --tw-scale-y: 1;
        transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
        transform-origin: center;
      }
    }
 }
}
.dark {
  .data-tree-node {
    .key {
      color: #42b983;// #cea3f9;
    }
  }
}
</style>