<script setup lang="ts">
  import { isArray } from '../utils/is';
  import { computed, ref } from 'vue';

  const visible = ref(false);
  const emit = defineEmits<{
    (event: 'confirm', value: string): void;
  }>();

  const data = ref<string>('');
  const nodeData = ref<any>({});
  const nodeKey = ref<string>('');
  let confirmFn: ((key:string, val: string) => boolean) | undefined;
  const open = (node: any, fn?: (key:string, val: string) => boolean) => {
    visible.value = true;
    nodeData.value = node;
    nodeKey.value = node.key;
    data.value = JSON.stringify(node.data, null, 4);
    confirmFn = fn;
  }

  const close = () => {
    visible.value = false;
  };

  const confirm = () => {
    try {
      JSON.parse(data.value);
    } catch (err: any) {
      error.value = err.message;
      return;
    }
    emit('confirm', data.value);
    if(false === confirmFn?.(nodeKey.value, data.value)) return;
    close();
  };

  function getNodeKey(node: any): string {
    if(!isArray(node.parent)) {
      return node.key;
    }
    return `${node.parentPath.split('.').slice(1).map((k: string) => k.match(/^\d+$/) ? `[${k}]` : `${k}.`).join('')}[${node.key}]`.replace(/\.\[/, '[');
  }

  defineExpose({
    open,
  });

  const error = ref('')
  
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`Edit ${nodeKey}`"
    width="50%"
    :before-close="close"
    fullscreen
    :show-close="false"
  >
    <template #header>
      <section class="header">
        <span class="title">
          <img src="/logo.png" />
          <span>Edit</span>
          <span class="key" v-if="!isArray(nodeData.parent)">
              <el-input
              class="key"
              type="text"
              v-model="nodeKey"
              
              size="small"
            />
          </span>
          <span class="key" v-else>
            {{ getNodeKey(nodeData) }}
          </span>
        </span>
        <section class="action">
          <el-button type="primary" @click="close">
            <font-awesome-icon icon="fa-solid fa-circle-xmark" />&nbsp;Cancel
          </el-button>
          <el-button type="primary" @click="confirm">
            <font-awesome-icon icon="fa-solid fa-floppy-disk"/>&nbsp;Save
          </el-button>
        </section>
      </section>
    </template>
    <el-container direction="vertical">
      <p class="error" v-if="error">{{ error }}</p>
      <el-input
        v-model="data"
        type="textarea"
        :autosize="{ minRows: 2 }"
      />
    </el-container>
  </el-dialog>
</template>

<style scoped lang="scss">
  .key {
    color: #42b983;
    width: 100%;
    font-size: 95%;
    height: 100%;
  }
  .error {
    color: red;
  }
  .header {
    display: flex;
    justify-content: space-between;
    .title { 
      font-size: 200%; 
      display: flex;
      align-items: center;
      width: 100%;
      * {
        margin-right: .5em;
      }
      img {
        width: 25px;
        height: 25px;
      }
    }
    .action {
      display: flex;
    }
  }
</style>