<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
const isDark = useDark()
useToggle(isDark)

</script>

<template>
  <RouterView />
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
